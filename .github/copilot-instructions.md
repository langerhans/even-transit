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

## Even Hub SDK Conventions

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
