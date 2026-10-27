import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import {
  expectNoHorizontalOverflow,
  expectTextContrast,
  inEachTheme,
  mobileViewport,
} from '../storybook-helpers';
import { DateTime } from './DateTime';

const meta = {
  title: 'Data/Date Time',
  component: DateTime,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { value: '2026-01-15T14:05:09Z', timeZone: 'UTC', locale: 'en-US' },
} satisfies Meta<typeof DateTime>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The default `datetime` preset, in the given zone. */
export const Default: Story = {};

/** `date`, `time`, `datetime`, `long` and `full`. */
export const Presets: Story = {
  render: (args) => (
    <dl className="grid grid-cols-[6rem_1fr] gap-x-4 gap-y-2 text-sm text-gray-900 dark:text-white">
      {(['date', 'time', 'datetime', 'long', 'full'] as const).map((format) => (
        <div key={format} className="contents">
          <dt className="text-gray-500 dark:text-gray-400">{format}</dt>
          <dd>
            <DateTime {...args} format={format} />
          </dd>
        </div>
      ))}
    </dl>
  ),
};

/** The language of the month, the order of the parts and the clock follow `locale`. */
export const Locales: Story = {
  render: (args) => (
    <ul className="space-y-2 text-sm text-gray-900 dark:text-white">
      {['en-US', 'en-GB', 'fr-FR', 'de-DE', 'ja-JP'].map((locale) => (
        <li key={locale} className="flex gap-4">
          <span className="w-16 text-gray-500 dark:text-gray-400">{locale}</span>
          <DateTime {...args} locale={locale} format="long" />
        </li>
      ))}
    </ul>
  ),
};

/** The same instant on the wall clock of three zones; Tokyo is already on the 16th. */
export const TimeZones: Story = {
  args: { value: '2026-01-15T20:30:00Z', format: 'long', locale: 'fr-FR' },
  render: (args) => (
    <ul className="space-y-2 text-sm text-gray-900 dark:text-white">
      {['UTC', 'America/New_York', 'Asia/Tokyo'].map((timeZone) => (
        <li key={timeZone} className="flex gap-4">
          <span className="w-40 text-gray-500 dark:text-gray-400">{timeZone}</span>
          <DateTime {...args} timeZone={timeZone} />
        </li>
      ))}
    </ul>
  ),
};

/** A `format` that is not a preset is `Intl.DateTimeFormat` options. */
export const IntlOptions: Story = {
  args: { format: { weekday: 'long', day: 'numeric', month: 'long' }, locale: 'fr-FR' },
};

/**
 * `tooltip` shows the full date and zone. The `<time>` becomes a tab stop, so a keyboard reaches
 * the tooltip: turn it on for a date the reader is likely to ask about, not for a whole table.
 */
export const WithTooltip: Story = {
  args: { tooltip: true, format: 'date' },
};

/** A value that does not parse draws a dash, not "Invalid Date". */
export const InvalidValue: Story = { args: { value: 'soon' } };

/** At 375px a long format wraps instead of widening the page. */
export const Mobile: Story = {
  globals: mobileViewport,
  args: { format: 'full', locale: 'fr-FR', timeZone: 'Asia/Tokyo' },
  play: async () => {
    expectNoHorizontalOverflow();
  },
};

/** It is a `<time>` whose `dateTime` is the ISO instant, whatever the zone and the format. */
export const RendersTimeElement: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div className="space-y-1 text-sm text-gray-900 dark:text-white">
      <div data-testid="utc">
        <DateTime value={Date.UTC(2026, 0, 15, 14, 5, 9)} timeZone="UTC" locale="en-US" />
      </div>
      <div data-testid="tokyo">
        <DateTime value="2026-01-15T14:05:09Z" timeZone="Asia/Tokyo" locale="fr-FR" format="time" />
      </div>
      <div data-testid="date">
        <DateTime
          value={new Date('2026-01-15T14:05:09Z')}
          format="date"
          locale="en-US"
          timeZone="UTC"
        />
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    const time = (id: string) => within(canvas.getByTestId(id)).getByText(/./).closest('time');
    for (const id of ['utc', 'tokyo', 'date']) {
      expect(time(id)?.tagName).toBe('TIME');
      expect(time(id)?.getAttribute('dateTime')).toBe('2026-01-15T14:05:09.000Z');
    }
    expect(time('tokyo')?.textContent).toBe('23:05');
    expect(time('date')?.textContent).toBe('Jan 15, 2026');
    // Plain text: out of the tab order unless it has a tooltip.
    expect(time('utc')?.hasAttribute('tabindex')).toBe(false);
    // The text is readable in every theme.
    inEachTheme(() => expectTextContrast(time('utc') as HTMLElement));
  },
};

/** With `tooltip`, a keyboard focuses the `<time>` and the tooltip gives the full date and zone. */
export const TooltipOnFocus: Story = {
  tags: ['!dev', '!autodocs'],
  args: { tooltip: true, format: 'date' },
  play: async ({ canvas }) => {
    const time = canvas.getByText('Jan 15, 2026');
    expect(time.getAttribute('tabindex')).toBe('0');
    await userEvent.tab();
    expect(time).toHaveFocus();
    const tooltip = await within(document.body).findByRole('tooltip');
    await waitFor(() => expect(getComputedStyle(tooltip).opacity).toBe('1'));
    expect(tooltip.textContent?.replace(/\s/g, ' ')).toBe(
      'Thursday, January 15, 2026 at 2:05:09 PM UTC'
    );
    expect(time.getAttribute('aria-describedby')).toBe(tooltip.id);
  },
};

/** A value that is no date draws a dash and no `<time>`. */
export const InvalidValueHasNoTimeElement: Story = {
  tags: ['!dev', '!autodocs'],
  args: { value: 'soon', tooltip: true },
  play: async ({ canvas }) => {
    expect(canvas.getByText('—').tagName).toBe('SPAN');
    expect(canvas.queryByRole('tooltip')).toBeNull();
  },
};
