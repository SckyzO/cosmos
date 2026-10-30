import { FolderGit2, Menu as MenuIcon } from 'lucide-react';
import { Badge, Menu } from '../../../../packages/react/src';
import reactPkg from '../../../../packages/react/package.json';
import { PAGE, TEXT_LINK, cx } from './styles';
import { REPO } from './WelcomeSections';

// The sections of the page, in order: links on a wide screen, a menu below `sm`.
const SECTIONS = [
  { href: '#appearance', label: 'Appearance' },
  { href: '#examples', label: 'Examples' },
  { href: '#components', label: 'Components' },
  { href: '#get-started', label: 'Get started' },
  { href: '#new', label: "What's new" },
];

const NAV_LINK =
  'focus-visible:focus-indicator rounded-md px-2.5 py-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:no-underline';

export const TopBar = () => (
  <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-bg-panel)]/90 backdrop-blur">
    <div className={cx(PAGE, 'flex h-14 items-center gap-4')}>
      <a
        href="#top"
        className="focus-visible:focus-indicator flex items-center gap-2.5 rounded-md hover:no-underline"
      >
        <span
          aria-hidden
          className="bg-brand-500 flex size-7 items-center justify-center rounded-lg text-sm font-bold text-white"
        >
          C
        </span>
        <span className="text-base font-semibold text-[var(--color-text-primary)]">Cosmos</span>
        <Badge size="sm">v{reactPkg.version}</Badge>
      </a>
      <nav aria-label="Welcome sections" className="ms-4 flex gap-1 max-sm:hidden">
        {SECTIONS.map(({ href, label }) => (
          <a key={href} href={href} className={NAV_LINK}>
            {label}
          </a>
        ))}
      </nav>
      <div className="ms-auto flex items-center gap-2">
        <a
          href={REPO}
          target="_blank"
          rel="noreferrer"
          className={cx(TEXT_LINK, 'flex items-center gap-1.5 text-sm')}
        >
          <FolderGit2 aria-hidden className="size-4" />
          <span className="max-sm:sr-only">Repository</span>
        </a>
        <div className="sm:hidden">
          <Menu align="end">
            <Menu.Trigger
              aria-label="Sections"
              className="flex size-9 items-center justify-center rounded-md text-[var(--color-text-secondary)] hover:bg-gray-100 dark:hover:bg-white/5"
            >
              <MenuIcon aria-hidden className="size-5" />
            </Menu.Trigger>
            <Menu.Content aria-label="Sections">
              {SECTIONS.map(({ href, label }) => (
                <Menu.Item key={href} href={href}>
                  {label}
                </Menu.Item>
              ))}
            </Menu.Content>
          </Menu>
        </div>
      </div>
    </div>
  </header>
);
