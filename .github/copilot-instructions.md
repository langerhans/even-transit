# Copilot Instructions – Even Transport

Even Transport is a public transit planner for **Even Realities G2 smart glasses**. It has two distinct UIs that run in the same app bundle: a React phone UI for configuration, and a native glasses UI for displaying transit data.

## Commands

```bash
bun install          # Install dependencies
bun run dev          # Start Vite dev server (phone UI at http://localhost:5173)
bun run build        # Type-check with tsc, then build with Vite
bun run sim          # Launch Even Hub glasses simulator (run alongside dev)
bun run qr           # Generate QR code to pair physical glasses
bun run preview      # Preview production build locally
```

No test runner or linter is configured.

## Architecture

The app has two parallel UIs that share local storage via the Even Hub Bridge:

**Phone UI** (`src/App.tsx`) — React component where users search for stations and save connections. Uses `even-toolkit/web` design system components and Tailwind CSS. Persists saved connections to the bridge's local storage.

**Glasses UI** (`src/main.tsx` + `src/pages/`) — Not React. A state machine that awaits `waitForEvenAppBridge()`, loads saved connections, renders pages using Even Hub SDK container classes, and drives navigation via hardware events. State variables (`currentState`, `lastSearchResults`, `savedConnections`) are module-level.

**Page renderers** (`src/pages/home.ts`, `results.ts`, `details.ts`) are async functions that build layouts using `TextContainerProperty` and `ListContainerProperty` instances and call `bridge.rebuildPageContainer()` or `bridge.createStartUpPageContainer()`.

**Transit data** comes from the Transitous API (`https://api.transitous.org`) via the `@motis-project/motis-client` package, abstracted in `src/motis.ts`.

**Navigation flow:**
- Double-click → go back (DETAILS → RESULTS → HOME)
- List selection → go forward (HOME → fetch connections → RESULTS → DETAILS)

## Phone UI — even-toolkit/web

The phone UI uses `even-toolkit/web` for all design system components. Import components from their individual subpaths:

```typescript
import { Button } from 'even-toolkit/web/button';
import { Card } from 'even-toolkit/web/card';
import { Input } from 'even-toolkit/web/input';
import { ListItem } from 'even-toolkit/web/list-item';
import { ScreenHeader } from 'even-toolkit/web/screen-header';
import { SectionHeader } from 'even-toolkit/web/section-header';
import { EmptyState } from 'even-toolkit/web/empty-state';
import { IcNavDirection } from 'even-toolkit/web/icons/svg-icons';
```

**Key component notes:**
- `Button` uses `variant="highlight"` for primary actions (not `"primary"`).
- `Card` has no sub-components — use `padding` prop (`"none"`, `"sm"`, `"default"`, `"lg"`) and structure content inside it directly.
- `ListItem` accepts `title`, `subtitle`, `leading` (ReactNode), `trailing` (ReactNode), `onPress`, and `onDelete` (swipe-to-delete). Use instead of custom card rows.
- Icons are SVG components from `even-toolkit/web/icons/svg-icons` (e.g. `IcNavDirection`, `IcEditTrash`). Set size via `width`/`height` props.

**Tailwind + even-toolkit theming (critical):** The toolkit's components use Tailwind utility classes that reference CSS custom properties (`bg-surface`, `text-text`, `bg-accent`, etc.). Two things are required in `src/style.css` for this to work with Tailwind v4:

1. **`@source`** — Tailwind v4 doesn't scan `node_modules` by default. The directive `@source "../node_modules/even-toolkit/dist/web"` tells Tailwind to scan the toolkit's compiled JS for class names.
2. **`@theme inline`** — Maps the toolkit's CSS custom properties (from `tokens-light.css`) to Tailwind theme values so utility classes like `bg-surface` and `text-text-dim` are generated. Without this, toolkit components render unstyled.

If adding new even-toolkit components that appear unstyled, check that their Tailwind classes are covered by the existing `@source` and `@theme` blocks.

**Design token colors:** Use toolkit tokens, not raw Tailwind colors. Examples: `bg-surface` (card bg), `bg-bg` (page bg), `text-text` (primary text), `text-text-dim` (secondary text), `bg-accent` (highlight bg), `text-text-highlight` (text on accent), `bg-positive`/`bg-negative` (status).

**Typography:** Only use the toolkit's 8 defined sizes (24/20/17/15/13/11px) with matching negative letter-spacing. No `font-bold` or `font-semibold` — only `font-normal` (400) or `font-light` (300). Components like `ScreenHeader` and `SectionHeader` handle typography automatically.

## Glasses UI — Even Hub SDK Conventions

**Always use `new ClassName({...})` — never plain object literals.** The SDK interfaces include a `toJson()` method, so object literals cause TypeScript errors:

```typescript
// ❌ Type error: Property 'toJson' is missing
const text: TextContainerProperty = { containerID: 1, ... };

// ✅ Correct
const text = new TextContainerProperty({ containerID: 1, ... });
```

**Canvas size:** 576 × 288 px max. Standard layout: title at `(8, 0)`, list at `(4, 40)`.

**Every container requires:** `containerID` (unique number), `containerName`, `xPosition`, `yPosition`, `width`, `height`.

**Lists** require a nested `ListItemContainerProperty` as `itemContainer`. Set `isEventCapture: 1` on exactly one list per page to receive user input. Use `isItemSelectBorderEn: 0` for display-only (non-interactive) lists.

**Events:**
```typescript
bridge.onEvenHubEvent((event) => {
  if (event.type === 'sysEvent' && event.sysEvent?.double_click) { /* back */ }
  if (event.listEvent?.list_select_item_id !== undefined) { /* selection */ }
});
```

## Key Conventions

- TypeScript strict mode is fully enabled (`strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`).
- Local storage key for saved connections: `'even_transport_connections'` (JSON-stringified `SavedConnection[]`).
- Text shown on glasses is truncated to ~30–45 chars to fit the small display.
- Glasses page renderers return `void`; their side effect is calling the bridge to update the display.
- Phone UI uses React `useState` hooks. Glasses logic uses module-level variables — no React in `src/pages/` or `src/main.tsx`.
- Even Hub app metadata (package ID, permissions, version) lives in `app.json`.
