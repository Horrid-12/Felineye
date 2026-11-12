import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface PageHeaderProps {
  kicker: string;
  kickerIcon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  aside?: React.ReactNode;
  centered?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  kicker,
  kickerIcon,
  title,
  subtitle,
  meta,
  aside,
  centered = false,
}) => {
  if (centered) {
    return (
      <header className="text-center space-y-3 pb-6 border-b border-felid-border">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-felid-surface border border-felid-cobalt/25 rounded-sm text-[11px] font-mono font-medium tracking-wider text-felid-cobalt-ink uppercase">
          {kickerIcon}
          <span>{kicker}</span>
        </div>
        <h1 className="font-display font-semibold text-3xl sm:text-5xl text-felid-ink tracking-tight leading-[1.08]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm sm:text-base text-felid-muted-ink max-w-2xl mx-auto font-sans leading-relaxed">
            {subtitle}
          </p>
        )}
        {meta && (
          <div className="text-xs font-mono text-felid-muted-ink">{meta}</div>
        )}
      </header>
    );
  }

  return (
    <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-felid-border">
      <div className="space-y-2 max-w-2xl">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-felid-surface border border-felid-cobalt/25 rounded-sm text-[11px] font-mono font-medium tracking-wider text-felid-cobalt-ink uppercase">
          {kickerIcon}
          <span>{kicker}</span>
        </div>
        <h1 className="font-display font-semibold text-3xl sm:text-4xl lg:text-5xl text-felid-ink tracking-tight leading-[1.08]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-felid-muted-ink font-sans leading-relaxed">
            {subtitle}
          </p>
        )}
        {meta && (
          <div className="text-xs font-mono text-felid-muted-ink pt-0.5">
            {meta}
          </div>
        )}
      </div>
      {aside && (
        <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
          {aside}
        </div>
      )}
    </header>
  );
};

export type AlertTone = 'error' | 'warning' | 'info' | 'success';

interface AlertBannerProps {
  tone?: AlertTone;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const ALERT_STYLES: Record<
  AlertTone,
  { container: string; iconColor: string; Icon: React.FC<{ className?: string }> }
> = {
  error: {
    container: 'bg-felid-pomegranate/10 border-felid-pomegranate/45 text-felid-ink',
    iconColor: 'text-felid-pomegranate-ink',
    Icon: AlertCircle,
  },
  warning: {
    container: 'bg-felid-highlight/15 border-felid-highlight/50 text-felid-ink',
    iconColor: 'text-felid-highlight-ink',
    Icon: AlertTriangle,
  },
  info: {
    container: 'bg-felid-cobalt/10 border-felid-cobalt/40 text-felid-ink',
    iconColor: 'text-felid-cobalt-ink',
    Icon: Info,
  },
  success: {
    container: 'bg-felid-cobalt/10 border-felid-cobalt/45 text-felid-ink',
    iconColor: 'text-felid-cobalt-ink',
    Icon: CheckCircle2,
  },
};

export const AlertBanner: React.FC<AlertBannerProps> = ({
  tone = 'info',
  title,
  children,
  className = '',
}) => {
  const style = ALERT_STYLES[tone];
  const Icon = style.Icon;
  return (
    <div
      className={`p-4 border rounded-sm flex items-start gap-3 text-xs sm:text-sm ${style.container} ${className}`}
    >
      <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${style.iconColor}`} />
      <div className="space-y-1 min-w-0 leading-relaxed">
        {title && (
          <strong className="block font-mono text-xs font-medium uppercase tracking-wider text-felid-ink">
            {title}
          </strong>
        )}
        <div className="text-felid-ink/90">{children}</div>
      </div>
    </div>
  );
};

export const LoadingState: React.FC<{ label: string; className?: string }> = ({
  label,
  className = 'py-16',
}) => (
  <div className={`${className} text-center text-felid-muted-ink space-y-3`}>
    <div className="w-7 h-7 border-2 border-felid-cobalt border-t-transparent rounded-full animate-spin mx-auto" />
    <p className="text-xs font-mono uppercase tracking-wider text-felid-muted-ink">
      {label}
    </p>
  </div>
);

export const EmptyState: React.FC<{
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, description, action, className = '' }) => (
  <div
    className={`py-12 px-6 text-center border border-dashed border-felid-border-strong bg-felid-surface/70 rounded-sm space-y-3 ${className}`}
  >
    <p className="text-sm font-display font-semibold text-felid-ink">{title}</p>
    {description && (
      <p className="text-xs sm:text-sm text-felid-muted-ink max-w-md mx-auto font-sans leading-relaxed">
        {description}
      </p>
    )}
    {action && <div className="pt-1">{action}</div>}
  </div>
);
