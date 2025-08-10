import { ReactNode } from "react";

type SectionProps = {
  id?: string;
  title?: string;
  description?: string;
  children: ReactNode;
};

export function Section({ id, title, description, children }: SectionProps) {
  return (
    <section id={id} className="container mx-auto max-w-6xl px-4">
      {(title || description) && (
        <div className="mb-12 text-center">
          {title && (
            <h2 className="text-3xl md:text-5xl font-serif font-bold tracking-tight bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

