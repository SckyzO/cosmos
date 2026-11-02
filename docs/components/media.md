# Media

Storybook group: Media. The syntax highlighting of `CodeBlock` is an optional entry:
[Optional entries](../guides/optional-entries.md#code). The map and the QR code are too, in
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

## QrCode

Storybook: [QR Code](https://sckyzo.github.io/cosmos/?path=/docs/media-qr-code--docs).

`QrCode value={text} label="Authenticator setup code"` draws a QR code as one SVG path, from the
optional `qr` package, in the `/qr` entry: [Optional entries](../guides/optional-entries.md#qr-code).
`label` is required and names the picture; `size` is the side of the tile in pixels (default `192`,
quiet zone included, and it shrinks in a narrower parent) and `ecc` the error correction level
(`low`, `medium`, `quartile`, `high`; default `medium`). The tile is white with black modules in
every theme, because a reader scans a light code more reliably than an inverted one; the accent and
the reading direction do not change it. Next to it, show what the code holds as text (a
`SecretValue` for a setup key), for a person who can't scan.
