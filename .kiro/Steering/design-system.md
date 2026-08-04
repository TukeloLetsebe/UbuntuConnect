# Design System — UbuntuConnect

## Source of Truth

The approved Figma design has been exported to code. These files are the
ACTUAL, LIVE source of truth for all styling — never invent colours,
spacing, or typography outside of what's defined here.

Theme tokens: #[[file:frontend/default_shadcn_theme.css]]
Tailwind config: #[[file:frontend/tailwind.config.ts]]

## Rules

- Every new component MUST use existing theme tokens (CSS variables / Tailwind
  classes) — never hardcode a hex colour or pixel value that isn't already
  defined in the theme files above.
- Every new page MUST reuse existing shadcn/ui components from
  `src/components/ui/` before creating a new one from scratch.
- Responsive behavior MUST follow the breakpoints already defined in the
  Tailwind config — do not invent new breakpoints.
- If a new screen has no matching Figma reference, STOP and ask before
  inventing a layout — flag it as a gap, do not guess.

## Full design system documentation

See `10_UI_UX_SPECIFICATION.md` (in this steering folder) for the generated
design token catalogue, component inventory, and page catalogue — produced
by inspecting the files above.