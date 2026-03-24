import type { ReactElement } from "react";
import { Button } from "@/components/ui/button";
import type { DocumentRow } from "@shared/types";
import { Download } from "lucide-react";

interface ChatSavedDocumentActionsProps {
  savedDocument: DocumentRow;
  onExport: () => void;
}

export const ChatSavedDocumentActions = ({
  savedDocument,
  onExport,
}: ChatSavedDocumentActionsProps): ReactElement => {
  return (
    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
      <span>Documento guardado: {savedDocument.title}</span>
      <Button size="sm" variant="outline" onClick={onExport}>
        <Download className="h-4 w-4" />
        Descargar en Word
      </Button>
    </div>
  );
};
