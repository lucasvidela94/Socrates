import type { ReactElement } from "react";
import { Breadcrumb } from "@/shared/components/breadcrumb";
import { PageContainer } from "@/shared/components/page-container";
import { PageHeader } from "@/shared/components/page-header";
import { BREADCRUMB_MAP, ROUTES } from "@shared/lib/routes";
import { useSettingsConnection } from "../hooks/use-settings-connection";
import { ConnectionStatusCard } from "../components/connection-status-card";
import { GeminiCard } from "../components/gemini-card";
import { OpenRouterCard } from "../components/openrouter-card";
import { ManualCard } from "../components/manual-card";

export const SettingsPage = (): ReactElement => {
  const c = useSettingsConnection();

  return (
    <PageContainer>
      <Breadcrumb items={BREADCRUMB_MAP[ROUTES.SETTINGS]} />
      <PageHeader title="Conexión de IA" description="Modelo y credenciales para los asistentes." />

      <ConnectionStatusCard
        connection={c.connection}
        onDisconnect={() => void c.disconnect()}
      />

      <div className="grid gap-6 max-w-lg">
        <GeminiCard
          geminiKey={c.geminiKey}
          onGeminiKeyChange={c.setGeminiKey}
          geminiModel={c.geminiModel}
          onGeminiModelChange={c.setGeminiModel}
          saving={c.geminiSaving}
          onConnect={() => void c.connectGemini()}
        />
        <OpenRouterCard
          loading={c.oauthLoading}
          onConnect={() => void c.connectOAuth()}
        />
        <ManualCard
          form={c.manual}
          onChange={c.updateManual}
          saving={c.saving}
          testing={c.testing}
          onSave={() => void c.saveManual()}
          onTest={() => void c.testManual()}
        />
      </div>
    </PageContainer>
  );
};
