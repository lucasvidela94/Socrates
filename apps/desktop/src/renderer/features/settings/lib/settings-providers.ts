export const GEMINI_STUDIO_URL = "https://aistudio.google.com/app/apikey";

export const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
] as const;

export const PROVIDERS = [
  {
    id: "openai",
    label: "OpenAI",
    description: "GPT-4o, GPT-4o mini",
    baseUrl: "https://api.openai.com/v1",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
    keyPlaceholder: "sk-...",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    description: "Acceso a múltiples motores con una sola cuenta",
    baseUrl: "https://openrouter.ai/api/v1",
    models: [
      "openai/gpt-4o",
      "openai/gpt-4o-mini",
      "anthropic/claude-sonnet-4-20250514",
      "anthropic/claude-3.5-haiku",
      "google/gemini-2.0-flash-001",
      "meta-llama/llama-3.1-70b-instruct",
      "mistralai/mistral-large-latest",
    ],
    keyPlaceholder: "sk-or-...",
  },
  {
    id: "gemini",
    label: "Google Gemini",
    description: "Gemini 2.5 Flash/Pro — gratis con cuenta de Google",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    models: [...GEMINI_MODELS],
    keyPlaceholder: "AIza...",
  },
] as const;

export type ProviderKey = (typeof PROVIDERS)[number]["id"];

export const PROVIDER_LABELS: Record<string, string> = {
  openrouter: "OpenRouter",
  openai: "OpenAI",
  gemini: "Google Gemini",
};
