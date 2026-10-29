import { clsx } from 'clsx';
import { Check, Copy, RotateCcw } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Drawer, type DrawerSize } from '../ui/Drawer';
import { Button } from '../ui/Button';
import type { ShellContainer } from '../layout/Shell';
import { AccentPicker } from './AccentPicker';
import { OptionPicker, type OptionItem } from './OptionPicker';
import { PalettePicker } from './PalettePicker';
import { densityOptions, fontOptions, textSizeOptions } from './appearanceOptions';
import {
  COSMOS_ACCENTS,
  COSMOS_DENSITIES,
  COSMOS_FONTS,
  COSMOS_TEXT_SIZES,
  COSMOS_THEMES,
  type CosmosAccent,
  type CosmosAccentMeta,
  type CosmosAppearance,
  type CosmosDensity,
  type CosmosDensityMeta,
  type CosmosDirection,
  type CosmosFont,
  type CosmosFontMeta,
  type CosmosSystemThemeMeta,
  type CosmosTextSize,
  type CosmosTextSizeMeta,
  type CosmosThemeChoice,
  type CosmosThemeMeta,
} from './appearance';

/** The shell's navigation: a sidebar down the side, or a navbar across the top. */
export type CustomizerLayout = 'vertical' | 'horizontal';

/**
 * The sidebar's mode: `expanded`, `collapsed` to its icons, `hover` (collapsed, opens while the
 * pointer rests on it) or `compact` (icons over small labels).
 */
export type CustomizerSidebar = 'expanded' | 'collapsed' | 'hover' | 'compact';

/**
 * What the Customizer holds: the page's appearance (what `applyAppearance` takes) plus the three
 * choices about the shell. Every field is optional but the theme and the accent; a missing one
 * shows as its Cosmos default.
 */
export type CustomizerValue = CosmosAppearance & {
  layout?: CustomizerLayout;
  sidebar?: CustomizerSidebar;
  container?: ShellContainer;
};

/** A section of the panel, in the order the panel lists them. */
export type CustomizerSection =
  | 'presets'
  | 'theme'
  | 'accent'
  | 'font'
  | 'textSize'
  | 'density'
  | 'direction'
  | 'layout'
  | 'sidebar'
  | 'container';

/** A named value the host offers as a one-click starting point. */
export type CustomizerPreset = {
  id: string;
  label: string;
  /** The fields it sets; the others keep the current value. */
  value: Partial<CustomizerValue>;
};

/** Every section of the panel, in order: the default of `sections`. */
export const CUSTOMIZER_SECTIONS: CustomizerSection[] = [
  'presets',
  'theme',
  'accent',
  'font',
  'textSize',
  'density',
  'direction',
  'layout',
  'sidebar',
  'container',
];

/** The Cosmos defaults: the default of `defaultValue`, and what a missing field shows as. */
export const CUSTOMIZER_DEFAULT_VALUE = {
  theme: 'light',
  accent: 'blue',
  font: 'outfit',
  textSize: 'md',
  density: 'default',
  direction: 'ltr',
  layout: 'vertical',
  sidebar: 'expanded',
  container: 'fluid',
} satisfies CustomizerValue;

const DEFAULT_LABELS: Record<CustomizerSection, string> = {
  presets: 'Presets',
  theme: 'Theme',
  accent: 'Accent color',
  font: 'Font',
  textSize: 'Text size',
  density: 'Density',
  direction: 'Direction',
  layout: 'Layout',
  sidebar: 'Sidebar',
  container: 'Container',
};

export type CustomizerProps = {
  /** Whether the panel is open. The host owns it, as for a `Drawer`. */
  open: boolean;
  /** Called by the close button, the backdrop and Escape. */
  onClose: () => void;
  /** The current choices. */
  value: CustomizerValue;
  /**
   * Called with the whole new value as soon as an option is picked (on click, never on hover),
   * a preset is applied, or Reset is pressed. The Customizer applies nothing itself: see above.
   */
  onChange: (next: CustomizerValue) => void;
  /** What Reset restores. Default `CUSTOMIZER_DEFAULT_VALUE`. */
  defaultValue?: CustomizerValue;
  /**
   * Starting points. The Presets section shows only when this is not empty; Cosmos ships none.
   * The preset whose fields all equal the current value shows as selected.
   */
  presets?: CustomizerPreset[];
  /**
   * The sections to show. A host hides one by leaving it out (a fixed layout: no `layout`,
   * `sidebar` or `container`). They always appear in the panel's order, whatever the order here.
   * Default `CUSTOMIZER_SECTIONS`.
   */
  sections?: CustomizerSection[];
  /** Themes to offer. Default: all of `COSMOS_THEMES`. Add `COSMOS_SYSTEM_THEME` for "System". */
  themes?: (CosmosThemeMeta | CosmosSystemThemeMeta)[];
  /** Accents to offer. Default: all of `COSMOS_ACCENTS`. */
  accents?: CosmosAccentMeta[];
  /** Fonts to offer. Default: all of `COSMOS_FONTS`; offer only those whose CSS the app imports. */
  fonts?: CosmosFontMeta[];
  /** Text sizes to offer. Default: all of `COSMOS_TEXT_SIZES`. */
  textSizes?: CosmosTextSizeMeta[];
  /** Densities to offer. Default: all of `COSMOS_DENSITIES`. */
  densities?: CosmosDensityMeta[];
  /** Headings of the sections, by section. Default: English names ("Accent color", "Text size"…). */
  labels?: Partial<Record<CustomizerSection, string>>;
  /** Title of the panel. Default `'Customize'`. */
  title?: string;
  /** Line under the title. Default `'Changes apply at once.'`. */
  subtitle?: string;
  /** Width of the panel. Default `md`. */
  size?: DrawerSize;
};

// ── Previews ─────────────────────────────────────────────────────────────────

const BAR = 'bg-gray-300 dark:bg-gray-600';
const LINE = 'h-0.5 rounded-full bg-gray-200 dark:bg-gray-700';

// A page in miniature, 40 by 32 px: a row (so it mirrors with the page's direction) of an optional
// navigation and the content. Pixel sizes, so the preview doesn't follow the text size.
const Thumb = ({ children, column = false }: { children: ReactNode; column?: boolean }) => (
  <span
    aria-hidden
    className={clsx(
      'relative flex h-8 w-10 overflow-hidden rounded-sm border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900',
      column ? 'flex-col' : 'flex-row'
    )}
  >
    {children}
  </span>
);

const Content = ({ boxed = false }: { boxed?: boolean }) => (
  <span className={clsx('flex flex-1 flex-col gap-0.5 p-1', boxed && 'px-2.5')}>
    <span className={clsx(LINE, 'w-full')} />
    <span className={clsx(LINE, 'w-2/3')} />
    <span className={clsx(LINE, 'w-full')} />
  </span>
);

const LAYOUT_PREVIEW: Record<CustomizerLayout, ReactNode> = {
  vertical: (
    <Thumb>
      <span className={clsx(BAR, 'w-3 shrink-0')} />
      <Content />
    </Thumb>
  ),
  horizontal: (
    <Thumb column>
      <span className={clsx(BAR, 'h-2 shrink-0')} />
      <Content />
    </Thumb>
  ),
};

const SIDEBAR_PREVIEW: Record<CustomizerSidebar, ReactNode> = {
  expanded: (
    <Thumb>
      <span className={clsx(BAR, 'w-4 shrink-0')} />
      <Content />
    </Thumb>
  ),
  collapsed: (
    <Thumb>
      <span className={clsx(BAR, 'w-1.5 shrink-0')} />
      <Content />
    </Thumb>
  ),
  // Collapsed, with the open sidebar drawn over the content as it is while the pointer rests on it.
  hover: (
    <Thumb>
      <span className={clsx(BAR, 'w-1.5 shrink-0')} />
      <Content />
      <span className="inset-s-0 absolute inset-y-0 w-4 border-e border-gray-400 bg-gray-300/90 dark:border-gray-500 dark:bg-gray-600/90" />
    </Thumb>
  ),
  compact: (
    <Thumb>
      <span className={clsx(BAR, 'flex w-2.5 shrink-0 flex-col items-center gap-1 pt-1')}>
        {[0, 1, 2].map((dot) => (
          <span key={dot} className="size-1 rounded-full bg-gray-500 dark:bg-gray-400" />
        ))}
      </span>
      <Content />
    </Thumb>
  ),
};

const CONTAINER_PREVIEW: Record<ShellContainer, ReactNode> = {
  fluid: (
    <Thumb>
      <Content />
    </Thumb>
  ),
  boxed: (
    <Thumb>
      <Content boxed />
    </Thumb>
  ),
};

// A few lines laid against the start of the line, under the direction the option names: `dir` on
// the preview itself, so each one keeps its own side whichever direction the page is in.
const DirectionPreview = ({ dir }: { dir: CosmosDirection }) => (
  <span aria-hidden dir={dir} className="flex w-8 flex-col items-start gap-1">
    <span className={clsx(LINE, 'h-1 w-full')} />
    <span className={clsx(LINE, 'h-1 w-2/3')} />
    <span className={clsx(LINE, 'h-1 w-full')} />
  </span>
);

const presetPreview = (
  preset: CustomizerPreset,
  themes: (CosmosThemeMeta | CosmosSystemThemeMeta)[],
  accents: CosmosAccentMeta[]
) => {
  const theme = themes.find((t) => t.id === (preset.value.theme ?? CUSTOMIZER_DEFAULT_VALUE.theme));
  const accent = accents.find(
    (a) => a.id === (preset.value.accent ?? CUSTOMIZER_DEFAULT_VALUE.accent)
  );
  return (
    <span
      aria-hidden
      className="flex size-9 items-end justify-end overflow-hidden rounded-lg border border-gray-300 p-1 dark:border-gray-600"
      style={{ backgroundColor: theme?.preview.bg }}
    >
      <span
        className="size-4 rounded-md border"
        style={{ backgroundColor: theme?.preview.surface, borderColor: theme?.preview.border }}
      >
        <span
          className="m-0.5 block size-1.5 rounded-full"
          style={{ backgroundColor: accent?.hex }}
        />
      </span>
    </span>
  );
};

// ── Structure ────────────────────────────────────────────────────────────────

// A heading and the picker it names, linked by `aria-labelledby`.
const Group = ({
  title,
  children,
}: {
  title: string;
  children: (labelledBy: string) => ReactNode;
}) => {
  const id = useId();
  return (
    <div>
      <p id={id} className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {title}
      </p>
      <div className="mt-3">{children(id)}</div>
    </div>
  );
};

const optionsOf = <T extends string>(
  labels: Record<T, string>,
  preview: (id: T) => ReactNode
): OptionItem[] =>
  (Object.keys(labels) as T[]).map((id) => ({ id, label: labels[id], preview: preview(id) }));

const DIRECTION_OPTIONS = optionsOf<CosmosDirection>(
  { ltr: 'Left to right', rtl: 'Right to left' },
  (dir) => <DirectionPreview dir={dir} />
);
const LAYOUT_OPTIONS = optionsOf<CustomizerLayout>(
  { vertical: 'Vertical', horizontal: 'Horizontal' },
  (id) => LAYOUT_PREVIEW[id]
);
const SIDEBAR_OPTIONS = optionsOf<CustomizerSidebar>(
  { expanded: 'Expanded', collapsed: 'Collapsed', hover: 'On hover', compact: 'Compact' },
  (id) => SIDEBAR_PREVIEW[id]
);
const CONTAINER_OPTIONS = optionsOf<ShellContainer>(
  { fluid: 'Fluid', boxed: 'Boxed' },
  (id) => CONTAINER_PREVIEW[id]
);

const sameValue = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b);

/** How long the "Copied" announcement stays, in ms. */
const ANNOUNCE_MS = 1500;

/**
 * Customizer — a panel on the end side where a user shapes the app: theme, accent, font, text
 * size, density, direction, and the shell's layout, sidebar mode and container, with optional
 * presets, a Reset and a "Copy config" that puts the value on the clipboard as JSON. Built on
 * `Drawer`, `PalettePicker`, `AccentPicker` and `OptionPicker`.
 *
 * It only holds the choice, and applies nothing: it is controlled (`value`, `onChange`) and the
 * host does the rest, on every change:
 *
 * - `applyAppearance(value)` sets the theme, accent, font, text size, density and direction
 *   (`dir`) on `<html>`;
 * - `value.container` is `Shell`'s `container`;
 * - `value.sidebar` drives `Shell` and `Sidebar`: `collapsed` is `Shell`'s `sidebarCollapsed`,
 *   `hover` is collapsed plus `expandOnHover="overlay"`, `compact` is `Sidebar`'s
 *   `variant="compact"`, `expanded` is none of those;
 * - `value.layout` `horizontal` puts a `Navbar` in `Shell`'s `topbar` in place of the `Sidebar`.
 *
 * Keep the Customizer outside what `layout` swaps, so the panel keeps its focus as the shell
 * re-renders. Saving the value (local storage, a user profile) is the host's too.
 */
export const Customizer = ({
  open,
  onClose,
  value,
  onChange,
  defaultValue = CUSTOMIZER_DEFAULT_VALUE,
  presets = [],
  sections = CUSTOMIZER_SECTIONS,
  themes = COSMOS_THEMES,
  accents = COSMOS_ACCENTS,
  fonts = COSMOS_FONTS,
  textSizes = COSMOS_TEXT_SIZES,
  densities = COSMOS_DENSITIES,
  labels,
  title = 'Customize',
  subtitle = 'Changes apply at once.',
  size,
}: CustomizerProps) => {
  const [announcement, setAnnouncement] = useState('');
  const announceTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (announceTimer.current !== null) window.clearTimeout(announceTimer.current);
    },
    []
  );

  const shown = (section: CustomizerSection) => sections.includes(section);
  const label = (section: CustomizerSection) => labels?.[section] ?? DEFAULT_LABELS[section];
  const current = { ...CUSTOMIZER_DEFAULT_VALUE, ...value };
  const set = (patch: Partial<CustomizerValue>) => onChange({ ...value, ...patch });

  const matching = presets.find((preset) =>
    (Object.keys(preset.value) as (keyof CustomizerValue)[]).every((key) =>
      sameValue(preset.value[key], current[key])
    )
  );

  const announce = (message: string) => {
    setAnnouncement(message);
    if (announceTimer.current !== null) window.clearTimeout(announceTimer.current);
    announceTimer.current = window.setTimeout(() => setAnnouncement(''), ANNOUNCE_MS);
  };
  const copyConfig = async () => {
    // Only the write can fail (no permission, an insecure context): wrap that, say so.
    try {
      await navigator.clipboard.writeText(JSON.stringify(value, null, 2));
    } catch {
      announce('Could not copy');
      return;
    }
    announce('Copied');
  };

  return (
    <Drawer open={open} onClose={onClose} side="end" size={size}>
      <Drawer.Header title={title} description={subtitle} onClose={onClose} />
      <Drawer.Body className="space-y-6">
        {shown('presets') && presets.length > 0 && (
          <Group title={label('presets')}>
            {(labelledBy) => (
              <OptionPicker
                aria-labelledby={labelledBy}
                cols={2}
                value={matching?.id ?? ''}
                onChange={(id) => {
                  const preset = presets.find((p) => p.id === id);
                  if (preset) onChange({ ...value, ...preset.value });
                }}
                options={presets.map((preset) => ({
                  id: preset.id,
                  label: preset.label,
                  preview: presetPreview(preset, themes, accents),
                }))}
              />
            )}
          </Group>
        )}
        {shown('theme') && (
          <Group title={label('theme')}>
            {(labelledBy) => (
              <PalettePicker
                aria-labelledby={labelledBy}
                palettes={themes}
                value={current.theme}
                cols={2}
                // ids come from `themes`, so they are theme choices.
                onChange={(id) => set({ theme: id as CosmosThemeChoice })}
              />
            )}
          </Group>
        )}
        {shown('accent') && (
          <Group title={label('accent')}>
            {(labelledBy) => (
              <AccentPicker
                aria-labelledby={labelledBy}
                colors={accents}
                value={current.accent}
                cols={6}
                onChange={(id) => set({ accent: id as CosmosAccent })}
              />
            )}
          </Group>
        )}
        {shown('font') && (
          <Group title={label('font')}>
            {(labelledBy) => (
              <OptionPicker
                aria-labelledby={labelledBy}
                cols={3}
                value={current.font}
                onChange={(id) => set({ font: id as CosmosFont })}
                options={fontOptions(fonts)}
              />
            )}
          </Group>
        )}
        {shown('textSize') && (
          <Group title={label('textSize')}>
            {(labelledBy) => (
              <OptionPicker
                aria-labelledby={labelledBy}
                cols={4}
                value={current.textSize}
                onChange={(id) => set({ textSize: id as CosmosTextSize })}
                options={textSizeOptions(textSizes)}
              />
            )}
          </Group>
        )}
        {shown('density') && (
          <Group title={label('density')}>
            {(labelledBy) => (
              <OptionPicker
                aria-labelledby={labelledBy}
                cols={3}
                value={current.density}
                onChange={(id) => set({ density: id as CosmosDensity })}
                options={densityOptions(densities)}
              />
            )}
          </Group>
        )}
        {shown('direction') && (
          <Group title={label('direction')}>
            {(labelledBy) => (
              <OptionPicker
                aria-labelledby={labelledBy}
                cols={2}
                value={current.direction}
                onChange={(id) => set({ direction: id as CosmosDirection })}
                options={DIRECTION_OPTIONS}
              />
            )}
          </Group>
        )}
        {shown('layout') && (
          <Group title={label('layout')}>
            {(labelledBy) => (
              <OptionPicker
                aria-labelledby={labelledBy}
                cols={2}
                value={current.layout}
                onChange={(id) => set({ layout: id as CustomizerLayout })}
                options={LAYOUT_OPTIONS}
              />
            )}
          </Group>
        )}
        {shown('sidebar') && (
          <Group title={label('sidebar')}>
            {(labelledBy) => (
              <OptionPicker
                aria-labelledby={labelledBy}
                cols={2}
                value={current.sidebar}
                onChange={(id) => set({ sidebar: id as CustomizerSidebar })}
                options={SIDEBAR_OPTIONS}
              />
            )}
          </Group>
        )}
        {shown('container') && (
          <Group title={label('container')}>
            {(labelledBy) => (
              <OptionPicker
                aria-labelledby={labelledBy}
                cols={2}
                value={current.container}
                onChange={(id) => set({ container: id as ShellContainer })}
                options={CONTAINER_OPTIONS}
              />
            )}
          </Group>
        )}
      </Drawer.Body>
      <Drawer.Footer className="justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={RotateCcw}
          onClick={() => onChange(defaultValue)}
        >
          Reset
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={announcement === 'Copied' ? Check : Copy}
          onClick={copyConfig}
        >
          Copy config
        </Button>
        <span role="status" className="sr-only">
          {announcement}
        </span>
      </Drawer.Footer>
    </Drawer>
  );
};
