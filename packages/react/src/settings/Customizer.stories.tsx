import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, LayoutDashboard, Layers, Settings, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Shell } from '../layout/Shell';
import { Sidebar } from '../layout/Sidebar';
import { Topbar } from '../layout/Topbar';
import { Navbar } from '../navigation/Navbar';
import { expectNoHorizontalOverflow, mobileViewport, portalDocsParams } from '../storybook-helpers';
import { Button } from '../ui/Button';
import {
  Customizer,
  CUSTOMIZER_DEFAULT_VALUE,
  type CustomizerPreset,
  type CustomizerProps,
  type CustomizerValue,
} from './Customizer';
import { applyAppearance, type CosmosAccent, type CosmosTextSize } from './appearance';

const base: CustomizerValue = { ...CUSTOMIZER_DEFAULT_VALUE };

const PRESETS: CustomizerPreset[] = [
  {
    id: 'cosmos',
    label: 'Cosmos',
    value: { theme: 'light', accent: 'blue', font: 'outfit', density: 'default' },
  },
  { id: 'night-ops', label: 'Night ops', value: { theme: 'dark', accent: 'teal' } },
  { id: 'sand', label: 'Sand', value: { theme: 'sand', accent: 'orange' } },
];

// The host owns the value: this keeps it, and passes every change on to the story's `onChange`.
const Controlled = (args: CustomizerProps) => {
  const [value, setValue] = useState(args.value);
  return (
    <Customizer
      {...args}
      value={value}
      onChange={(next) => {
        setValue(next);
        args.onChange(next);
      }}
    />
  );
};

const meta = {
  title: 'Settings/Customizer',
  component: Customizer,
  parameters: portalDocsParams.lg(),
  tags: ['autodocs'],
  args: { open: true, onClose: fn(), value: base, onChange: fn() },
  render: (args) => <Controlled {...args} />,
} satisfies Meta<typeof Customizer>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──────────────────────────────────────────────────────────────────

/** The panel open, with the Cosmos defaults. It holds the choice only: the host applies it. */
export const Default: Story = {};

/** `presets` adds a section of starting points; the one that matches the value shows as selected. */
export const WithPresets: Story = { args: { presets: PRESETS } };

/** A host with a fixed layout leaves the layout, sidebar and container sections out of `sections`. */
export const WithSectionsHidden: Story = {
  args: { sections: ['theme', 'accent', 'font', 'textSize', 'density', 'direction'] },
};

/** On a phone the panel takes the whole width. */
export const Mobile: Story = {
  args: { presets: PRESETS },
  globals: mobileViewport,
  play: async () => {
    expectNoHorizontalOverflow();
  },
};

// ── In an app ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'cosmos-customizer-story';
// What `applyAppearance` writes on `<html>`, put back when the story goes away.
const ROOT_ATTRIBUTES = [
  'class',
  'data-accent',
  'data-font',
  'data-text-size',
  'data-density',
  'dir',
];

// The page as it is now (the toolbar's theme, accent… ), so the story starts from what is shown.
const valueOfPage = (): CustomizerValue => {
  const root = document.documentElement;
  return {
    ...CUSTOMIZER_DEFAULT_VALUE,
    theme:
      (['sand', 'dark', 'deep-blue'] as const).find((t) => root.classList.contains(t)) ?? 'light',
    accent: (root.dataset.accent as CosmosAccent | undefined) ?? 'blue',
    textSize: (root.dataset.textSize as CosmosTextSize | undefined) ?? 'md',
    direction: root.dir === 'rtl' ? 'rtl' : 'ltr',
  };
};

const readStored = (): CustomizerValue => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...valueOfPage(), ...(JSON.parse(stored) as CustomizerValue) };
  } catch {
    // Storage blocked, or a value that isn't JSON: start from the page.
  }
  return valueOfPage();
};

const store = (value: CustomizerValue) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Storage blocked: the choice lasts until the page closes.
  }
};

const OpenButton = ({ onClick }: { onClick: () => void }) => (
  <Button variant="secondary" size="sm" icon={SlidersHorizontal} onClick={onClick}>
    Customize
  </Button>
);

const Page = () => (
  <div className="p-6">
    <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">Overview</h2>
    <div className="mt-4 grid grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <div
          key={n}
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-6"
        >
          <p className="text-2xs tracking-wider text-[var(--color-text-muted)] uppercase">
            Card {n}
          </p>
          <p className="text-brand-600 dark:text-brand-400 mt-2 text-3xl font-bold">{n * 12}</p>
        </div>
      ))}
    </div>
  </div>
);

// What a host does with the value: `applyAppearance` for the page, and the rest as props of the
// Shell and the Sidebar. The Customizer sits beside the Shell, so swapping the layout never
// re-creates it.
const App = () => {
  const [value, setValue] = useState(readStored);
  const [open, setOpen] = useState(false);

  // `applyAppearance` leaves the document changed: put it back for the next story.
  useEffect(() => {
    const root = document.documentElement;
    const before = ROOT_ATTRIBUTES.map((name) => [name, root.getAttribute(name)] as const);
    return () =>
      before.forEach(([name, attribute]) =>
        attribute === null ? root.removeAttribute(name) : root.setAttribute(name, attribute)
      );
  }, []);
  useEffect(() => applyAppearance(value), [value]);

  const change = (next: CustomizerValue) => {
    setValue(next);
    store(next);
  };
  const { layout, sidebar, container } = { ...CUSTOMIZER_DEFAULT_VALUE, ...value };
  const customize = <OpenButton onClick={() => setOpen(true)} />;

  return (
    <>
      <Shell
        container={container}
        sidebarCollapsed={sidebar === 'collapsed' || sidebar === 'hover'}
        onCollapsedChange={(collapsed) =>
          change({ ...value, sidebar: collapsed ? 'collapsed' : 'expanded' })
        }
        // The compact sidebar has no collapsed state: its hamburger would do nothing.
        collapseControl={sidebar === 'compact' ? 'sidebar' : 'topbar'}
        topbar={
          layout === 'horizontal' ? (
            <Navbar>
              <Navbar.Brand>
                <span className="ms-2 text-lg font-semibold text-gray-900 dark:text-white">
                  Cosmos
                </span>
                <Navbar.Items>
                  <Navbar.Item active href="#">
                    Dashboard
                  </Navbar.Item>
                  <Navbar.Item href="#">Library</Navbar.Item>
                  <Navbar.Item href="#">Settings</Navbar.Item>
                </Navbar.Items>
              </Navbar.Brand>
              <Navbar.Actions>{customize}</Navbar.Actions>
            </Navbar>
          ) : (
            // A paragraph, not the h1: the panel's title is an h3, which needs an h2 before it.
            <Topbar pageTitle="Dashboard" as="p" endActions={customize} />
          )
        }
        sidebar={
          layout === 'horizontal' ? undefined : (
            <Sidebar
              variant={sidebar === 'compact' ? 'compact' : 'default'}
              expandOnHover={sidebar === 'hover' ? 'overlay' : false}
            >
              <Sidebar.Brand
                logo={<Box className="h-5 w-5" />}
                title="Cosmos"
                subtitle="Design system"
              />
              <div className="py-3">
                <Sidebar.Item icon={LayoutDashboard} label="Dashboard" active />
                <Sidebar.Item icon={Layers} label="Library" />
                <Sidebar.Item icon={Settings} label="Settings" />
              </div>
            </Sidebar>
          )
        }
      >
        <Page />
      </Shell>
      <Customizer
        open={open}
        onClose={() => setOpen(false)}
        value={value}
        onChange={change}
        presets={PRESETS}
      />
    </>
  );
};

/**
 * The whole wiring. The value is kept in `localStorage` and applied on every change:
 * `applyAppearance` for the theme, accent, font, text size, density and direction; `container`,
 * the sidebar mode (`sidebarCollapsed`, `expandOnHover`, `variant`) and the layout (a `Navbar` in
 * place of the `Sidebar`) as props of `Shell` and `Sidebar`.
 */
export const InAnApp: Story = {
  parameters: portalDocsParams.full(),
  render: () => <App />,
};

// ── Interaction tests ────────────────────────────────────────────────────────

const panel = () => within(document.body).getByRole('dialog', { name: 'Customize' });
const group = (name: string) => within(panel()).getByRole('radiogroup', { name });
const choose = async (groupName: string, option: string) =>
  userEvent.click(within(group(groupName)).getByRole('radio', { name: option }));

export const EachOptionCallsOnChange: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onChange: fn() },
  play: async ({ args }) => {
    const steps: [group: string, option: string, patch: Partial<CustomizerValue>][] = [
      ['Theme', 'Deep Blue', { theme: 'deep-blue' }],
      ['Accent color', 'Teal', { accent: 'teal' }],
      ['Font', 'Inter', { font: 'inter' }],
      ['Text size', 'Large', { textSize: 'lg' }],
      ['Density', 'Compact', { density: 'compact' }],
      ['Direction', 'Right to left', { direction: 'rtl' }],
      ['Layout', 'Horizontal', { layout: 'horizontal' }],
      ['Sidebar', 'Compact', { sidebar: 'compact' }],
      ['Sidebar', 'On hover', { sidebar: 'hover' }],
      ['Container', 'Boxed', { container: 'boxed' }],
    ];
    let expected = base;
    for (const [groupName, option, patch] of steps) {
      await choose(groupName, option);
      // The whole new value, not the field.
      expected = { ...expected, ...patch };
      await expect(args.onChange).toHaveBeenLastCalledWith(expected);
    }
    await expect(args.onChange).toHaveBeenCalledTimes(steps.length);
  },
};

export const SectionsAreInTheDocumentedOrder: Story = {
  tags: ['!dev', '!autodocs'],
  args: { presets: PRESETS },
  play: async () => {
    const names = within(panel())
      .getAllByRole('radiogroup')
      .map((el) => el.getAttribute('aria-labelledby'))
      .map((id) => document.getElementById(id ?? '')?.textContent);
    await expect(names).toEqual([
      'Presets',
      'Theme',
      'Accent color',
      'Font',
      'Text size',
      'Density',
      'Direction',
      'Layout',
      'Sidebar',
      'Container',
    ]);
  },
};

export const PresetMergesItsValue: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    presets: PRESETS,
    onChange: fn(),
    value: { ...base, textSize: 'lg' as const, font: 'inter' as const },
  },
  play: async ({ args }) => {
    await choose('Presets', 'Night ops');
    // Its fields over the current value; the others are kept.
    await expect(args.onChange).toHaveBeenLastCalledWith({
      ...args.value,
      theme: 'dark',
      accent: 'teal',
    });
  },
};

export const PresetMatchingTheValueIsSelected: Story = {
  tags: ['!dev', '!autodocs'],
  args: { presets: PRESETS, value: { ...base, theme: 'dark', accent: 'teal' } },
  play: async () => {
    const presets = within(group('Presets'));
    await expect(presets.getByRole('radio', { name: 'Night ops' })).toBeChecked();
    await expect(presets.getByRole('radio', { name: 'Cosmos' })).not.toBeChecked();
    await expect(presets.getByRole('radio', { name: 'Sand' })).not.toBeChecked();
    // One more field than the preset sets: still the preset's own fields all match.
    await choose('Font', 'Inter');
    await expect(presets.getByRole('radio', { name: 'Night ops' })).toBeChecked();
    await choose('Accent color', 'Rose');
    await expect(presets.getByRole('radio', { name: 'Night ops' })).not.toBeChecked();
  },
};

export const NoPresetsNoSection: Story = {
  tags: ['!dev', '!autodocs'],
  play: async () => {
    await expect(within(panel()).queryByRole('radiogroup', { name: 'Presets' })).toBeNull();
    await expect(group('Theme')).toBeVisible();
  },
};

export const ResetRestoresTheDefaultValue: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    onChange: fn(),
    value: { ...base, theme: 'dark', accent: 'teal', layout: 'horizontal' },
    defaultValue: { ...base, theme: 'sand', accent: 'orange' },
  },
  play: async ({ args }) => {
    await userEvent.click(within(panel()).getByRole('button', { name: 'Reset' }));
    await expect(args.onChange).toHaveBeenLastCalledWith(args.defaultValue);
  },
};

export const ResetFallsBackToTheCosmosDefaults: Story = {
  tags: ['!dev', '!autodocs'],
  args: { onChange: fn(), value: { ...base, theme: 'dark', direction: 'rtl' } },
  play: async ({ args }) => {
    await userEvent.click(within(panel()).getByRole('button', { name: 'Reset' }));
    await expect(args.onChange).toHaveBeenLastCalledWith(CUSTOMIZER_DEFAULT_VALUE);
  },
};

// `navigator.clipboard.writeText` rejects in the vitest browser sandbox (no user gesture, no
// permission): stub it for the duration of the test, as the Clipboard stories do.
const stubClipboard = (writeText: (text: string) => Promise<void>) => {
  const original = navigator.clipboard;
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  return () =>
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: original });
};

export const CopyWritesTheValueAsJson: Story = {
  tags: ['!dev', '!autodocs'],
  args: { value: { ...base, theme: 'dark', accent: 'teal', container: 'boxed' } },
  play: async ({ args }) => {
    const writeText = fn(() => Promise.resolve());
    const restore = stubClipboard(writeText);
    try {
      await userEvent.click(within(panel()).getByRole('button', { name: 'Copy config' }));
      await expect(writeText).toHaveBeenCalledWith(JSON.stringify(args.value, null, 2));
      // Said politely, to a screen reader, and gone after a moment.
      await expect(within(panel()).getByRole('status')).toHaveTextContent('Copied');
    } finally {
      restore();
    }
  },
};

export const CopyAnnouncesAFailure: Story = {
  tags: ['!dev', '!autodocs'],
  play: async () => {
    const restore = stubClipboard(() => Promise.reject(new Error('denied')));
    try {
      await userEvent.click(within(panel()).getByRole('button', { name: 'Copy config' }));
      await waitFor(() =>
        expect(within(panel()).getByRole('status')).toHaveTextContent('Could not copy')
      );
    } finally {
      restore();
    }
  },
};

export const SectionsHidesTheOnesLeftOut: Story = {
  tags: ['!dev', '!autodocs'],
  args: { presets: PRESETS, sections: ['theme', 'accent', 'direction'] },
  play: async () => {
    const shown = within(panel())
      .getAllByRole('radiogroup')
      .map((el) => document.getElementById(el.getAttribute('aria-labelledby') ?? '')?.textContent);
    await expect(shown).toEqual(['Theme', 'Accent color', 'Direction']);
  },
};

// ── Focus and direction ──────────────────────────────────────────────────────

// A host that applies the direction to the page, as it should: `dir` flips under the open panel.
const AppliesDirection = (args: CustomizerProps) => {
  const [value, setValue] = useState<CustomizerValue>({
    ...args.value,
    direction: document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr',
  });
  useEffect(() => {
    const before = document.documentElement.getAttribute('dir');
    return () => {
      if (before === null) document.documentElement.removeAttribute('dir');
      else document.documentElement.setAttribute('dir', before);
    };
  }, []);
  useEffect(() => applyAppearance(value), [value]);
  return <Customizer {...args} value={value} onChange={setValue} />;
};

export const SwitchingDirectionKeepsTheFocusInThePanel: Story = {
  tags: ['!dev', '!autodocs'],
  render: (args) => <AppliesDirection {...args} />,
  play: async () => {
    const root = document.documentElement;
    const from = root.dir === 'rtl' ? 'Right to left' : 'Left to right';
    const to = root.dir === 'rtl' ? 'Left to right' : 'Right to left';
    for (const option of [to, from]) {
      await choose('Direction', option);
      await expect(root.dir).toBe(option === 'Right to left' ? 'rtl' : '');
      const radio = within(group('Direction')).getByRole('radio', { name: option });
      await expect(radio).toBeChecked();
      // The page re-rendered under the other direction, and the focus stayed where it was.
      await expect(radio).toHaveFocus();
      await expect(panel()).toContainElement(document.activeElement as HTMLElement);
    }
  },
};

export const RightToLeftPanelSitsOnTheLeft: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { direction: 'rtl' },
  play: async () => {
    const box = panel().getBoundingClientRect();
    // The end side of the line is the left one under `dir="rtl"`.
    await expect(box.left).toBe(0);
    await expect(box.right).toBeLessThan(window.innerWidth);
  },
};

export const LeftToRightPanelSitsOnTheRight: Story = {
  tags: ['!dev', '!autodocs'],
  globals: { direction: 'ltr' },
  play: async () => {
    const box = panel().getBoundingClientRect();
    await expect(box.right).toBe(window.innerWidth);
    await expect(box.left).toBeGreaterThan(0);
  },
};

// ── The wiring story ─────────────────────────────────────────────────────────

export const InAnAppAppliesTheChoice: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: portalDocsParams.full(),
  render: () => <App />,
  play: async ({ canvas }) => {
    try {
      await userEvent.click(canvas.getByRole('button', { name: 'Customize' }));
      await expect(canvas.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();

      await choose('Theme', 'Sand');
      await expect(document.documentElement).toHaveClass('sand');
      await choose('Accent color', 'Teal');
      await expect(document.documentElement).toHaveAttribute('data-accent', 'teal');
      await choose('Density', 'Compact');
      await expect(document.documentElement).toHaveAttribute('data-density', 'compact');

      // Horizontal: a Navbar takes the place of the Sidebar.
      await choose('Layout', 'Horizontal');
      await waitFor(() =>
        expect(canvas.queryByRole('navigation', { name: 'Main navigation' })).toBeNull()
      );
      await choose('Layout', 'Vertical');
      await expect(canvas.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();

      await choose('Container', 'Boxed');

      // The value is kept for the next visit.
      await expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toMatchObject({
        theme: 'sand',
        accent: 'teal',
        density: 'compact',
        container: 'boxed',
      });
    } finally {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Nothing was stored.
      }
    }
  },
};
