import { useState, type ReactElement } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { PROVIDERS, type ProviderKey } from "../lib/settings-providers";
import type { ManualFormState } from "../hooks/use-settings-connection";

interface Props {
  form: ManualFormState;
  onChange: (patch: Partial<ManualFormState>) => void;
  saving: boolean;
  testing: boolean;
  onSave: () => void;
  onTest: () => void;
}

export const ManualCard = ({ form, onChange, saving, testing, onSave, onTest }: Props): ReactElement => {
  const [open, setOpen] = useState(false);
  const selected = PROVIDERS.find((p) => p.id === form.provider)!;

  return (
    <div>
      <button
        type="button"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        onClick={() => setOpen(!open)}
      >
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        Configuración manual (avanzado)
      </button>

      {open && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Servicio de IA manual</CardTitle>
            <CardDescription>
              Si ya tenés una clave de OpenAI u otro servicio, podés ingresarla acá.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Servicio</Label>
              <Select
                value={form.provider}
                onValueChange={(v: string) =>
                  onChange({ provider: v as ProviderKey, model: "", baseUrl: "" })
                }
              >
                <SelectTrigger id="provider">
                  <SelectValue placeholder="Seleccionar servicio" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{selected.description}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Motor</Label>
              <Select value={form.model} onValueChange={(v) => onChange({ model: v })}>
                <SelectTrigger id="model">
                  <SelectValue placeholder="Seleccionar motor" />
                </SelectTrigger>
                <SelectContent>
                  {selected.models.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">Clave de acceso</Label>
              <Input
                id="apiKey"
                type="password"
                value={form.apiKey}
                onChange={(e) => onChange({ apiKey: e.target.value })}
                placeholder={selected.keyPlaceholder}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseUrl">Dirección del servicio (opcional)</Label>
              <Input
                id="baseUrl"
                value={form.baseUrl}
                onChange={(e) => onChange({ baseUrl: e.target.value })}
                placeholder={selected.baseUrl}
              />
              <p className="text-xs text-muted-foreground">
                Dejalo vacío para usar la dirección recomendada.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={onSave}
                disabled={saving || form.model === "" || form.apiKey === ""}
              >
                <Save className="h-4 w-4" />
                {saving ? "Guardando..." : "Guardar"}
              </Button>
              <Button
                variant="outline"
                onClick={onTest}
                disabled={testing || form.model === "" || form.apiKey === ""}
              >
                <Zap className="h-4 w-4" />
                {testing ? "Probando..." : "Verificar conexión"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
