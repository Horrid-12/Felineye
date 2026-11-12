import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { ResolvedTheme, useThemeStore } from '../../store/useThemeStore';

interface Props {
  compact?: boolean;
  className?: string;
}

const OPTIONS: Array<{
  value: ResolvedTheme;
  label: string;
  Icon: React.FC<{ className?: string }>;
}> = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
];

export const ThemeToggle: React.FC<Props> = ({ compact = false, className = '' }) => {
  const { resolvedTheme, setPreference } = useThemeStore();

  return (
    <div
      role="group"
      aria-label={`Color theme (active: ${resolvedTheme})`}
      className={`inline-flex items-center p-0.5 bg-felid-elevated/80 border border-felid-border rounded-sm ${className}`}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = resolvedTheme === value;
        const title = `${label} theme`;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setPreference(value)}
            aria-pressed={active}
            aria-label={title}
            title={title}
            data-testid={`theme-option-${value}`}
            className={`inline-flex items-center justify-center gap-1.5 rounded-sm font-sans text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-felid-cobalt ${
              compact ? 'px-2 py-1.5' : 'px-2.5 py-1.5 flex-1'
            } ${
              active
                ? 'bg-felid-surface text-felid-cobalt-ink border border-felid-border-strong shadow-sm'
                : 'text-felid-muted-ink hover:text-felid-ink border border-transparent'
            }`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            {!compact && <span>{label}</span>}
          </button>
        );
      })}
    </div>
  );
};
