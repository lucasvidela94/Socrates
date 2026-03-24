import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ReactElement } from "react";

interface LoadingStateProps {
  count?: number;
}

export const LoadingState = ({ count: _count = 3 }: LoadingStateProps): ReactElement => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
      <p className="text-sm text-muted-foreground">Cargando...</p>
    </div>
  );
};

export const CardSkeleton = ({ count = 3 }: LoadingStateProps): ReactElement => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
            <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/3"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
