# Even Transport

A public transport planner for [Even Realities](https://www.evenrealities.com/) smart glasses.

## What it does

- Configure saved connections (origin → destination) via a phone-side React UI
- Browse upcoming departures and trip details directly on the glasses
- Powered by [Motis](https://motis-project.de/) for routing and geocoding

## Development

```sh
bun install
bun run dev        # Start Vite dev server
bun run sim        # Launch the Even Hub simulator
bun run qr         # Generate QR code for device pairing
bun run build      # Type-check & production build
```

## Tech Stack

- **Even Hub SDK** – glasses communication, local storage, page rendering
- **Even Realities UI** – design system components (React)
- **Motis Client** – transit routing & station search
- **React 19** – configuration UI
- **Vite + TypeScript + Tailwind CSS**
