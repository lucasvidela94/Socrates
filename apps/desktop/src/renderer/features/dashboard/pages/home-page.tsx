import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/shared/components/page-container";
import { PageHeader } from "@/shared/components/page-header";
import { BookOpen, MessageSquare, Sparkles } from "lucide-react";

export const HomePage = (): ReactElement => {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    void window.electronAPI?.getAppInfo().then((info) => {
      setVersion(info.version);
    });
  }, []);

  return (
    <PageContainer>
      <PageHeader title="Sócrates" description="Asistente docente para planificación y seguimiento." />

      {version !== null && (
        <p className="text-sm text-muted-foreground mb-6">Versión {version}</p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" />
              Enfoque
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Reducir la carga de planificación y seguimiento para quienes gestionan muchas
            aulas o turnos, con ayuda práctica en el día a día.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4" />
              Próximo paso
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Recibí propuestas de criterios, planes, tareas y adecuaciones con el contexto
            de tus aulas. Revisás, ajustás y guardás.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4" />
              Hoja de ruta
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Cargá aulas, alumnos y devoluciones semanales para que la herramienta acumule
            contexto y te ahorre tiempo sin reemplazar tu criterio.
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};
