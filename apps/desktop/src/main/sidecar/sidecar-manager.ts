import { spawn, type ChildProcess } from "child_process";
import * as path from "path";
import { app } from "electron";
import { findFreePort } from "./port-finder";
import { SocratesWSClient } from "./ws-client";

const isDev = process.env.NODE_ENV === "development";
const HEALTH_POLL_INTERVAL = 1000;
const HEALTH_MAX_RETRIES = 30;

let sidecarProcess: ChildProcess | null = null;
let wsClient: SocratesWSClient | null = null;
let assignedPort: number | null = null;

const getElixirBinaryPath = (): string => {
  if (isDev) {
    return "mix";
  }
  const resourcesPath = process.resourcesPath ?? app.getAppPath();
  return path.join(resourcesPath, "agents", "socrates_agents");
};

const getSidecarArgs = (): string[] => {
  if (isDev) {
    return ["phx.server"];
  }
  return ["start"];
};

const getSidecarCwd = (): string | undefined => {
  if (isDev) {
    return path.join(app.getAppPath(), "..", "agents");
  }
  return undefined;
};

const waitForHealth = async (port: number): Promise<boolean> => {
  for (let i = 0; i < HEALTH_MAX_RETRIES; i++) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (response.ok) return true;
    } catch {
      // not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, HEALTH_POLL_INTERVAL));
  }
  return false;
};

export const startSidecar = async (): Promise<SocratesWSClient> => {
  if (wsClient !== null) return wsClient;

  const port = await findFreePort();
  assignedPort = port;

  const binary = getElixirBinaryPath();
  const args = getSidecarArgs();
  const cwd = getSidecarCwd();

  console.log(`Starting sidecar: ${binary} ${args.join(" ")} on port ${port}`);

  const env = {
    ...process.env,
    PORT: String(port),
    PHX_SERVER: "true",
    MIX_ENV: isDev ? "dev" : "prod"
  };

  sidecarProcess = spawn(binary, args, {
    cwd,
    env,
    stdio: ["ignore", "pipe", "pipe"]
  });

  sidecarProcess.stdout?.on("data", (data: Buffer) => {
    console.log(`[agents] ${data.toString().trim()}`);
  });

  sidecarProcess.stderr?.on("data", (data: Buffer) => {
    console.error(`[agents] ${data.toString().trim()}`);
  });

  sidecarProcess.on("exit", (code) => {
    console.log(`Sidecar exited with code ${code}`);
    sidecarProcess = null;
    wsClient = null;
  });

  const healthy = await waitForHealth(port);
  if (!healthy) {
    throw new Error(`Sidecar failed to start on port ${port}`);
  }

  wsClient = new SocratesWSClient(port);
  await wsClient.connect();

  console.log(`Sidecar connected on port ${port}`);
  return wsClient;
};

export const stopSidecar = (): void => {
  if (wsClient !== null) {
    wsClient.disconnect();
    wsClient = null;
  }
  if (sidecarProcess !== null) {
    sidecarProcess.kill("SIGTERM");
    sidecarProcess = null;
  }
  assignedPort = null;
};

export const getSidecarClient = (): SocratesWSClient | null => wsClient;
export const getSidecarPort = (): number | null => assignedPort;
