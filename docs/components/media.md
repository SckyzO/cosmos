# Media

Storybook group: Media. The syntax highlighting of `CodeBlock` is an optional entry:
[Optional entries](../guides/optional-entries.md#code). The map is too, in
[the same page](../guides/optional-entries.md#map).

## CodeBlock

Storybook: [CodeBlock](https://sckyzo.github.io/cosmos/?path=/docs/media-codeblock--docs).

`CodeBlock` shows a snippet with a copy button. It needs no highlighter, and takes a few variants:
`lineNumbers`, `highlightLines={[3, '5-7']}`, `filename` (a header with the name, the language and
the copy button), `wrap`, `maxHeight` (the block scrolls inside, takes a Tab stop and scrolls with the
arrow keys), `diff` (the first column of each line is its sign, `+`, `-` or a space; changes are
tinted and marked, the sign column is not copied) and `variant="terminal"` (a line starting with
`$` and a space is a command, the others are its output; only the commands are copied). A block that a long line
makes scroll sideways is a Tab stop too. The copy button copies the code, never the line numbers, the
signs or the prompts.
