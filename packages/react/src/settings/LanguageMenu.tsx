import { clsx } from 'clsx';
import { Globe } from 'lucide-react';
import { useLabels } from '../labels/labelsContext';
import { Menu } from '../ui/Menu';
import { languageName } from './languageName';
import { LANGUAGE_MENU_LABELS, type LanguageMenuLabels } from './labels';

/**
 * A language the menu offers: its BCP 47 code (`'fr'`, `'pt-BR'`), named by `languageName`, or the
 * code and the name to write in its place.
 */
export type LanguageMenuOption = string | { value: string; label: string };

export type LanguageMenuSize = 'sm' | 'md';

export type LanguageMenuProps = {
  /** The code of the language on show, one of `languages`. */
  value: string;
  /** The languages offered, in the order of the list. */
  languages: readonly LanguageMenuOption[];
  /** Called with the code of the language picked, unless it is the one on show. */
  onChange: (value: string) => void;
  /** Trigger height, as `ThemeToggle`. `md` (default) = 40px, `sm` = 32px. */
  size?: LanguageMenuSize;
  /** Edge of the trigger the menu lines up with. Default `end`, for the end of a top bar. */
  align?: 'start' | 'end';
  /** The texts it writes, over `LabelsProvider`'s `languageMenu` and the English defaults. */
  labels?: Partial<LanguageMenuLabels>;
  /** Class for the trigger button. */
  className?: string;
};

const SIZE_CLASS: Record<LanguageMenuSize, string> = {
  sm: 'h-ctrl-32 min-w-ctrl-32 gap-1 px-2 text-xs',
  md: 'h-ctrl-40 min-w-ctrl-40 gap-1.5 px-2.5 text-sm',
};

const option = (language: LanguageMenuOption) =>
  typeof language === 'string' ? { value: language, label: languageName(language) } : language;

/**
 * LanguageMenu — a top bar button that shows the code of the language on show (FR, DE, PT-BR) next
 * to a globe, and opens the list of `languages`, each named in its own language ("Deutsch",
 * "Español", "العربية") and marked with its `lang`, so a screen reader says it in that language. A
 * code is named by the browser (`languageName`); give `{ value, label }` to write another name.
 *
 * It is controlled like `ThemeToggle`: picking a language calls `onChange` and changes nothing
 * else. The app then shows the page in it: the dictionaries it hands `LabelsProvider` and
 * `ChartLabelsProvider`, and the `lang` and `dir` of `<html>`. The trigger's name is "Language,
 * Français": the code it shows stays out of it, since a screen reader would spell it.
 */
export const LanguageMenu = ({
  value,
  languages,
  onChange,
  size = 'md',
  align = 'end',
  labels: ownLabels,
  className,
}: LanguageMenuProps) => {
  const labels = useLabels('languageMenu', LANGUAGE_MENU_LABELS, ownLabels);
  const options = languages.map(option);
  const current = options.find((o) => o.value === value);
  return (
    <Menu align={align}>
      <Menu.Trigger
        title={labels.label}
        className={clsx(
          'flex items-center justify-center rounded-lg border border-gray-200 font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
          SIZE_CLASS[size],
          className
        )}
      >
        <Globe className="h-4 w-4 shrink-0" aria-hidden />
        {/* In upper case by JavaScript's rules, not the page's: under `lang="tr"`, CSS writes "fi" as "Fİ". */}
        <span aria-hidden>{value.toUpperCase()}</span>
        <span className="sr-only">
          <bdi>{labels.label}</bdi>
          {current && (
            <>
              {', '}
              <span lang={current.value}>{current.label}</span>
            </>
          )}
        </span>
      </Menu.Trigger>
      <Menu.Content aria-label={labels.label}>
        <Menu.Group label={labels.label}>
          {options.map((o) => (
            <Menu.RadioItem
              key={o.value}
              checked={o.value === value}
              onSelect={() => {
                if (o.value !== value) onChange(o.value);
              }}
            >
              <span lang={o.value}>{o.label}</span>
            </Menu.RadioItem>
          ))}
        </Menu.Group>
      </Menu.Content>
    </Menu>
  );
};
