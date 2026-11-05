import { clsx } from 'clsx';
import { Check, X } from 'lucide-react';
import { useLabels } from '../labels/labelsContext';
import { PASSWORD_POLICY_LABELS, type PasswordPolicyLabels } from './labels';

export type PasswordRule = { label: string; ok: boolean };

export type PasswordPolicyCheckerProps = {
  rules: PasswordRule[];
  /** Title shown above the rules list. Default `labels.title`. Pass `null` to hide it. */
  title?: string | null;
  /**
   * The texts it writes, over `LabelsProvider`'s `passwordPolicyChecker` and the English
   * defaults: the title, the line for no rule, and the words said after each rule's label for a
   * screen reader only ("At least 12 characters, not met"), since the tick and the cross are drawn.
   */
  labels?: Partial<PasswordPolicyLabels>;
  className?: string;
};

export const PasswordPolicyChecker = ({
  rules,
  title,
  labels: ownLabels,
  className,
}: PasswordPolicyCheckerProps) => {
  const labels = useLabels('passwordPolicyChecker', PASSWORD_POLICY_LABELS, ownLabels);
  const shownTitle = title === undefined ? labels.title : title;
  if (rules.length === 0) {
    return (
      <p className={clsx('text-xs text-gray-500 dark:text-gray-400', className)}>{labels.empty}</p>
    );
  }
  return (
    <div className={className}>
      {shownTitle && (
        <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">{shownTitle}</p>
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
              <span className="sr-only">, {r.ok ? labels.met : labels.notMet}</span>
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
