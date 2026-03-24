import type { ReactElement } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gift, ExternalLink, Loader2, CheckCircle } from "lucide-react";
import { GEMINI_STUDIO_URL, GEMINI_MODELS } from "../lib/settings-providers";

interface Props {
  geminiKey: string;
  onGeminiKeyChange: (v: string) => void;
  geminiModel: string;
  onGeminiModelChange: (v: string) => void;
  saving: boolean;
  onConnect: () => void;
}

export const GeminiCard = ({
  geminiKey,
  onGeminiKeyChange,
  geminiModel,
  onGeminiModelChange,
  saving,
  onConnect,
}: Props): ReactElement => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Opción gratuita — Google Gemini
        </CardTitle>
        <CardDescription>
          Usá Gemini gratis con tu cuenta de Google. Solo necesitás crear una clave en 3 pasos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
          <li>
            <Button
              variant="link"
              className="h-auto p-0 text-sm"
              onClick={() => window.open(GEMINI_STUDIO_URL, "_blank")}
            >
              Abrí Google AI Studio
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
            {" "}e iniciá sesión con tu cuenta de Google.
          </li>
          <li>Hacé click en <strong>"Create API Key"</strong> y copiá la clave.</li>
          <li>Pegala acá abajo y listo.</li>
        </ol>

        <div className="space-y-2">
          <Label htmlFor="gemini-key">Clave de Gemini</Label>
          <Input
            id="gemini-key"
            type="password"
            value={geminiKey}
            onChange={(e) => onGeminiKeyChange(e.target.value)}
            placeholder="AIza..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gemini-model">Motor</Label>
          <Select value={geminiModel} onValueChange={onGeminiModelChange}>
            <SelectTrigger id="gemini-model">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GEMINI_MODELS.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Flash es rápido y gratuito. Pro es más potente (5 consultas por minuto gratis).
          </p>
        </div>

        <Button
          className="w-full"
          onClick={onConnect}
          disabled={saving || geminiKey.trim() === ""}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
          {saving ? "Verificando..." : "Conectar Gemini"}
        </Button>
      </CardContent>
    </Card>
  );
};
