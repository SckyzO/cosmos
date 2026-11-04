import { DocsContainer, type DocsContainerProps } from '@storybook/addon-docs/blocks';
import { type PropsWithChildren, useEffect, useState } from 'react';
import { GLOBALS_UPDATED, SET_GLOBALS } from 'storybook/internal/core-events';
import { chromeThemeFor } from './cosmos-theme';

type Context = DocsContainerProps['context'];

const themeNow = (context: Context): unknown => {
  try {
    // The preview's own globals: the URL's on load, the toolbar's after. Not the primary story's
    // `globals`, which a story may pin, and not the channel: the stories that render in a frame of
    // their own (`portalDocsParams`) report their globals on it, and those start on the default
    // theme.
    return context.getStoryContext(context.storyById()).userGlobals.theme;
  } catch {
    // A docs page without a story (plain MDX) has no story context: read the
    // globals the preview last sent, SET_GLOBALS at startup (URL globals
    // included) or a GLOBALS_UPDATED since. The channel keeps the last payload
    // of every event, its own included.
    const [last] = context.channel.last(GLOBALS_UPDATED) ?? context.channel.last(SET_GLOBALS) ?? [];
    return (last as { globals?: Record<string, unknown> } | undefined)?.globals?.theme;
  }
};

/**
 * Docs page chrome (prose, prop tables, code blocks) in the theme picked in
 * the toolbar. The value comes from the preview's globals, which already hold
 * the URL's, or from the channel on a page without stories; each change of the
 * toolbar's globals reads it again.
 */
export const CosmosDocsContainer = ({
  context,
  children,
}: PropsWithChildren<DocsContainerProps>) => {
  const [theme, setTheme] = useState(() => themeNow(context));

  useEffect(() => {
    // The payload is not read: a story frame of the page sends its own on the same channel.
    const onUpdate = ({ globals }: { globals: Record<string, unknown> }) =>
      setTheme(themeNow(context) ?? globals.theme);
    context.channel.on(GLOBALS_UPDATED, onUpdate);
    return () => context.channel.off(GLOBALS_UPDATED, onUpdate);
  }, [context]);

  return (
    <DocsContainer context={context} theme={chromeThemeFor(theme)}>
      {children}
    </DocsContainer>
  );
};
