import { clsx } from 'clsx';
import { Check, X } from 'lucide-react';

export type PasswordRule = { label: string; ok: boolean };

/** What a screen reader hears after each rule, since the tick and the cross are drawn. */
export type PasswordPolicyLabels = {
  /** Default "met". */
  met?: string;
  /** Default "not met". */
  notMet?: string;
};

export type PasswordPolicyCheckerProps = {
  rules: PasswordRule[];
  /** Title shown above the rules list. Pass `null` to hide it. */
  title?: string | null;
  /**
   * The words said after each rule's label for a screen reader only ("At least 12 characters, not
   * met"), to translate with the rest of the page.
   */
  labels?: PasswordPolicyLabels;
  className?: string;
};

export const PasswordPolicyChecker = ({
  rules,
  title = 'Password requirements',
  labels,
  className,
}: PasswordPolicyCheckerProps) => {
  const met = labels?.met ?? 'met';
  const notMet = labels?.notMet ?? 'not met';
  if (rules.length === 0) {
    return (
      <p className={clsx('text-xs text-gray-500 dark:text-gray-400', className)}>
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
                r.ok ? 'text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>{r.label}</span>
              <span className="sr-only">, {r.ok ? met : notMet}</span>
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
