import { DocsContainer, type DocsContainerProps } from '@storybook/addon-docs/blocks';
import { type PropsWithChildren, useEffect, useState } from 'react';
import { GLOBALS_UPDATED } from 'storybook/internal/core-events';
import { chromeThemeFor } from './cosmos-theme';

type Context = DocsContainerProps['context'];

const themeOnLoad = (context: Context): unknown => {
  try {
    return context.getStoryContext(context.storyById()).globals.theme;
  } catch {
    // A docs page without a story (plain MDX) has no story context to read
    // the globals from: chromeThemeFor falls back to the default theme.
    return undefined;
  }
};

/**
 * Docs page chrome (prose, prop tables, code blocks) in the theme picked in
 * the toolbar. The value on load comes from the page's primary story, which
 * already holds the URL globals; later changes arrive on the channel.
 */
export const CosmosDocsContainer = ({
  context,
  children,
}: PropsWithChildren<DocsContainerProps>) => {
  const [theme, setTheme] = useState(() => themeOnLoad(context));

  useEffect(() => {
    const onUpdate = ({ globals }: { globals: Record<string, unknown> }) => setTheme(globals.theme);
    context.channel.on(GLOBALS_UPDATED, onUpdate);
    return () => context.channel.off(GLOBALS_UPDATED, onUpdate);
  }, [context]);

  return (
    <DocsContainer context={context} theme={chromeThemeFor(theme)}>
      {children}
    </DocsContainer>
  );
};
