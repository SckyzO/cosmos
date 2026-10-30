import { useState } from 'react';
import {
  AppearanceSettings,
  applyAppearance,
  type CosmosAppearance,
} from '../../../../packages/react/src';
import { Section } from './parts';

// The picker drives the same <html> class and attributes as the toolbar menus, so the whole page,
// live preview included, follows it. It starts from the toolbar's values and remounts when they
// change.
const Picker = (initial: CosmosAppearance) => {
  const [appearance, setAppearance] = useState(initial);
  const update = (patch: Partial<CosmosAppearance>) => {
    const next = { ...appearance, ...patch };
    setAppearance(next);
    applyAppearance(next);
  };
  return (
    <AppearanceSettings
      {...appearance}
      onThemeChange={(theme) => update({ theme })}
      onAccentChange={(accent) => update({ accent })}
      onFontChange={(font) => update({ font })}
      onTextSizeChange={(textSize) => update({ textSize })}
      onDensityChange={(density) => update({ density })}
    />
  );
};

export const Appearance = ({ initial }: { initial: CosmosAppearance }) => (
  <Section
    id="appearance"
    eyebrow="Make it yours"
    title="Pick one, and this whole page changes"
    lead="Each choice is one attribute on <html>, read by every component."
  >
    <Picker key={Object.values(initial).join('-')} {...initial} />
  </Section>
);
