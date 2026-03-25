import { useCallback, useEffect, useState } from "react";
import type { ReactElement } from "react";
import { Breadcrumb } from "@/shared/components/breadcrumb";
import { PageContainer } from "@/shared/components/page-container";
import { PageHeader } from "@/shared/components/page-header";
import { Button } from "@/components/ui/button";
import { BREADCRUMB_MAP, ROUTES } from "@shared/lib/routes";
import type { DocumentRow } from "@shared/types";
import { Download, FileText } from "lucide-react";

export const DocumentsPage = (): ReactElement => {
  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [exporting, setExporting] = useState<string | null>(null);

  const load = useCallback(async () => {
    const list = await window.electronAPI.documentsList();
    setDocs(list);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleExport = async (id: string) => {
    setExporting(id);
    try {
      const res = await window.electronAPI.documentExportDocx(id);
      if (!res.ok && res.error !== "Cancelado") {
        window.alert(res.error ?? "Error al exportar");
      }
    } finally {
      setExporting(null);
    }
  };

  return (
    <PageContainer>
      <Breadcrumb items={BREADCRUMB_MAP[ROUTES.DOCUMENTS]} />
      <PageHeader title="Documentos" description="Exportá a DOCX cuando los necesites." />

      <ul className="divide-y rounded-md border">
        {docs.map((d) => (
          <li
            key={d.id}
            className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
          >
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="font-medium truncate">{d.title}</p>
                <p className="text-xs text-muted-foreground">
                  {d.type} · {new Date(d.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={exporting === d.id}
              onClick={() => void handleExport(d.id)}
            >
              <Download className="h-4 w-4" />
              {exporting === d.id ? "…" : "DOCX"}
            </Button>
          </li>
        ))}
      </ul>

      {docs.length === 0 && (
        <p className="text-sm text-muted-foreground mt-4">
          Todavía no hay documentos. Revisá y guardá una propuesta desde Asistentes.
        </p>
      )}
    </PageContainer>
  );
};
