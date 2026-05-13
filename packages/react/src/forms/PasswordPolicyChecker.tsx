import { clsx } from 'clsx';
import { Check, X } from 'lucide-react';

export type PasswordRule = { label: string; ok: boolean };

export type PasswordPolicyCheckerProps = {
  rules: PasswordRule[];
  /** Title shown above the rules list. Pass `null` to hide it. */
  title?: string | null;
  className?: string;
};

export const PasswordPolicyChecker = ({
  rules,
  title = 'Password requirements',
  className,
}: PasswordPolicyCheckerProps) => {
  if (rules.length === 0) {
    return (
      <p className={clsx('text-xs text-gray-400 dark:text-gray-500', className)}>
        No requirements defined.
      </p>
    );
  }
  return (
    <div className={className}>
      {title && (
        <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">{title}</p>
      )}
      <ul className="space-y-1">
        {rules.map((r, i) => {
          const Icon = r.ok ? Check : X;
          return (
            <li
              key={`${i}-${r.label}`}
              className={clsx(
                'flex items-center gap-2 text-xs transition-colors',
                r.ok ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500',
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>{r.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

/**
 * Sensible default password policy. Override per-app if stricter/looser
 * rules are needed (i18n, custom min length, blocklists, …).
 */
export const defaultPasswordRules = (pwd: string): PasswordRule[] => [
  { label: 'At least 12 characters', ok: pwd.length >= 12 },
  { label: 'One uppercase letter', ok: /[A-Z]/.test(pwd) },
  { label: 'One lowercase letter', ok: /[a-z]/.test(pwd) },
  { label: 'One number', ok: /\d/.test(pwd) },
  { label: 'One symbol', ok: /[^A-Za-z0-9]/.test(pwd) },
];
