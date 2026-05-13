import Link from "next/link";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: { label: string; href: string; };
  backHref?: string;
}

export default function PageHeader({ title, subtitle, action, backHref }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8 animate-fade-up">
      <div className="flex items-center gap-3">
        {backHref && (
          <Link
            href={backHref}
            className="w-8 h-8 rounded-xl bg-surface border border-border flex items-center justify-center
                       text-ink-3 hover:text-ink hover:border-border-strong shadow-card
                       transition-all duration-150 ease-apple flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        )}
        <div>
          {subtitle && (
            <p className="text-xs font-bold text-ink-4 uppercase tracking-widest mb-1">{subtitle}</p>
          )}
          <h1 className="text-2xl font-bold text-ink tracking-tight">{title}</h1>
        </div>
      </div>
      {action && (
        <Link href={action.href} className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {action.label}
        </Link>
      )}
    </div>
  );
}
