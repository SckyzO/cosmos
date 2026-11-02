import { useId, type ChangeEvent } from 'react';
import { PasswordInput } from '../forms/PasswordInput';
import { PasswordPolicyChecker, type PasswordRule } from '../forms/PasswordPolicyChecker';
import { PasswordStrengthMeter } from '../forms/PasswordStrengthMeter';

type NewPasswordFieldProps = {
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  /** The rules to list under the field; `null` shows none. */
  rules: PasswordRule[] | null;
  /** The score to draw, 0 to 4; `undefined` shows no meter. */
  score: number | undefined;
};

// Internal to the package, not exported: the new-password field of `SignUpForm` and
// `NewPasswordForm`, with its strength meter and its rules. The meter is the field's description,
// so a screen reader hears the level when the field takes focus.
export const NewPasswordField = ({
  label,
  value,
  onChange,
  disabled,
  rules,
  score,
}: NewPasswordFieldProps) => {
  const meterId = useId();
  return (
    <>
      <PasswordInput
        label={label}
        autoComplete="new-password"
        required
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-describedby={score === undefined ? undefined : meterId}
      />
      {score !== undefined && <PasswordStrengthMeter id={meterId} score={score} />}
      {rules && <PasswordPolicyChecker rules={rules} />}
    </>
  );
};
