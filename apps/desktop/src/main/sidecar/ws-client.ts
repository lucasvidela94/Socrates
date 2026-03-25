import WebSocket from "ws";

type MessageHandler = (event: string, payload: Record<string, unknown>) => void;

interface PhoenixMessage {
  topic: string;
  event: string;
  payload: Record<string, unknown>;
  ref: string | null;
  joinRef: string | null;
}

const HEARTBEAT_INTERVAL = 30_000;
const RECONNECT_DELAY = 2_000;
const REQUEST_TIMEOUT = 120_000;

export class SocratesWSClient {
  private ws: WebSocket | null = null;
  private port: number;
  private refCounter = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private joinRef: string | null = null;
  private handlers: Map<string, MessageHandler[]> = new Map();
  private pendingRequests: Map<string, {
    resolve: (content: string) => void;
    reject: (err: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  }> = new Map();
  private shouldReconnect = true;

  constructor(port: number) {
    this.port = port;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `ws://127.0.0.1:${this.port}/socket/websocket?vsn=2.0.0`;
      this.ws = new WebSocket(url);

      this.ws.on("open", () => {
        this.startHeartbeat();
        this.joinChannel("agent:lobby")
          .then(() => resolve())
          .catch(reject);
      });

      this.ws.on("message", (data: WebSocket.Data) => {
        try {
          const parsed = this.decodeMessage(data.toString());
          if (parsed !== null) this.handleMessage(parsed);
        } catch {
          // malformed
        }
      });

      this.ws.on("close", () => {
        this.cleanup();
        if (this.shouldReconnect) {
          setTimeout(() => {
            void this.connect().catch((err: Error) => {
              console.error("[ws-client] reconnect failed:", err.message);
            });
          }, RECONNECT_DELAY);
        }
      });

      this.ws.on("error", (err) => {
        console.error("[ws-client] error:", err.message);
        if (this.ws?.readyState !== WebSocket.OPEN) {
          reject(err);
        }
      });
    });
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.cleanup();
    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      pending.reject(new Error("Disconnected"));
    }
    this.pendingRequests.clear();
    this.ws?.close();
    this.ws = null;
  }

  on(event: string, handler: MessageHandler): void {
    const existing = this.handlers.get(event) ?? [];
    existing.push(handler);
    this.handlers.set(event, existing);
  }

  off(event: string, handler: MessageHandler): void {
    const existing = this.handlers.get(event) ?? [];
    this.handlers.set(event, existing.filter((h) => h !== handler));
  }

  async sendRequestAndWait(
    agentType: string,
    message: string,
    context: Record<string, unknown> = {}
  ): Promise<string> {
    const requestId = `req_${Date.now()}_${this.refCounter}`;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error("Timeout esperando respuesta del agente"));
      }, REQUEST_TIMEOUT);

      this.pendingRequests.set(requestId, { resolve, reject, timer });

      this.send("agent:lobby", "request", {
        agentType,
        message,
        context,
        requestId,
      });
    });
  }

  async sendVerifyAndWait(content: string, context: Record<string, unknown> = {}): Promise<string> {
    const requestId = `req_${Date.now()}_${this.refCounter}`;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error("Timeout esperando respuesta del agente"));
      }, REQUEST_TIMEOUT);

      this.pendingRequests.set(requestId, { resolve, reject, timer });

      this.send("agent:lobby", "verify", {
        content,
        context,
        requestId,
      });
    });
  }

  async configureLlm(config: Record<string, unknown>): Promise<void> {
    this.send("agent:lobby", "configure_llm", config);
  }

  private send(
    topic: string,
    event: string,
    payload: Record<string, unknown>
  ): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn("[ws-client] Not connected, cannot send");
      return;
    }

    const msg: PhoenixMessage = {
      topic,
      event,
      payload,
      ref: this.nextRef(),
      joinRef: this.joinRef,
    };

    this.ws.send(this.encodeMessage(msg));
  }

  private joinChannel(topic: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const ref = this.nextRef();
      this.joinRef = ref;

      const msg: PhoenixMessage = {
        topic,
        event: "phx_join",
        payload: {},
        ref,
        joinRef: ref,
      };

      const timeout = setTimeout(() => {
        reject(new Error(`Timeout joining ${topic}`));
      }, 5000);

      const onMessage = (data: WebSocket.Data) => {
        try {
          const resp = this.decodeMessage(data.toString());
          if (resp === null) return;
          if (resp.ref === ref && resp.event === "phx_reply") {
            clearTimeout(timeout);
            this.ws?.off("message", onMessage);
            const status = (resp.payload as Record<string, unknown>)["status"];
            if (status === "ok") {
              resolve();
            } else {
              reject(new Error(`Failed to join ${topic}: ${JSON.stringify(resp.payload)}`));
            }
          }
        } catch {
          // ignore
        }
      };

      this.ws?.on("message", onMessage);
      this.ws?.send(this.encodeMessage(msg));
    });
  }

  private handleMessage(msg: PhoenixMessage): void {
    if (msg.event === "phx_reply" || msg.event === "phx_close") return;

    if (msg.event === "response") {
      const requestId = msg.payload["requestId"] as string | undefined;
      const content = msg.payload["content"] as string;
      if (requestId && this.pendingRequests.has(requestId)) {
        const pending = this.pendingRequests.get(requestId)!;
        clearTimeout(pending.timer);
        this.pendingRequests.delete(requestId);
        pending.resolve(content);
        return;
      }
    }

    if (msg.event === "error") {
      const requestId = msg.payload["requestId"] as string | undefined;
      const reason = msg.payload["reason"] as string;
      if (requestId && this.pendingRequests.has(requestId)) {
        const pending = this.pendingRequests.get(requestId)!;
        clearTimeout(pending.timer);
        this.pendingRequests.delete(requestId);
        pending.reject(new Error(reason));
        return;
      }
    }

    const handlers = this.handlers.get(msg.event) ?? [];
    for (const handler of handlers) {
      handler(msg.event, msg.payload);
    }

    const allHandlers = this.handlers.get("*") ?? [];
    for (const handler of allHandlers) {
      handler(msg.event, msg.payload);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.send("phoenix", "heartbeat", {});
    }, HEARTBEAT_INTERVAL);
  }

  private cleanup(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private nextRef(): string {
    this.refCounter += 1;
    return String(this.refCounter);
  }

  private encodeMessage(msg: PhoenixMessage): string {
    return JSON.stringify([msg.joinRef, msg.ref, msg.topic, msg.event, msg.payload]);
  }

  private decodeMessage(raw: string): PhoenixMessage | null {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length < 5) return null;

    const [joinRef, ref, topic, event, payload] = parsed;
    if (typeof topic !== "string" || typeof event !== "string") return null;
    if (payload === null || typeof payload !== "object") return null;

    return {
      joinRef: typeof joinRef === "string" ? joinRef : null,
      ref: typeof ref === "string" ? ref : null,
      topic,
      event,
      payload: payload as Record<string, unknown>,
    };
  }
}
