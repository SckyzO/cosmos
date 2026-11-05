// The English the sign-in pages write, their part of `CosmosLabels` (`englishLabels`).

import { createElement, Fragment, type ReactNode } from 'react';
import { formatCountdown } from '../hooks/useCooldown';

/** The words of a resend button that waits between two presses. */
export type ResendLabels = {
  /** Said when a press sends again, and shown until the wait ends. Default `We sent you a new link.` */
  resent: string;
  /** Said once, when the wait ends and the button works again. Default `You can request a new link.` */
  ready: string;
  /** What the button is waiting for, as its description. Default `available in 0:30`. */
  availableIn: (seconds: number) => string;
};

export type NewPasswordFormLabels = {
  /** The title of the form when the host gives no `title`. Default `Choose a new password`. */
  title: string;
  /** The line under it when the host gives no `description`. Default `Use a password you don’t use anywhere else. A reset link works once.` */
  description: string;
  /** Label of the new password field. Default `New password`. */
  newPassword: string;
  /** Label of the confirmation field. Default `Confirm password`. */
  confirmPassword: string;
  /** Placeholder of the confirmation field. Default `Repeat the password`. */
  confirmPlaceholder: string;
  /** The error under the confirmation when it differs. Default `Passwords don’t match`. */
  mismatch: string;
  /** The line under the confirmation when it matches. Default `Passwords match`. */
  match: string;
  /** The submit button. Default `Update password`. */
  submit: string;
  /** The link back to the sign-in page, on the form and the `expired` view. Default `Back to sign in`. */
  signIn: string;
  /** `expired`: the title. Default `This link is no longer valid`. */
  expiredTitle: string;
  /** `expired`: the line under it. Default `Reset links work once and expire after 1 hour. Ask for a new one to continue.` */
  expiredDescription: string;
  /** `expired`: the link that asks for another one, shown with `requestHref`. Default `Send me a new link`. */
  request: string;
  /** `done`: the title. Default `Password updated`. */
  doneTitle: string;
  /** `done`: the line under it. Default `You can now sign in with your new password.` */
  doneDescription: string;
  /** `done`: the link to the sign-in page. Default `Continue to sign in`. */
  continue: string;
};

/** The words of the form, of the `sent` view and of its resend wait. */
export type ResetPasswordFormLabels = ResendLabels & {
  /** The title of the form when the host gives no `title`. Default `Reset your password`. */
  title: string;
  /** The line under it when the host gives no `description`. Default `Enter your email and we’ll send you a link to reset your password.` */
  description: string;
  /** Label of the email field. Default `Email`. */
  email: string;
  /** Placeholder of the email field. Default `john@example.com`. */
  emailPlaceholder: string;
  /** The submit button. Default `Send reset link`. */
  submit: string;
  /** The link back to the sign-in page. Default `Back to sign in`. */
  signIn: string;
  /** `sent`: the title. Default `Check your inbox`. */
  sentTitle: string;
  /** `sent`: the line under it; `email` is the address, already isolated for right to left. Default `We've sent a reset link to a@b.co. The link expires in 1 hour.` */
  sentDescription: (email: ReactNode) => ReactNode;
  /** `sent`: the resend button, shown with `onResend`. Default `Resend`. */
  resend: string;
};

export type SignInFormLabels = {
  /** The title when the host gives no `title`. Default `Sign in`. */
  title: string;
  /** The line under it when the host gives no `description`. Default `Welcome back — enter your credentials below.` */
  description: string;
  /** Label of the email field. Default `Email`. */
  email: string;
  /** Placeholder of the email field. Default `john@example.com`. */
  emailPlaceholder: string;
  /** Label of the password field. Default `Password`. */
  password: string;
  /** Label of the checkbox. Default `Keep me signed in`. */
  remember: string;
  /** The link that asks for a new password, shown with `onForgotPassword`. Default `Forgot password?` */
  forgot: string;
  /** The submit button. Default `Sign in`. */
  submit: string;
  /** The words before the sign-up link, shown with `signUpHref`. Default `No account?` */
  noAccount: string;
  /** The sign-up link. Default `Create one`. */
  signUp: string;
};

export type SignUpFormLabels = {
  /** The title when the host gives no `title`. Default `Create your account`. */
  title: string;
  /** The line under it when the host gives no `description`. Default `A few details to get you started.` */
  description: string;
  /** Label of the first name field. Default `First name`. */
  firstName: string;
  /** Placeholder of the first name field. Default `John`. */
  firstNamePlaceholder: string;
  /** Label of the last name field. Default `Last name`. */
  lastName: string;
  /** Placeholder of the last name field. Default `Doe`. */
  lastNamePlaceholder: string;
  /** Label of the email field. Default `Email`. */
  email: string;
  /** Placeholder of the email field. Default `john@example.com`. */
  emailPlaceholder: string;
  /** Label of the password field. Default `Password`. */
  password: string;
  /** The text of the link to the terms. Default `terms`. */
  terms: string;
  /** The text of the link to the privacy policy. Default `privacy policy`. */
  privacy: string;
  /** The checkbox's sentence, round the two links, already drawn. Default `I agree to the terms and privacy policy.` */
  agree: (terms: ReactNode, privacy: ReactNode) => ReactNode;
  /** The submit button. Default `Create account`. */
  submit: string;
  /** The words before the sign-in link, shown with `signInHref`. Default `Already have an account?` */
  haveAccount: string;
  /** The sign-in link. Default `Sign in`. */
  signIn: string;
};

export type SocialAuthButtonsLabels = {
  /** The name and text of a provider's button; `name` is the provider's, `Google`. Default `Continue with Google`. */
  continueWith: (name: string) => string;
  /** The line of the divider. Default `OR continue with`. */
  divider: string;
};

/** The words of the form, of the backup entry and of the resend wait. */
export type TwoStepVerificationLabels = ResendLabels & {
  /** The title of the code entry when the host gives no `title`. Default `Two-step verification`. */
  title: string;
  /** The line under it; `to` is where the code was sent, already isolated for right to left. Default `Enter the 6-digit code we sent to a@b.co.` */
  sentTo: (length: number, to: ReactNode) => ReactNode;
  /** The line under it when the host gives no `sentTo`. Default `Enter the 6-digit verification code from your authenticator app.` */
  authenticator: (length: number) => string;
  /** The submit button. Default `Verify my account`. */
  submit: string;
  /** The words before the resend button, shown with `onResend`. Default `Didn't get a code?` */
  noCode: string;
  /** The resend button. Default `Resend code`. */
  resend: string;
  /** The link to the backup entry. Default `Use a backup code`. */
  useBackupCode: string;
  /** The link back to the verification code. Default `Use a verification code instead`. */
  useVerificationCode: string;
  /** Title of the backup entry. Default `Use a backup code`. */
  backupTitle: string;
  /** Description of the backup entry. Default `Enter one of the codes you saved when you turned on two-step verification. Each code works once.` */
  backupDescription: string;
  /** Label of the backup field. Default `Backup code`. */
  backupField: string;
  /** The link back to the sign-in page, shown with `cancelHref`. Default `Back to sign in`. */
  cancel: string;
};

const availableIn = (seconds: number) => `available in ${formatCountdown(seconds)}`;

export const NEW_PASSWORD_FORM_LABELS: NewPasswordFormLabels = {
  title: 'Choose a new password',
  description: 'Use a password you don’t use anywhere else. A reset link works once.',
  newPassword: 'New password',
  confirmPassword: 'Confirm password',
  confirmPlaceholder: 'Repeat the password',
  mismatch: 'Passwords don’t match',
  match: 'Passwords match',
  submit: 'Update password',
  signIn: 'Back to sign in',
  expiredTitle: 'This link is no longer valid',
  expiredDescription:
    'Reset links work once and expire after 1 hour. Ask for a new one to continue.',
  request: 'Send me a new link',
  doneTitle: 'Password updated',
  doneDescription: 'You can now sign in with your new password.',
  continue: 'Continue to sign in',
};

export const RESET_PASSWORD_FORM_LABELS: ResetPasswordFormLabels = {
  title: 'Reset your password',
  description: 'Enter your email and we’ll send you a link to reset your password.',
  email: 'Email',
  emailPlaceholder: 'john@example.com',
  submit: 'Send reset link',
  signIn: 'Back to sign in',
  sentTitle: 'Check your inbox',
  sentDescription: (email) =>
    createElement(
      Fragment,
      null,
      "We've sent a reset link to ",
      email,
      '. The link expires in 1 hour.'
    ),
  resend: 'Resend',
  resent: 'We sent you a new link.',
  ready: 'You can request a new link.',
  availableIn,
};

export const SIGN_IN_FORM_LABELS: SignInFormLabels = {
  title: 'Sign in',
  description: 'Welcome back — enter your credentials below.',
  email: 'Email',
  emailPlaceholder: 'john@example.com',
  password: 'Password',
  remember: 'Keep me signed in',
  forgot: 'Forgot password?',
  submit: 'Sign in',
  noAccount: 'No account?',
  signUp: 'Create one',
};

export const SIGN_UP_FORM_LABELS: SignUpFormLabels = {
  title: 'Create your account',
  description: 'A few details to get you started.',
  firstName: 'First name',
  firstNamePlaceholder: 'John',
  lastName: 'Last name',
  lastNamePlaceholder: 'Doe',
  email: 'Email',
  emailPlaceholder: 'john@example.com',
  password: 'Password',
  terms: 'terms',
  privacy: 'privacy policy',
  agree: (terms, privacy) =>
    createElement(Fragment, null, 'I agree to the ', terms, ' and ', privacy, '.'),
  submit: 'Create account',
  haveAccount: 'Already have an account?',
  signIn: 'Sign in',
};

export const SOCIAL_AUTH_BUTTONS_LABELS: SocialAuthButtonsLabels = {
  continueWith: (name) => `Continue with ${name}`,
  divider: 'OR continue with',
};

export const TWO_STEP_VERIFICATION_FORM_LABELS: TwoStepVerificationLabels = {
  title: 'Two-step verification',
  sentTo: (length, to) =>
    createElement(Fragment, null, `Enter the ${length}-digit code we sent to `, to, '.'),
  authenticator: (length) =>
    `Enter the ${length}-digit verification code from your authenticator app.`,
  submit: 'Verify my account',
  noCode: "Didn't get a code?",
  resend: 'Resend code',
  resent: 'We sent you a new code.',
  ready: 'You can request a new code.',
  availableIn,
  useBackupCode: 'Use a backup code',
  useVerificationCode: 'Use a verification code instead',
  backupTitle: 'Use a backup code',
  backupDescription:
    'Enter one of the codes you saved when you turned on two-step verification. Each code works once.',
  backupField: 'Backup code',
  cancel: 'Back to sign in',
};
