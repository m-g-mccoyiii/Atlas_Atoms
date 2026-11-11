# Lettering (pen.js) notes

One hand, two weights. Same glyphs, same slant (0.09), same x-height (0.6 of the capital height, which is 0.7 of the size), same stroke logic. No font file.

- heavy: numbers, flag values, gains, the four words, buttons.
- thin: names (helpers, creatures, reactions), small labels.

## Second pass: a hand, not a typeface

- Each stroke is a filled brush outline with a real start and end: it lands, swells and lifts. Heavy (loaded brush) swells strongly and is fatter on down strokes; thin (quick pen) is nearly even with a light start and a flick at the end. All strokes of a string go into one path and one fill, so there is still no doubling and no alpha overlap. Sharp corners are written as separate pieces so an outline never folds.
- Small steady variation: every glyph gets a tiny change of size (3.5 percent), tilt (0.04 rad), baseline, shear and spacing (digits less, and never in width). It is seeded by the glyph and its place, so a string is identical every time it is drawn and nothing shimmers. Digits are seeded by the digit and its place from the right, so a total that counts up keeps its other digits unchanged. Digit cells have a fixed width.
- Letterforms chosen on purpose: e with a rising bar, r with a drooping beak, t with a long stem and hooked foot, y as a u with a tail, 7 with a curved stem, 2 with a flicked base, 5 with a tilted top bar. 1 (flag and base), 7 (curved, no base), 3 (open), 8 (two loops), 0 (plain oval) and 6 (loop with a tail) stay apart.
- Heavy width is 0.132 of the size at 50 and below, easing to 0.116 at 170 and above (wider relative weight at small sizes so it stays legible; less at large sizes so the r and e do not close up). Thin is 0.057.

## Why the 7s were doubled (first pass), and the fix

The old pen drew every string twice, the second time offset diagonally by a "nib" amount, and each glyph also had a small baseline wobble. At heavy weights the two passes did not merge on thin diagonals (the 7), and alpha darkened the overlaps. Now there is one fill per string.

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


## Calls the page builder should change

1. Draw the four words with `AA.rxPen.write(x, word, cx, y, WSZ[wk], { weight: 'heavy', color: INK, align: 'center', t: progress })`, with no strokeText knockout behind them (a halo is rejected). Use `measure` to place them so they do not overlap.
2. Totals, goal marks (1,300 ...), gains (+142), round numbers: heavy, one ink (`AA.rxPen.INK`) except red for the goal/lost and green for passing.
3. "round N", "next", "new run", helper and creature names, reaction names: use `hand` (thin), not `marker`. Today "next" and "new run" use `marker` and look heavier than "round 1".
4. Drop the paper-colored `strokeText` under text except where text sits over the molecule; there the cap keeps it thin.
5. Do not set a `font` with `bold` or other families for page text; those bypass the pen.

## Not done

- No two-color or textured ink. Letter shapes are one set; the variation is small by design.
- The `Trebuchet MS` labels in scheme.js (two places) are not drawn by the pen.
- Heavy at 12 px or below is a little tight; use 14 px or more.
