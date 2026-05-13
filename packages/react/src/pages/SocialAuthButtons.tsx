import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

export type SocialProvider = 'google' | 'github' | 'x' | 'facebook' | 'apple' | 'microsoft';

export type SocialAuthButtonsLayout = 'stacked' | 'grid';

export type SocialAuthButtonsProps = {
  providers: SocialProvider[];
  onProviderClick: (provider: SocialProvider) => void;
  /** Provider currently loading (shows spinner + disables all buttons). */
  loading?: SocialProvider | null;
  /** Render a "OR continue with" divider below the buttons. Default `true`. */
  divider?: boolean;
  dividerLabel?: string;
  /** `stacked` (1 per row) or `grid` (2 cols). Default `stacked`. */
  layout?: SocialAuthButtonsLayout;
  /** Customize button label. Default `Continue with {Provider}`. */
  labelFor?: (provider: SocialProvider) => string;
  /** Render at the top (above divider) or below (between form & nothing). */
  position?: 'above' | 'below';
  className?: string;
};

const PROVIDER_NAME: Record<SocialProvider, string> = {
  google: 'Google',
  github: 'GitHub',
  x: 'X',
  facebook: 'Facebook',
  apple: 'Apple',
  microsoft: 'Microsoft',
};

// ── Brand SVG icons (inline, official simplified) ────────────────────────────

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18a10.99 10.99 0 0 0 0 9.86l3.66-2.84z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a10.99 10.99 0 0 0-9.82 6.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
    />
  </svg>
);

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.48 2 2 6.58 2 12.26c0 4.49 2.87 8.3 6.84 9.65.5.09.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.36-3.37-1.36-.46-1.18-1.11-1.5-1.11-1.5-.91-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.36-2.22-.26-4.55-1.13-4.55-5.04 0-1.11.39-2.02 1.03-2.74-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05A9.4 9.4 0 0 1 12 6.99c.85 0 1.71.12 2.51.34 1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.74 0 3.92-2.34 4.78-4.57 5.03.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.81 0 .27.18.59.69.49A10.04 10.04 0 0 0 22 12.26C22 6.58 17.52 2 12 2z"
    />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
    <path
      fill="#1877F2"
      d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07c0 6.02 4.39 11.01 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.23 2.69.23v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.08 24 18.09 24 12.07Z"
    />
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
    <path d="M17.05 12.04c-.03-2.97 2.43-4.4 2.54-4.47-1.39-2.03-3.55-2.31-4.32-2.34-1.83-.19-3.59 1.08-4.52 1.08-.95 0-2.38-1.06-3.92-1.03-2.01.03-3.88 1.18-4.92 2.97-2.1 3.65-.54 9.05 1.51 12.01 1 1.45 2.18 3.07 3.74 3.01 1.51-.06 2.07-.97 3.89-.97 1.81 0 2.32.97 3.92.94 1.62-.03 2.65-1.46 3.62-2.92 1.15-1.67 1.62-3.32 1.65-3.4-.04-.01-3.16-1.21-3.19-4.81zM14.06 3.74c.81-1 1.36-2.39 1.21-3.78-1.17.05-2.6.79-3.44 1.78-.74.87-1.4 2.28-1.23 3.64 1.31.1 2.65-.66 3.46-1.65z" />
  </svg>
);

const MicrosoftIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
    <path fill="#F25022" d="M11.4 11.4H1V1h10.4v10.4Z" />
    <path fill="#7FBA00" d="M23 11.4H12.6V1H23v10.4Z" />
    <path fill="#00A4EF" d="M11.4 23H1V12.6h10.4V23Z" />
    <path fill="#FFB900" d="M23 23H12.6V12.6H23V23Z" />
  </svg>
);

const PROVIDER_ICON: Record<SocialProvider, () => ReactNode> = {
  google: GoogleIcon,
  github: GithubIcon,
  x: XIcon,
  facebook: FacebookIcon,
  apple: AppleIcon,
  microsoft: MicrosoftIcon,
};

// ── Component ────────────────────────────────────────────────────────────────

export const SocialAuthButtons = ({
  providers,
  onProviderClick,
  loading,
  divider = true,
  dividerLabel = 'OR continue with',
  layout = 'stacked',
  labelFor,
  position = 'above',
  className,
}: SocialAuthButtonsProps) => {
  if (providers.length === 0) return null;

  const buttonsList = (
    <div
      className={clsx(
        layout === 'grid' ? 'grid grid-cols-2 gap-2' : 'flex flex-col gap-2',
      )}
    >
      {providers.map((provider) => {
        const Icon = PROVIDER_ICON[provider];
        const isLoading = loading === provider;
        const isDisabled = loading !== undefined && loading !== null;
        const label = labelFor
          ? labelFor(provider)
          : `Continue with ${PROVIDER_NAME[provider]}`;
        return (
          <button
            key={provider}
            type="button"
            onClick={() => onProviderClick(provider)}
            disabled={isDisabled}
            aria-label={label}
            className="flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Icon />
            )}
            <span className="truncate">{label}</span>
          </button>
        );
      })}
    </div>
  );

  if (!divider) return <div className={className}>{buttonsList}</div>;

  const dividerNode = (
    <div className="my-4 flex items-center gap-3">
      <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
      <span className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {dividerLabel}
      </span>
      <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
    </div>
  );

  return (
    <div className={className}>
      {position === 'above' ? (
        <>
          {buttonsList}
          {dividerNode}
        </>
      ) : (
        <>
          {dividerNode}
          {buttonsList}
        </>
      )}
    </div>
  );
};
