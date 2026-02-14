import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: ReactNode; // Allow ReactNode for more flexible descriptions
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-y-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && (
          typeof description === 'string' ? (
            <p className="mt-1 text-muted-foreground">{description}</p>
          ) : (
            // If description is a ReactNode (e.g., a div with a badge), render it in a div
            // to avoid nesting a div inside a p, which is invalid HTML.
            <div className="mt-1 text-muted-foreground">{description}</div>
          )
        )}
      </div>
      {actions && <div className="mt-4 sm:mt-0">{actions}</div>}
    </div>
  );
}
