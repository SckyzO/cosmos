import { clsx } from 'clsx';
import { Palette } from 'lucide-react';
import { Button } from '../ui/Button';
import { Popover } from '../ui/Popover';
import { AppearanceSettings, type AppearanceSettingsProps } from './AppearanceSettings';
import type { CosmosTheme, CosmosThemeChoice } from './appearance';

export type AppearanceMenuSize = 'sm' | 'md';

export type AppearanceMenuProps<T extends CosmosThemeChoice = CosmosTheme> = Omit<
  AppearanceSettingsProps<T>,
  'className' | 'stickyHeadings'
> & {
  /** Trigger label (title + aria-label), also the panel's name. Default `'Appearance'`. */
  label?: string;
  /** Trigger size, as `ThemeToggle`. `md` (default) = 40px, `sm` = 32px. */
  size?: AppearanceMenuSize;
  /**
   * Adds a "Reset" button under the groups, always in view. Called with no argument: put the
   * theme, accent, font, text size and density back to the app's defaults. The panel stays open.
   */
  onReset?: () => void;
  /** Class for the trigger button. */
  className?: string;
};

const SIZE_CLASS: Record<AppearanceMenuSize, { box: string; icon: string }> = {
  sm: { box: 'h-ctrl-32 w-ctrl-32', icon: 'h-4 w-4' },
  md: { box: 'h-ctrl-40 w-ctrl-40', icon: 'h-5 w-5' },
};

/**
 * AppearanceMenu — icon button for a top bar that opens `<AppearanceSettings>`
 * in a panel flush with its right edge. Controlled like AppearanceSettings:
 * apply the choice in the callbacks (for example with `applyAppearance`). The
 * panel stays open while the user tries combinations; Escape, a click
 * outside or the button close it.
 */
export const AppearanceMenu = <T extends CosmosThemeChoice = CosmosTheme>({
  label = 'Appearance',
  size = 'md',
  onReset,
  className,
  ...settings
}: AppearanceMenuProps<T>) => {
  const { box, icon } = SIZE_CLASS[size];
  return (
    <Popover>
      <Popover.Trigger
        title={label}
        aria-label={label}
        className={clsx(
          'flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
          box,
          className
        )}
      >
        <Palette className={icon} aria-hidden />
      </Popover.Trigger>
      <Popover.Content align="end" width="w-96" aria-label={label}>
        {/* The groups scroll when taller than the screen (all four are), their headings pinned;
            Reset stays below. The panel opens under a top bar, so 6rem is left for the bar and
            a margin. -m-4 takes back the panel's padding, which the scroll area restores. */}
        <div className="-m-4 flex max-h-[calc(100dvh-6rem)] flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {/* Two columns: four 78px cards are too narrow for "Deep Blue" plus its check. */}
            <AppearanceSettings themeColumns={2} stickyHeadings {...settings} />
          </div>
          {onReset && (
            <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
              <Button type="button" variant="ghost" size="sm" onClick={onReset}>
                Reset
              </Button>
            </div>
          )}
        </div>
      </Popover.Content>
    </Popover>
  );
};
