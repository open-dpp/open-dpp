---
name: open-dpp
description: The back office and public passport view of open-dpp, a white-label workspace for Digital Product Passports.
colors:
  primary-500: "#6bad87"
  primary-600: "#00965e"
  ink: "#101828"
  ink-muted: "#475467"
  ink-subtle: "#98a2b3"
  rule: "#e4e7ec"
  surface: "#ffffff"
  surface-recessed: "#fafafa"
  status-success: "#079455"
  status-warning: "#dc6803"
  status-danger: "#d92d20"
  slate-100: "#f1f5f9"
  slate-200: "#e2e8f0"
  slate-300: "#cbd5e1"
  slate-500: "#64748b"
  slate-600: "#475569"
  slate-700: "#334155"
typography:
  display:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", Arial, sans-serif'
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.025em"
    fontFeature: '"tnum"'
  headline:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", Arial, sans-serif'
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.375
    letterSpacing: "-0.025em"
  title:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", Arial, sans-serif'
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: "1.75rem"
  body:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", Arial, sans-serif'
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.5rem"
  body-strong:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", Arial, sans-serif'
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: "1.5rem"
  control:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", Arial, sans-serif'
    fontSize: "1rem"
    fontWeight: 400
  control-strong:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", Arial, sans-serif'
    fontSize: "1rem"
    fontWeight: 500
  label:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", Arial, sans-serif'
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: "1rem"
  label-caps:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", Arial, sans-serif'
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: "1rem"
    letterSpacing: "0.08em"
  mono:
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
    fontSize: "0.875rem"
    fontWeight: 400
rounded:
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary-500}"
    textColor: "{colors.surface}"
    typography: "{typography.control-strong}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.75rem"
    height: "2.5rem"
  button-primary-hover:
    backgroundColor: "{colors.primary-600}"
  button-secondary:
    backgroundColor: "{colors.slate-100}"
    textColor: "{colors.slate-600}"
    typography: "{typography.control-strong}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.75rem"
    height: "2.5rem"
  button-secondary-hover:
    backgroundColor: "{colors.slate-200}"
    textColor: "{colors.slate-700}"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.slate-500}"
    rounded: "{rounded.md}"
    size: "2.5rem"
  button-small:
    padding: "0.375rem 0.625rem"
    size: "2rem"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.slate-700}"
    typography: "{typography.control}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.75rem"
  card-dossier:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "1.5rem"
  dialog:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.slate-700}"
    rounded: "{rounded.xl}"
    padding: "1.25rem"
  tag-status:
    backgroundColor: "{colors.slate-100}"
    textColor: "{colors.slate-600}"
    rounded: "{rounded.md}"
    padding: "0.25rem 0.5rem"
  nav-item:
    textColor: "{colors.ink-muted}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.md}"
    padding: "0.5rem"
  nav-item-active:
    backgroundColor: "{colors.surface-recessed}"
    textColor: "{colors.ink}"
  top-bar:
    backgroundColor: "{colors.surface}"
    height: "4rem"
  sidebar:
    backgroundColor: "{colors.surface}"
    width: "18rem"
---

# Design System: open-dpp

Scope: `apps/client`, which covers the authenticated back office and the anonymous public passport view at `/p/<permalink>`. The documentation site in `docs/` runs the stock VitePress theme and is not described here.

Sources of truth: the tokens in `apps/client/src/index.css`, the `OpenDppPreset` (PrimeVue Aura) in `apps/client/src/main.ts`, and the runtime palette derived in `apps/client/src/lib/color.ts`.

## Overview

**Creative North Star: "The Product Dossier"**

Every passport is an orderly dossier. Facts sit in white sections, each with a labelled title, laid out as definition lists of name and value split by hairline rules. Lifecycle states and validation results appear as clear, quiet stamps. The back office around it is the filing room: a white sidebar, a hairline top bar, and data tables with actions kept to the edge. Nothing decorates the record. Typography, rules and spacing do the ordering.

The system is **trustworthy and orderly**. It should read like an authoritative record, never like a marketing page. Density is moderate. Application text is set at 14px (24px line height), and the tables and toolbars suit people who edit many passports. The palette is close to colorless on purpose. The one accent belongs to the Organization: open-dpp Green is only the default, and every Owner can replace it, so the system's own character comes from precise structure rather than from a hue.

Components are PrimeVue 4 with the Aura preset, styled around with Tailwind CSS v4 and the semantic tokens in `index.css`. The app is light-only: PrimeVue's dark mode is disabled (`darkModeSelector: false`), and the `dark:` variant exists but nothing uses it.

**Key Characteristics:**
- White surfaces, hairline borders, faint ambient card shadows; only overlays lift.
- One borrowed accent (the Organization's primary), applied at runtime to every primary token.
- Passport data laid out as dossier sections: a 12px-radius card, a 3px accent rule beside the title, and definition-list rows.
- The system UI font stack, mostly at 14px, with tabular figures for numbers.
- PrimeVue Aura components as the default vocabulary, mostly secondary and text buttons, and one filled primary action per view.

## Colors

The palette is near-neutral ink on white. A single accent comes from the active Organization, and status hues are reserved for state.

### Primary
- **open-dpp Green** (`primary-500`): the default Organization color and the seed for every primary token. It fills primary buttons, marks focus borders on inputs, draws the 3px rule beside passport section titles, and colors primary text-button labels.
- **open-dpp Green, deep** (`primary-600`): the hover and pressed step for primary fills, and primary-colored text.

At runtime the stored values are replaced. `useBranding()` (back office) and `useBrandingAnonymous()` (public view) pass the Organization's color, or the `#6bad87` default, through `createColorPalette()`. That function places the base color on a 100–900 ramp according to its contrast with white and black. The ramp is pushed into the Aura `primary` palette and into the `--primary-500` and `--primary-600` custom properties. For the default green, the base lands at step 300, so the rendered `primary-500` is `#518367` and `primary-600` is `#446f56`. The static values in the frontmatter are seeds that apply only before branding loads and on pages that never load it (sign-in, sign-up, password reset).

### Neutral
- **Deep Ink** (`ink`): headings, values in definition lists, any text that carries the record. 17.8:1 on white.
- **Muted Ink** (`ink-muted`): secondary text such as descriptions, timestamps and helper lines. 7.7:1 on white.
- **Subtle Ink** (`ink-subtle`): disabled glyphs and decorative marks only. 2.6:1 on white, so never for text that carries meaning.
- **Hairline Rule** (`rule`): every 1px border and divider (cards, rows, the top bar, the sidebar edge).
- **Paper White** (`surface`): page and card background in the back office, and card background in the passport view.
- **Recessed Gray** (`surface-recessed`): inset panels inside a card (the email row on the profile page, for example) and the active navigation item.
- **Aura Slate** (`slate-100` to `slate-700`): Aura's surface scale (Tailwind slate), which PrimeVue components use internally. Secondary buttons are slate-100 with slate-600 text, input borders are slate-300, input text is slate-700, and text-button glyphs are slate-500. Reach it through PrimeVue props, not Tailwind classes.

### Status
- **Success** (`status-success`), **Warning** (`status-warning`), **Danger** (`status-danger`): state only, meaning lifecycle feedback, validation, and pending or unverified flags. In pills they appear as a 10% tint fill with a 20% tint border.

### Named Rules
**The Borrowed Accent Rule.** The primary belongs to the Organization, not to open-dpp. Reach it only through the primary tokens: PrimeVue `severity` and props, the Tailwind `primary-500` and `primary-600` utilities, or `var(--primary-500)`. Never hardcode a green, and never hardcode indigo. A screen is finished only when it holds up under a dark, a pale and a saturated Organization color.

**The Contrast Floor Rule.** WCAG 2.1 AA applies to every surface: 4.5:1 for text and 3:1 for UI components and focus indicators, whatever color an Owner picks. The current system does not meet this yet, and these are the known gaps:
- White on the seed `primary-500` is 2.6:1 (sign-in and sign-up pages, and first paint).
- White on the runtime default `#518367` is 4.4:1, just under the text floor.
- Text in `status-warning` (3.5:1) and `status-success` (3.9:1) is below 4.5:1.
- Sidebar group labels in gray-400 are 2.6:1.
- Aura's `danger` fill (`#ef4444`) under white text is 3.8:1.

Status hues and the seed green may carry icons, borders and tints. Text needs a step that clears 4.5:1.

**The Status Is State Rule.** Status hues mark state and nothing else: never a section accent, a chart default or a decorative fill.

## Typography

**Display Font:** the system UI stack (`-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, Roboto, …, sans-serif)
**Body Font:** the same stack
**Label/Mono Font:** `ui-monospace` stack, for identifiers only

**Character:** the operating system's own sans, used without ornament. It looks native on every machine, and hierarchy comes from weight and size steps rather than from a typeface with a personality. The app loads no web font.

### Hierarchy
- **Display** (700, 2.25rem, line-height 1, -0.025em, tabular figures): big-number metric tiles on passports and in analytics.
- **Headline** (600, 1.25rem, line-height 1.375, -0.025em): page and section headings, DataTable header titles and profile sections. Older table headers use weight 700; new work uses 600.
- **Title** (600, 1.125rem, 1.75rem): passport section and card titles, the "General information" heading.
- **Body** (400, 0.875rem, 1.5rem): all running application text, table cells, descriptions and definition-list rows. Value cells (`dd`) step up to weight 500.
- **Body Strong** (600, 0.875rem, 1.5rem): sidebar navigation items and emphasized row labels.
- **Control** (400 / 500, 1rem): text inside PrimeVue inputs and button labels (Aura's default size). `size="small"` drops to 0.875rem.
- **Label** (600, 0.75rem): sidebar group headings and small meta lines. The **Label Caps** variant adds uppercase and 0.08em tracking, and is used only under metric values.
- **Mono** (400, 0.875rem): passport IDs, UUIDs and other identifiers a person may copy.

### Named Rules
**The Small-Base Rule.** Application text is 14px on a 24px line. 16px appears only inside form controls and buttons. Don't raise body text to 16px on one screen.

**The Tabular Figures Rule.** Numbers that are compared or scanned (metrics, counts, quantities in tables) use tabular figures (`tabular-nums`).

## Layout

The product uses two frames, and every screen belongs to one of them.

- **Back office frame.** At `lg` (1024px) and wider, a fixed white sidebar 18rem wide with a hairline right border holds the logo, grouped navigation, the organization switcher and the version number. Below `lg` the sidebar moves into a PrimeVue Drawer opened from a menu button. A sticky top bar 4rem high (hairline bottom border, `shadow-xs`) carries breadcrumbs from `md` up, the user name and the profile menu. The content area fills the remaining width with gutters of 16, 24 and 32px at the base, `sm` and `lg` breakpoints. Routes cross-fade in 75ms.
- **Passport frame.** A full-height page on a faint gray wash (gray-50 at 50% opacity), with a sticky, translucent Menubar (white at 80%, `backdrop-blur`, hairline bottom border) holding the Organization's logo, the language switcher and the round AI-chat button. Content sits in a centered column capped at 64rem, with gutters of 16, 32 and 48px. When a passport nests more than one level of submodels, a sticky contents tree (at least 12rem wide) runs alongside the column from `md` up.

Spacing follows Tailwind's 4px step. The working rhythm is 8px between related controls (the most common gap by far), 16px between groups, 24px inside cards, and 32px between the major regions of a page. Definition-list rows have 16px of vertical padding. Breakpoints are the Tailwind defaults (640, 768, 1024, 1280, 1536px).

### Named Rules
**The Two Frames Rule.** Back-office screens never adopt the centered passport column, and passport screens never show the sidebar shell. A new surface picks one frame.

## Elevation & Depth

Flat, with hairlines. Structure comes from 1px `rule` borders, and depth is almost absent. Cards add only a faint ambient shadow (`shadow-sm`), and the top bar a fainter one (`shadow-xs`). Only floating layers visibly lift: menus, selects and popovers take Aura's small overlay shadow, and dialogs its large one. Toasts and the confirmation dialog follow Aura.

### Shadow Vocabulary
- **Card ambient** (`box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`): passport sections, metric tiles, Aura Cards.
- **Bar hairline** (`box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)`): the back-office top bar.
- **Overlay small** (`box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)`): menus, selects, popovers.
- **Overlay modal** (`box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)`): dialogs.

### Named Rules
**The Hairline-First Rule.** Separate content with a rule border before reaching for a shadow. A shadow heavier than Card ambient belongs only to something floating above the page.

## Shapes

Two radii carry almost everything. Controls get gently rounded 6px corners: buttons, inputs, navigation items, toolbars, tags and inline panels (Aura `md`, Tailwind `rounded-md`). Containers get 12px: cards, passport sections, metric tiles, dialogs and the passport contents tree (Aura `xl`, Tailwind `rounded-xl`). Fully round shapes are kept for status pills, avatars and round icon buttons such as the AI-chat button. 8px (`rounded-lg`) shows up occasionally and is not a role of its own. Borders are always 1px, apart from the dossier's signature 3px accent rule.

### Named Rules
**The Two Radii Rule.** 6px for things you operate, 12px for things that hold content, full for pills. A new radius needs a reason the existing three can't cover.

## Components

### Buttons
Quiet and dependable: Aura defaults, no flourish.
- **Shape:** gently rounded (6px). Labels are weight 500 with 8px padding top and bottom, 12px either side, and a 40px height. Icon-only buttons are 40px square, or 32px with `size="small"`.
- **Primary:** filled with the Organization's primary and white text. It is used for the one main action in a view, such as "Add" in a table header or "Save" in a form.
- **Secondary:** slate-100 fill with slate-600 text, darkening to slate-200 / slate-700 on hover. This is the workhorse for every non-final action.
- **Text:** transparent, slate-500 glyph, slate-50 wash on hover. Document toolbars are rows of text icon buttons, each with an `aria-label` and a `v-tooltip`.
- **Danger:** destructive actions are usually `severity="danger"` text icon buttons, confirmed through the ConfirmDialog.
- **Focus:** a 1px solid ring in the button's own color, offset 2px.
- **Legacy:** `BaseButton.vue` and the creation link in `ListHeader.vue` are hand-rolled indigo Tailwind UI buttons. Replace them with PrimeVue `Button`.

### Tags and Status Pills
- **Lifecycle tags:** Aura `Tag` with `severity="secondary"` (slate-100 / slate-600, 0.875rem weight 700, 6px radius) for Draft, Published and Archived. `severity="contrast"` is for one emphasized tag.
- **Status pills:** fully round, a 10% tint fill and a 20% tint border in a status hue, 0.75rem weight 600 with wider tracking, and `role="status"` with `aria-live="polite"` (the pending and unverified email pills on the profile page). Pill text must meet the Contrast Floor Rule.

### Cards and Containers
- **Corner Style:** 12px.
- **Background:** Paper White on the back office, and on the passport view's gray wash.
- **Shadow Strategy:** Card ambient (see Elevation & Depth).
- **Border:** 1px Hairline Rule.
- **Internal Padding:** 24px for passport sections, 20px for Aura `Card` bodies, and 16px by 12px for inset recessed panels.

### Inputs and Fields
- **Style:** white fill, 1px slate-300 border, 6px radius, 8px by 12px padding, slate-700 text and slate-500 placeholder, with a faint 1px inner shadow.
- **Hover / Focus:** the border darkens to slate-400 on hover and turns the Organization's primary on focus. Aura draws no separate focus ring on fields, so the border change is the whole indicator and must clear 3:1.
- **Error:** a red-400 border, with an inline Aura `Message` (severity `error`) below the field. Validation messages come from vee-validate with Zod.
- **Grouping:** `InputGroup` for prefixed or suffixed inputs, `FloatLabel` where space is tight.

### Navigation
- **Sidebar:** groups headed by Label-sized gray text, with items in Body Strong. Each item has a 6px radius, 8px padding and a 24px Heroicons outline icon. The active and hover state is a Recessed Gray wash with Deep Ink text and icon; resting icons are subtle gray.
- **Top bar:** breadcrumbs on the left (from `md` up), the user name and profile dropdown on the right.
- **Passport Menubar:** translucent white with a hairline. Its menu items fold into a Drawer below `md`.
- **Icons:** PrimeIcons (`pi pi-*`) inside PrimeVue controls, Heroicons outline in the shell navigation and top bar.

### Data Tables
Aura `DataTable`, with the title (Headline) and header actions in the table's own header slot and filters below them. Cells are padded 12px by 16px and the table keeps at least 50rem of width, scrolling sideways on narrow screens. Row actions are right-aligned text buttons. Pagination is a custom cursor paginator (`TablePagination`) instead of Aura's page numbers. Loading uses the table's `loading` state, and `Skeleton` covers other async blocks.

### Dossier Section (signature component)
The passport's unit of content. It is a white card with a 12px radius, a 1px Hairline Rule border, Card ambient shadow and 24px padding. Its title (Title style, Deep Ink) sits behind a 3px primary rule with 16px of left padding, followed by an optional description (Body, Muted Ink). The body is a one-column definition list: the label (`dt`, Muted Ink) on the left and the value (`dd`, Deep Ink, weight 500, identifiers in Mono) on the right, with each row 16px tall top and bottom and split by a hairline. Sections stack 24px apart, and each carries its submodel's `idShort` as an anchor for the contents tree.

### Metric Tile
An inline white card (12px radius, hairline, Card ambient, 20px by 16px padding) that centers a Display-style tabular number above a Label Caps caption in muted gray.

## Do's and Don'ts

### Do:
- **Do** build from PrimeVue Aura components (`Button`, `DataTable`, `Dialog`, `Message`, `Toast`, `Tag`, `Skeleton`) before hand-rolling, and style around them with the `index.css` tokens.
- **Do** map raw Tailwind grays onto tokens whenever you touch a file: gray-900 → `ink`, gray-700/600/500 → `ink-muted`, gray-400 → `ink-subtle` (decorative only), gray-200/100 → `rule`, gray-50 → `surface-recessed`.
- **Do** reach the accent only through the primary tokens, and check each new screen under a dark, a pale and a saturated Organization color.
- **Do** lay out passport data as Dossier Sections: a 12px white card, a hairline border, 24px padding, the 3px primary rule beside the title, and definition-list rows split by hairlines.
- **Do** keep to one filled primary button per view, and use secondary or text buttons for everything else.
- **Do** give every icon-only button an `aria-label` and a tooltip, as the document toolbar does.
- **Do** use tabular figures for compared numbers, and the mono stack for identifiers.
- **Do** check every layout with German strings (de-DE), which run noticeably longer than English.

### Don't:
- **Don't** use indigo (`bg-indigo-600`, `text-indigo-*`, …). It is Tailwind UI residue on the sign-in and sign-up pages, `ListHeader`, `SimpleTable`, notifications and `BaseButton`, and it ignores the Organization's color.
- **Don't** write `text-surface-*`, `bg-surface-0` or `border-surface-*` utilities. No Tailwind bridge for Aura's palette is installed, so they compile to nothing (the passport sections currently fall back to the base-layer gray-200 border and inherited text color). Use `ink`, `rule` and `surface`.
- **Don't** hardcode `#6bad87` or `#00965e` in components. They are seeds that the branding composable replaces.
- **Don't** set meaningful text in `ink-subtle` or gray-400 (2.6:1 on white).
- **Don't** set small text in `status-warning` or `status-success`, or white text on the seed green. Both fall below 4.5:1.
- **Don't** add shadows heavier than Card ambient to anything that sits in the page, and don't use `raised` buttons. Lift belongs to overlays.
- **Don't** use a status hue as decoration or as a section accent.
