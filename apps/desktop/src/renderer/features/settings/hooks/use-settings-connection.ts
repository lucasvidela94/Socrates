import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getApi } from "@/shared/lib/get-api";
import type { LlmConfigInput } from "@shared/types";
import { PROVIDERS, GEMINI_MODELS, type ProviderKey } from "../lib/settings-providers";

export interface ConnectionState {
  existingId: string | null;
  connectedProvider: string | null;
  connectedModel: string | null;
}

export interface ManualFormState {
  provider: ProviderKey;
  model: string;
  apiKey: string;
  baseUrl: string;
}

export const useSettingsConnection = () => {
  const [connection, setConnection] = useState<ConnectionState>({
    existingId: null,
    connectedProvider: null,
    connectedModel: null,
  });

  const [manual, setManual] = useState<ManualFormState>({
    provider: "openai",
    model: "",
    apiKey: "",
    baseUrl: "",
  });

  const [geminiKey, setGeminiKey] = useState("");
  const [geminiModel, setGeminiModel] = useState<string>(GEMINI_MODELS[0]);

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [geminiSaving, setGeminiSaving] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const selectedProvider = PROVIDERS.find((p) => p.id === manual.provider)!;

  const loadConfig = useCallback(async () => {
    try {
      const config = (await window.electronAPI?.getLlmConfig()) ?? null;
      if (config !== null) {
        setManual({
          provider: config.provider as ProviderKey,
          model: config.model,
          apiKey: config.apiKey ?? "",
          baseUrl: config.baseUrl ?? "",
        });
        setConnection({
          existingId: config.id,
          connectedProvider: config.provider,
          connectedModel: config.model,
        });
      }
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  const setConnected = (id: string, provider: string, model: string) => {
    setConnection({ existingId: id, connectedProvider: provider, connectedModel: model });
  };

  const buildManualInput = (): LlmConfigInput => ({
    provider: manual.provider,
    model: manual.model,
    apiKey: manual.apiKey || undefined,
    baseUrl: manual.baseUrl || selectedProvider.baseUrl,
  });

  const saveManual = async () => {
    setSaving(true);
    try {
      const api = getApi();
      const saved = await api.saveLlmConfig(buildManualInput());
      setConnected(saved.id, saved.provider, saved.model);
      toast.success("Conexión guardada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const testManual = async () => {
    setTesting(true);
    try {
      const api = getApi();
      const result = await api.testLlmConnection(buildManualInput());
      result.ok ? toast.success("Conexión correcta") : toast.error(result.error ?? "No se pudo conectar");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setTesting(false);
    }
  };

  const disconnect = async () => {
    if (connection.existingId === null) return;
    try {
      const api = getApi();
      await api.deleteLlmConfig(connection.existingId);
      setManual({ provider: "openai", model: "", apiKey: "", baseUrl: "" });
      setConnection({ existingId: null, connectedProvider: null, connectedModel: null });
      toast.success("Conexión eliminada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    }
  };

  const connectOAuth = async () => {
    setOauthLoading(true);
    try {
      const api = getApi();
      const result = await api.oauthStartOpenRouter();
      if (result.ok) {
        await loadConfig();
        toast.success("Conectado con OpenRouter");
      } else {
        toast.error(result.error ?? "No se pudo conectar");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al conectar");
    } finally {
      setOauthLoading(false);
    }
  };

  const connectGemini = async () => {
    if (geminiKey.trim() === "") return;
    setGeminiSaving(true);
    const loadingId = toast.loading("Verificando clave de Gemini...");
    try {
      const api = getApi();
      const geminiProvider = PROVIDERS.find((p) => p.id === "gemini")!;
      const input: LlmConfigInput = {
        provider: "gemini",
        model: geminiModel,
        apiKey: geminiKey.trim(),
        baseUrl: geminiProvider.baseUrl,
      };
      const testResult = await api.testLlmConnection(input);
      if (!testResult.ok) {
        toast.error(testResult.error ?? "La clave no funciona. Verificá que esté bien copiada.", { id: loadingId });
        return;
      }
      const saved = await api.saveLlmConfig(input);
      setConnected(saved.id, saved.provider, saved.model);
      toast.success("Conectado a Gemini gratis", { id: loadingId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al conectar con Gemini", { id: loadingId });
    } finally {
      setGeminiSaving(false);
    }
  };

  const updateManual = (patch: Partial<ManualFormState>) => {
    setManual((prev) => ({ ...prev, ...patch }));
  };

  return {
    connection,
    manual,
    updateManual,
    selectedProvider,
    geminiKey,
    setGeminiKey,
    geminiModel,
    setGeminiModel,
    saving,
    testing,
    geminiSaving,
    oauthLoading,
    saveManual,
    testManual,
    disconnect,
    connectOAuth,
    connectGemini,
  };
};
