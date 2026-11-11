# Lettering (pen.js) notes

One hand, two weights. Same glyphs, same slant (0.09), same x-height (0.6 of the capital height, which is 0.7 of the size), same stroke logic. No font file.

- heavy: numbers, flag values, gains, the four words, buttons.
- thin: names (helpers, creatures, reactions), small labels.

## Why the 7s were doubled, and the fix

The old pen drew every string twice, the second time offset diagonally by a "nib" amount, and each glyph also had a small per-letter baseline wobble. At heavy weights the two passes did not merge on thin diagonals (the 7), and with any alpha they darkened where they overlapped. Now a string is one stroked path, one pass, no wobble, round caps. A see-through color stays even.

## What the page gets with no edits

- `hand(x, n)` gives thin, `marker(x, n)` gives heavy, both in the same hand and slant. The mixed look (heavy italic brush against a thin hand) is gone.
- Digits are tabular (one cell width, each digit centered), 1 has a base, 7 has no crossbar, the comma has a real tail.
- `strokeText` (the paper-colored knockout the page draws under text) is now capped at 0.14 of the size, so it is a thin edge and not a plate. It is still a halo; see below.
- `ctx.measureText` returns the true width.

## New calls

- `AA.rxPen.write(ctx, str, x, y, size, o)`: o = `{ weight: 'heavy'|'thin', color, align: 'left'|'center'|'right', base: 'alphabetic'|'middle'|'top', t: 0..1, alpha, extra }`. `t` is how much has been written, stroke by stroke in pen order. Returns the pen tip `{x, y}` so a pen or spark can follow it.
- `AA.rxPen.measure(str, size, weight)`: `{ width, advance, ascent, descent, height, xHeight, cap, lineWidth }` in pixels. `width` includes the line width and slant, so a box from x to x+width, y-ascent to y+descent holds all the ink.
- `AA.rxPen.width(str, size, weight)`, `AA.rxPen.lineWidth(size, weight)`, `AA.rxPen.INK` (warm near-black `#2b2420`), `AA.rxPen.slant`.
- `AA.rxPen.set(ctx, size, heavy)` still works.

Heavy line width is 0.097 of the size at 40 and below, rising to 0.117 at 170 and above, so the four words get louder with size.

## Calls the page builder should change

1. Draw the four words with `AA.rxPen.write(x, word, cx, y, WSZ[wk], { weight: 'heavy', color: INK, align: 'center', t: progress })`, with no strokeText knockout behind them (a halo is rejected). Use `measure` to place them so they do not overlap.
2. Totals, goal marks (1,300 ...), gains (+142), round numbers: heavy, one ink (`AA.rxPen.INK`) except red for the goal/lost and green for passing.
3. "round N", "next", "new run", helper and creature names, reaction names: use `hand` (thin), not `marker`. Today "next" and "new run" use `marker` and look heavier than "round 1".
4. Drop the paper-colored `strokeText` under text except where text sits over the molecule; there the cap keeps it thin.
5. Do not set a `font` with `bold` or other families for page text; those bypass the pen.

## Not done

- No calligraphic thick and thin: the strokes are monoline. It was the cause of the smear and was removed on purpose.
- The `Trebuchet MS` labels in scheme.js (two places) are not drawn by the pen.
- Heavy at 12 px or below is a little tight; use 14 px or more.
