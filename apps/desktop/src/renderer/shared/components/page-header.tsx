import type { ReactElement, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
    icon?: ReactNode;
  };
}

export const PageHeader = ({
  title,
  description,
  action
}: PageHeaderProps): ReactElement => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && (
        <Button
          onClick={action.onClick}
          asChild={!!action.href}
          className="shrink-0"
        >
          {action.href ? (
            <a href={action.href} className="flex items-center gap-2">
              {action.icon}
              {action.label}
            </a>
          ) : (
            <span className="flex items-center gap-2">
              {action.icon}
              {action.label}
            </span>
          )}
        </Button>
      )}
    </div>
  );
};
