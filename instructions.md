# Even Hub SDK Instructions

## SDK Overview
- **Package**: `@evenrealities/even_hub_sdk`
- **Purpose**: Build UI for Even Realities glasses (G1, etc.) inside a WebView.
- **Entry Point**: Always await `waitForEvenAppBridge()` to get the bridge instance before making calls.

## Critical Implementation Details

### 1. Class Instantiation vs Object Literals
**CRITICAL**: Do not use plain object literals for container properties. The TypeScript definitions (`index.d.ts`) include methods like `toJson()` on the interface types. Passing a plain object will result in type errors because these methods are missing.

**❌ Incorrect (Type Error):**
```typescript
const text: TextContainerProperty = { 
  containerID: 1,
  // ... 
}; 
// Error: Property 'toJson' is missing...
```

**✅ Correct:**
```typescript
const text = new TextContainerProperty({ 
  containerID: 1, 
  // ... 
});
```

### 2. Standard Canvas Size
- **Max Dimensions**: 576 x 288
- **Coordinates**: (0,0) is top-left.

### 3. Container Properties
Every container usually requires:
- `containerID`: A unique number.
- `containerName`: A string identifier.
- `xPosition`, `yPosition`, `width`, `height`.

### 4. List Components
`ListContainerProperty` is complex and requires a nested `itemContainer` of type `ListItemContainerProperty`.

```typescript
const list = new ListContainerProperty({
  // ... dimensions ...
  itemContainer: new ListItemContainerProperty({
    itemCount: 3,
    itemWidth: 566, // 0 usually means auto, but specific width often safer
    itemName: ['Item 1', 'Item 2'],
    isItemSelectBorderEn: 1, // 1 = true, 0 = false
  }),
});
```

### 5. Event Handling
- Use `bridge.onEvenHubEvent((event) => { ... })` to listen for hardware events (rotary dial, tap, etc.).
- Event structure often includes `listEvent`, `textEvent`, etc.

## Architecture Patterns
- **Modular Structure**: Split your application into pages (e.g., `src/pages/home.ts`, `src/pages/details.ts`) and a central controller (`src/main.ts`).
- **State Management**: Use a simple state machine in `main.ts` (e.g., `currentView: 'HOME' | 'DETAILS'`) to route events to the correct logic.
- **Routing**: `main.ts` should handle the `bridge.onEvenHubEvent` and decide whether to call `renderHome()` or `renderDetails()` based on the state and event type.

## Navigation & Events
- **Back Navigation**: The standard pattern for "Back" is the **Double Click** event.
   ```typescript
   bridge.onEvenHubEvent((event) => {
     if (event.type === 'sysEvent' && event.sysEvent?.double_click) {
       // Handle back navigation
     }
   });
   ```
- **Forward Navigation**: Use `listEvent.list_select_item_id` (0-indexed integer) to detect which item was clicked in a list.

## UI Components & Layout

### List Configuration
- **Informational Lists**: For lists that display data but don't require selection (like a step-by-step itinerary), set `isItemSelectBorderEn: 0`. This allows the user to scroll through the list without seeing the selection highlight box.

## Common Pitfalls
1. **Missing `toJson`**: If you see a "Property 'toJson' is missing" error, you are likely using an object literal instead of `new ClassName(...)`.
2. **Container Limits**: The startup page has a limit on the total number of containers (e.g. `containerTotalNum`).
3. **Event Capture**: Ensure exactly one container has `isEventCapture: 1` if you want it to receive user input (like scrolling a list).
