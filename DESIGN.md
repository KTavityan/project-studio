# Project Studio, visual decisions

Thesis: a print shop, not a dashboard. The learner's artefact is a sheet of paper coming off a press. The wall is pinned stock, not a card list.

## Colour

- Shop floor `#14110e`, raised `#1c1814`, hairline `#3a342c`
- Paper `#efe6d6`, ink `#1c1712`
- Press fill `#b8431a` (primary button). Press text `#cc6a32` on shop (WCAG AA for small type). Same oxidised orange, two values because a fill that contrasts with cream ink is too dark for body-size type.
- Reason: the artefact should look printed, the chrome should look like the room around the press

## Type

- Display and artefact titles: Noto Serif (self-hosted woff2, SIL Open Font Licence)
- Chrome: Aileron (self-hosted woff2, SIL Open Font Licence)
- Prompt only: ui-monospace
- Inter, Geist, Instrument Serif, Space Grotesk: forbidden

## Layout

- Intake: poster left, form right. Not a centred hero.
- Studio: brief 22%, sheet 50%, wall 28%. Wall is paper slips, not equal admin columns.
- Radius 0 on paper, pins, and inputs. Inputs are underline only. No pill buttons.
- Below 960px the wall tucks behind a toggle. Laptop first, stacked is the fallback.
- Sheets carry crop marks and a job slug. Wall slips have a pin head. Intake poster has a ghost 01.

## Rejected

- Thick coloured left border on cards (impeccable.style: the main AI-UI tell)
- Three equal feature/admin columns
- All-caps tracked kickers on every heading
- Glass, glow, indigo, Inter
- Dark cards for artefacts (that makes the product look like chrome)

Sources used: impeccable.style/slop, the local anti-generic catalogue, Joshua Snoddy 13/07/2026, 925 Studios AI-slop tells.
