import type { ReactElement } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Trash2 } from "lucide-react";
import { PROVIDER_LABELS } from "../lib/settings-providers";
import type { ConnectionState } from "../hooks/use-settings-connection";

interface Props {
  connection: ConnectionState;
  onDisconnect: () => void;
}

export const ConnectionStatusCard = ({ connection, onDisconnect }: Props): ReactElement | null => {
  if (connection.existingId === null) return null;

  return (
    <Card className="max-w-lg mb-6 border-green-500/30">
      <CardContent className="py-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
          <div>
            <p className="text-sm font-medium">
              Conectado a {PROVIDER_LABELS[connection.connectedProvider ?? ""] ?? connection.connectedProvider}
            </p>
            <p className="text-xs text-muted-foreground">Motor: {connection.connectedModel}</p>
          </div>
          <Button variant="destructive" size="sm" className="ml-auto" onClick={onDisconnect}>
            <Trash2 className="h-4 w-4" />
            Desconectar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
