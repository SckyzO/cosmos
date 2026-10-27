import { useEffect, useReducer, useState } from 'react';
import { CodeBlock as PlainCodeBlock, type CodeBlockProps } from '../ui/CodeBlock';
import { highlight as builtIn, isLanguageLoaded, loadLanguage } from './highlighter';

export type { CodeBlockProps };

/**
 * `CodeBlock` with the Shiki highlighter plugged in: `<CodeBlock language="yaml" code={…} />` is
 * coloured with no setup. The language loads on demand; until it has, and for a language with no
 * grammar, the block shows plain text. A `highlight` prop still overrides the built-in one.
 */
export const CodeBlock = ({ highlight, language, variant, ...props }: CodeBlockProps) => {
  // A terminal session is highlighted as shell, whatever its `language` label says.
  const wanted = highlight ? undefined : variant === 'terminal' ? 'bash' : language;
  const [, loaded] = useReducer((n: number) => n + 1, 0);
  const [failure, setFailure] = useState<unknown>();
  const ready = isLanguageLoaded(wanted);

  useEffect(() => {
    if (!wanted || ready) return;
    let current = true;
    loadLanguage(wanted).then(
      () => current && loaded(),
      (error: unknown) => current && setFailure(error)
    );
    return () => {
      current = false;
    };
  }, [wanted, ready]);

  // Rendered, so an error boundary catches it: a missing peer names the package to install.
  if (failure) throw failure;

  return (
    <PlainCodeBlock
      {...props}
      language={language}
      variant={variant}
      highlight={highlight ?? (ready ? builtIn : undefined)}
    />
  );
};
