import { useState, useEffect, useCallback } from "react";
import { Upload, Trash2, FileText, AlertCircle, Loader2, BookOpen } from "lucide-react";
import type { MaterialRow } from "../../../../shared/types";

interface MaterialsPanelProps {
  classroomId: string;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "ready") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
        Listo
      </span>
    );
  }
  if (status === "processing" || status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
        <Loader2 className="w-3 h-3 animate-spin" />
        Procesando
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
        <AlertCircle className="w-3 h-3" />
        Error
      </span>
    );
  }
  return null;
}

export function MaterialsPanel({ classroomId }: MaterialsPanelProps) {
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadMaterials = useCallback(async () => {
    try {
      const rows = await window.electronAPI.materialsList(classroomId);
      setMaterials(rows);
    } finally {
      setLoading(false);
    }
  }, [classroomId]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const handleUpload = async () => {
    setUploading(true);
    try {
      const result = await window.electronAPI.materialsUpload(classroomId);
      if (!result.cancelled && result.material) {
        setMaterials((prev) => [...prev, result.material!]);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (materialId: string) => {
    await window.electronAPI.materialDelete(materialId);
    setMaterials((prev) => prev.filter((m) => m.id !== materialId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Cargando materiales...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-medium text-sm">Materiales de referencia</h3>
          {materials.length > 0 && (
            <span className="text-xs text-muted-foreground">
              ({materials.length})
            </span>
          )}
        </div>
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          Subir archivo
        </button>
      </div>

      {materials.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No hay materiales cargados</p>
          <p className="text-xs mt-1 opacity-70">
            Subí PDFs, documentos o archivos de texto como referencia para los agentes
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {materials.map((material) => (
            <div
              key={material.id}
              className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
            >
              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{material.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-muted-foreground truncate">{material.fileName}</p>
                  {material.subject && (
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                      {material.subject}
                    </span>
                  )}
                </div>
                {material.status === "error" && material.errorMessage && (
                  <p className="text-xs text-red-600 mt-0.5 truncate">{material.errorMessage}</p>
                )}
              </div>
              <StatusBadge status={material.status} />
              <button
                onClick={() => handleDelete(material.id)}
                disabled={material.status === "processing"}
                className="shrink-0 p-1.5 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Eliminar material"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
