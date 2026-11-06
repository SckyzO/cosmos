import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bell, User } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { ErrorState } from '../feedback/ErrorState';
import { SegmentedControl } from '../forms/SegmentedControl';
import { Select } from '../forms/Select';
import { LabelsProvider } from '../labels/LabelsProvider';
import { Topbar } from '../layout/Topbar';
import { frenchLabels } from '../locales/fr';
import { endOffset, portalDocsParams } from '../storybook-helpers';
import { LanguageMenu } from './LanguageMenu';
import { languageName } from './languageName';

const LANGUAGES = ['en', 'fr', 'de', 'es', 'pt-BR', 'ar', 'ja'];

const meta = {
  title: 'Settings/Language Menu',
  component: LanguageMenu,
  parameters: portalDocsParams(400),
  tags: ['autodocs'],
  args: { value: 'en', languages: LANGUAGES, onChange: fn() },
  // Controlled, as an app holds it, and at the end of the row like a top bar's button, so the
  // menu opens towards the page.
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return (
      <div className="flex justify-end p-6">
        <LanguageMenu
          {...args}
          value={value}
          onChange={(next) => {
            setValue(next);
            args.onChange(next);
          }}
        />
      </div>
    );
  },
} satisfies Meta<typeof LanguageMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const menu = () => within(document.body).getByRole('menu', { name: 'Language' });

// ── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {};

export const Small: Story = { args: { size: 'sm' } };

/** `{ value, label }` writes a name of the app's own in place of the browser's. */
export const NamesOfYourOwn: Story = {
  args: {
    value: 'pt-BR',
    languages: ['en', { value: 'pt-BR', label: 'Português' }, { value: 'zh', label: '中文' }],
  },
};

const IconButton = ({ icon: Icon, label }: { icon: typeof Bell; label: string }) => (
  <button
    type="button"
    aria-label={label}
    className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
  >
    <Icon className="h-5 w-5" aria-hidden />
  </button>
);

/**
 * What an app does with the choice: the dictionary of the language goes to `LabelsProvider`, and
 * its code to `lang` (on `<html>` in an app, on the story's own box here). The `ErrorState` under
 * the bar writes its title and its button in the language picked.
 */
export const SwitchesThePage: Story = {
  args: { languages: ['en', 'fr'] },
  render: (args) => {
    const [language, setLanguage] = useState(args.value);
    const page = (
      <div lang={language}>
        <Topbar
          pageTitle="Analytics"
          endActions={
            <>
              <IconButton icon={Bell} label="Notifications" />
              <LanguageMenu
                {...args}
                value={language}
                onChange={(next) => {
                  setLanguage(next);
                  args.onChange(next);
                }}
              />
              <IconButton icon={User} label="Profile" />
            </>
          }
        />
        <ErrorState className="mt-6" onRetry={fn()} />
      </div>
    );
    return language === 'fr' ? (
      <LabelsProvider labels={frenchLabels} locale="fr-FR">
        {page}
      </LabelsProvider>
    ) : (
      page
    );
  },
};

/**
 * `languageName` names the languages of a `Select` or a `SegmentedControl` as the menu does, for
 * a settings page or a choice of two.
 */
export const SameNamesElsewhere: Story = {
  render: () => {
    const [language, setLanguage] = useState('fr');
    const [shortList, setShortList] = useState('fr');
    return (
      <div className="flex max-w-xs flex-col gap-6 p-6">
        <Select
          label="Language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          options={LANGUAGES.map((code) => ({ value: code, label: languageName(code) }))}
        />
        <SegmentedControl
          className="self-start"
          aria-label="Language"
          value={shortList}
          onChange={setShortList}
          options={[
            { value: 'en', label: 'EN' },
            { value: 'fr', label: 'FR' },
          ]}
        />
      </div>
    );
  },
};

// ── Interaction tests ────────────────────────────────────────────────────────

// Off the docs page (`!autodocs`): their play functions take focus, which scrolls the docs page.
export const ListsEachLanguageInItsOwn: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Language, English' });
    await expect(trigger).toHaveTextContent('EN');
    await expect(trigger).toHaveAttribute('title', 'Language');
    await userEvent.click(trigger);
    await waitFor(() => expect(menu()).toBeVisible());
    const list = within(menu()).getByRole('group', { name: 'Language' });
    const items = within(list).getAllByRole('menuitemradio');
    await expect(items.map((item) => item.textContent)).toEqual([
      'English',
      'Français',
      'Deutsch',
      'Español',
      'Português (Brasil)',
      'العربية',
      '日本語',
    ]);
    // Each name is marked with its language, so a screen reader says it in that language.
    await expect(within(items[2]).getByText('Deutsch')).toHaveAttribute('lang', 'de');
    await expect(within(items[5]).getByText('العربية')).toHaveAttribute('lang', 'ar');
    await expect(items[0]).toHaveAttribute('aria-checked', 'true');
    await expect(items[1]).toHaveAttribute('aria-checked', 'false');
    // The menu lines up with the end of the trigger.
    await expect(endOffset(menu(), trigger)).toBeCloseTo(0, 2);
  },
};

export const PickingALanguageCallsOnChange: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Language, English' }));
    await waitFor(() => expect(menu()).toBeVisible());
    await userEvent.click(within(menu()).getByRole('menuitemradio', { name: 'Deutsch' }));
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    await expect(args.onChange).toHaveBeenCalledWith('de');
    await waitFor(() => expect(within(document.body).queryByRole('menu')).toBeNull());
    const trigger = canvas.getByRole('button', { name: 'Language, Deutsch' });
    await expect(trigger).toHaveTextContent('DE');
    await expect(within(trigger).getByText('Deutsch')).toHaveAttribute('lang', 'de');
  },
};

export const PickingTheLanguageOnShowCallsNothing: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Language, English' }));
    await waitFor(() => expect(menu()).toBeVisible());
    await userEvent.click(within(menu()).getByRole('menuitemradio', { name: 'English' }));
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

export const KeyboardPicksALanguage: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ args, canvas }) => {
    canvas.getByRole('button', { name: 'Language, English' }).focus();
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() =>
      expect(within(menu()).getByRole('menuitemradio', { name: 'English' })).toHaveFocus()
    );
    // The typeahead finds a language by the first letters of its own name.
    await userEvent.keyboard('es');
    await expect(within(menu()).getByRole('menuitemradio', { name: 'Español' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    await expect(args.onChange).toHaveBeenCalledWith('es');
  },
};

export const OwnNamesWinOverTheBrowsers: Story = {
  ...NamesOfYourOwn,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Language, Português' });
    await expect(trigger).toHaveTextContent('PT-BR');
    await userEvent.click(trigger);
    await waitFor(() => expect(menu()).toBeVisible());
    await expect(within(menu()).getByText('中文')).toHaveAttribute('lang', 'zh');
    await expect(within(menu()).getByRole('menuitemradio', { name: 'English' })).toBeVisible();
  },
};

export const SmallIs32Pixels: Story = {
  ...Small,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Language, English' });
    await expect(trigger.getBoundingClientRect().height).toBe(32);
  },
};

/** The provider's `languageMenu` names the trigger and the menu; the component's own `labels` win. */
export const TranslatedByLabels: Story = {
  tags: ['!dev', '!autodocs'],
  args: { value: 'fr' },
  render: (args) => (
    <LabelsProvider labels={{ languageMenu: { label: 'Langue' } }}>
      <div className="flex justify-between p-6">
        <LanguageMenu {...args} />
        <LanguageMenu {...args} labels={{ label: 'Idioma' }} />
      </div>
    </LabelsProvider>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Langue, Français' });
    await expect(trigger).toHaveAttribute('title', 'Langue');
    await expect(canvas.getByRole('button', { name: 'Idioma, Français' })).toBeVisible();
    await userEvent.click(trigger);
    const list = await within(document.body).findByRole('menu', { name: 'Langue' });
    await expect(within(list).getByRole('group', { name: 'Langue' })).toBeVisible();
  },
};
