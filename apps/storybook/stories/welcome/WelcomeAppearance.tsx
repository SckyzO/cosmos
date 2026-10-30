import { SlidersHorizontal } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import {
  AccentPicker,
  applyAppearance,
  Button,
  CodeBlock,
  COSMOS_ACCENTS,
  COSMOS_DENSITIES,
  COSMOS_RADII,
  COSMOS_TEXT_SIZES,
  COSMOS_THEMES,
  Customizer,
  OptionPicker,
  PalettePicker,
  type CosmosAccent,
  type CosmosAppearance,
  type CosmosDensity,
  type CosmosDirection,
  type CosmosRadius,
  type CosmosTextSize,
  type CosmosThemeChoice,
  type CustomizerSection,
  type OptionItem,
} from '../../../../packages/react/src';
import { Section } from './parts';
import { CARD, MONO, cx } from './styles';

// What the Customizer offers here: the appearance, not the shell's layout.
const CUSTOMIZER_SECTIONS: CustomizerSection[] = [
  'theme',
  'accent',
  'font',
  'textSize',
  'density',
  'radius',
  'direction',
];

/** What the page starts from: the toolbar's values, the Cosmos defaults for the rest. */
export type WelcomeAppearance = Required<Omit<CosmosAppearance, 'systemThemes'>>;

// ── Previews ─────────────────────────────────────────────────────────────────

// Each option shows its own effect, whatever the page is set to: sizes in pixels, a `dir` of its
// own. A radius is a pixel value too: the preview is not a Cosmos corner, it shows what one is.
const BAR = 'block rounded-full bg-gray-300 dark:bg-gray-600';

const DENSITY_ROWS: Record<CosmosDensity, { rows: number; gap: string }> = {
  compact: { rows: 5, gap: 'gap-0.5' },
  default: { rows: 4, gap: 'gap-1' },
  comfortable: { rows: 3, gap: 'gap-2' },
};

const densityPreview = (id: CosmosDensity) => (
  <span aria-hidden className={cx('flex w-9 flex-col', DENSITY_ROWS[id].gap)}>
    {Array.from({ length: DENSITY_ROWS[id].rows }, (_, row) => (
      <span key={row} className={cx(BAR, 'h-1.5 rounded-sm')} />
    ))}
  </span>
);

const RADIUS_PX: Record<CosmosRadius, number> = { none: 2, sm: 5, default: 9, lg: 14 };

const radiusPreview = (id: CosmosRadius) => (
  <span
    aria-hidden
    className="border-brand-500 bg-brand-500/15 block h-7 w-9 border-2"
    style={{ borderRadius: RADIUS_PX[id] }}
  />
);

// The same screen, a sidebar and a line of text, mirrored by `dir`; the Arabic sample says
// "Dashboard".
const directionPreview = (id: CosmosDirection) => (
  <span
    aria-hidden
    dir={id}
    lang={id === 'rtl' ? 'ar' : 'en'}
    className="flex h-8 w-10 gap-0.5 overflow-hidden rounded-sm border border-gray-300 p-0.5 dark:border-gray-600"
  >
    <span className={cx(BAR, 'w-2 shrink-0 rounded-sm')} />
    <span className="text-3xs flex-1 leading-tight text-gray-700 dark:text-gray-300">
      {id === 'rtl' ? 'لوحة' : 'Dash'}
    </span>
  </span>
);

const textSizePreview = (scale: number) => (
  <span aria-hidden className="font-semibold" style={{ fontSize: `${1.25 * scale}rem` }}>
    Aa
  </span>
);

const DIRECTIONS: { id: CosmosDirection; label: string }[] = [
  { id: 'ltr', label: 'Left to right' },
  { id: 'rtl', label: 'Right to left' },
];

const options = <T extends { id: string; label: string }>(
  metas: T[],
  preview: (meta: T) => ReactNode
): OptionItem[] => metas.map((m) => ({ id: m.id, label: m.label, preview: preview(m) }));

const DENSITY_OPTIONS = options(COSMOS_DENSITIES, (m) => densityPreview(m.id));
const RADIUS_OPTIONS = options(COSMOS_RADII, (m) => radiusPreview(m.id));
const DIRECTION_OPTIONS = options(DIRECTIONS, (m) => directionPreview(m.id));
const TEXT_SIZE_OPTIONS = options(COSMOS_TEXT_SIZES, (m) => textSizePreview(m.scale));

// ── The `<html>` the choices make ────────────────────────────────────────────

/** The element an app puts the choices on, leaving out what is the default. */
const htmlSnippet = (a: WelcomeAppearance): string => {
  const attrs: [string, string][] = [];
  if (a.theme !== 'light') attrs.push(['class', a.theme]);
  if (a.accent !== 'blue') attrs.push(['data-accent', a.accent]);
  if (a.font !== 'outfit') attrs.push(['data-font', a.font]);
  if (a.textSize !== 'md') attrs.push(['data-text-size', a.textSize]);
  if (a.density !== 'default') attrs.push(['data-density', a.density]);
  if (a.radius !== 'default') attrs.push(['data-radius', a.radius]);
  if (a.direction !== 'ltr') attrs.push(['dir', a.direction]);
  return `<html${attrs.map(([name, value]) => ` ${name}="${value}"`).join('')}>`;
};

// ── Structure ────────────────────────────────────────────────────────────────

// A heading with the attribute it sets, naming the picker under it.
const Choice = ({
  title,
  attr,
  hint,
  children,
}: {
  title: string;
  attr: string;
  hint?: string;
  children: (labelledBy: string) => ReactNode;
}) => {
  const id = useId();
  return (
    <div className="min-w-0">
      <p className="mb-2.5 flex items-baseline gap-2">
        <span id={id} className="text-sm font-semibold text-[var(--color-text-primary)]">
          {title}
        </span>
        <span className={cx(MONO, 'text-[var(--color-text-secondary)]')}>{attr}</span>
      </p>
      {hint && <p className="mb-3 text-sm text-[var(--color-text-secondary)]">{hint}</p>}
      {children(id)}
    </div>
  );
};

// The picker drives the same <html> class and attributes as the toolbar menus, so the whole page,
// live preview included, follows it. It starts from the toolbar's values and remounts when they
// change.
const Picker = ({ initial }: { initial: WelcomeAppearance }) => {
  const [appearance, setAppearance] = useState(initial);
  const [customizing, setCustomizing] = useState(false);
  const update = (patch: Partial<WelcomeAppearance>) => {
    const next = { ...appearance, ...patch };
    setAppearance(next);
    applyAppearance(next);
  };
  return (
    <div className="space-y-8">
      <Choice title="Theme" attr="class">
        {(labelledBy) => (
          <PalettePicker
            aria-labelledby={labelledBy}
            palettes={COSMOS_THEMES}
            value={appearance.theme}
            cols={4}
            onChange={(id) => update({ theme: id as CosmosThemeChoice })}
          />
        )}
      </Choice>
      <Choice title="Accent" attr="data-accent">
        {(labelledBy) => (
          <AccentPicker
            aria-labelledby={labelledBy}
            colors={COSMOS_ACCENTS}
            value={appearance.accent}
            cols={6}
            smCols={12}
            onChange={(id) => update({ accent: id as CosmosAccent })}
          />
        )}
      </Choice>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className={cx(CARD, 'p-4')}>
          <Choice
            title="Density"
            attr="data-density"
            hint="Row and control heights. Only the vertical rhythm moves."
          >
            {(labelledBy) => (
              <OptionPicker
                aria-labelledby={labelledBy}
                cols={3}
                options={DENSITY_OPTIONS}
                value={appearance.density}
                onChange={(id) => update({ density: id as CosmosDensity })}
              />
            )}
          </Choice>
        </div>
        <div className={cx(CARD, 'p-4')}>
          <Choice
            title="Corners"
            attr="data-radius"
            hint="One scale for every corner, from square to round."
          >
            {(labelledBy) => (
              <OptionPicker
                aria-labelledby={labelledBy}
                cols={4}
                options={RADIUS_OPTIONS}
                value={appearance.radius}
                onChange={(id) => update({ radius: id as CosmosRadius })}
              />
            )}
          </Choice>
        </div>
        <div className={cx(CARD, 'p-4')}>
          <Choice
            title="Reading direction"
            attr="dir"
            hint="Under right to left, layouts, icons and panels mirror."
          >
            {(labelledBy) => (
              <OptionPicker
                aria-labelledby={labelledBy}
                cols={2}
                options={DIRECTION_OPTIONS}
                value={appearance.direction}
                onChange={(id) => update({ direction: id as CosmosDirection })}
              />
            )}
          </Choice>
        </div>
        <div className={cx(CARD, 'p-4')}>
          <Choice
            title="Text size"
            attr="data-text-size"
            hint="Rescales the type. The font is picked apart, in the Customizer."
          >
            {(labelledBy) => (
              <OptionPicker
                aria-labelledby={labelledBy}
                cols={4}
                options={TEXT_SIZE_OPTIONS}
                value={appearance.textSize}
                onChange={(id) => update({ textSize: id as CosmosTextSize })}
              />
            )}
          </Choice>
        </div>
      </div>
      <div>
        <CodeBlock wrap language="html" code={htmlSnippet(appearance)} />
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          What your app sets for the choices above. Leave an attribute out for the default.
        </p>
      </div>
      <Button variant="secondary" icon={SlidersHorizontal} onClick={() => setCustomizing(true)}>
        Open the Customizer
      </Button>
      <Customizer
        open={customizing}
        onClose={() => setCustomizing(false)}
        sections={CUSTOMIZER_SECTIONS}
        value={appearance}
        onChange={(next) =>
          update({
            theme: next.theme,
            accent: next.accent,
            font: next.font ?? appearance.font,
            textSize: next.textSize ?? appearance.textSize,
            density: next.density ?? appearance.density,
            radius: next.radius ?? appearance.radius,
            direction: next.direction ?? appearance.direction,
          })
        }
      />
    </div>
  );
};

export const Appearance = ({ initial }: { initial: WelcomeAppearance }) => (
  <Section
    id="appearance"
    eyebrow="Make it yours"
    title="Pick one, and this whole page changes"
    lead="Each choice is one attribute on <html>, read by every component. Your users get the same choices from the Customizer panel, the appearance settings or the top bar menu."
  >
    <Picker key={Object.values(initial).join('-')} initial={initial} />
  </Section>
);
