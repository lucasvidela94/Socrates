import type { ReactElement, ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export const PageContainer = ({
  children,
  className = ""
}: PageContainerProps): ReactElement => {
  return (
    <div className={`max-w-5xl mx-auto space-y-6 ${className}`}>
      {children}
    </div>
  );
};
