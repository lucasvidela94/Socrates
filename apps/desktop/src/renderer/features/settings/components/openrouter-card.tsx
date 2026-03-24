import type { ReactElement } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ExternalLink, Loader2 } from "lucide-react";

interface Props {
  loading: boolean;
  onConnect: () => void;
}

export const OpenRouterCard = ({ loading, onConnect }: Props): ReactElement => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Conexión rápida — OpenRouter
        </CardTitle>
        <CardDescription>
          Un click para conectarte. Creás una cuenta gratis y solo pagás por lo que
          usás (unos pocos dólares al mes). Acceso a GPT, Claude, Gemini y más.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          size="lg"
          className="w-full"
          variant="outline"
          onClick={onConnect}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
          {loading ? "Esperando autorización..." : "Conectarme con OpenRouter"}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Se abre el navegador para iniciar sesión. Podés usar Google, GitHub o email.
        </p>
      </CardContent>
    </Card>
  );
};
