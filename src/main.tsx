import './style.css'
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { 
  waitForEvenAppBridge, 
  type EvenHubEvent,
  OsEventTypeList
} from '@evenrealities/even_hub_sdk';
import type { Itinerary } from '@motis-project/motis-client';
import { fetchConnections } from './motis';
import { renderHome } from './pages/home';
import { renderResults } from './pages/results';
import { renderDetails } from './pages/details';
import type { Place } from './config';

// Bridge access
const bridge = await waitForEvenAppBridge();

// --- React Configuration UI ---
const root = createRoot(document.getElementById('app')!);
root.render(
  <React.StrictMode>
    <App bridge={bridge} />
  </React.StrictMode>
);

// --- Glasses App Logic ---

interface SavedConnection {
  id: string;
  from: Place;
  to: Place;
}

const STORAGE_KEY = 'even_transport_connections';

// Helper to load connections for the glasses loop
async function loadSavedConnections(): Promise<SavedConnection[]> {
  try {
    const json = await bridge.getLocalStorage(STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  } catch(e) {
    console.warn("Could not load connections", e);
    return [];
  }
}

type PageState = 'HOME' | 'RESULTS' | 'DETAILS';

let currentState: PageState = 'HOME';
let lastSearchResults: Itinerary[] = [];
let savedConnections: SavedConnection[] = []; // In-memory cache for glasses list
let isFirstRender = true;

// Initial Load
savedConnections = await loadSavedConnections();
await renderHome(bridge, isFirstRender, savedConnections);
isFirstRender = false;

// Event Loop
bridge.onEvenHubEvent(async (event: EvenHubEvent) => {
  // Navigation Back
  if (event.sysEvent?.eventType === OsEventTypeList.DOUBLE_CLICK_EVENT) {
    if (currentState === 'RESULTS') {
      currentState = 'HOME';
      // Refresh list when going back home in case it changed via UI
      savedConnections = await loadSavedConnections();
      await renderHome(bridge, false, savedConnections);
    } else if (currentState === 'DETAILS') {
      currentState = 'RESULTS';
      await renderResults(bridge, lastSearchResults);
    }
    return;
  }

  // List Selection
  if (event.listEvent) {
    let { currentSelectItemIndex } = event.listEvent;
    if (currentSelectItemIndex === undefined) currentSelectItemIndex = 0;

    if (currentState === 'HOME') {
      // Refresh to be safe
      savedConnections = await loadSavedConnections();
      
      const selected = savedConnections[currentSelectItemIndex];
      if (selected) {
         console.log(`Selected trip: ${selected.from.name} -> ${selected.to.name}`);
         
         // Trigger search
         const results = await fetchConnections(selected.from, selected.to);
         lastSearchResults = results;
         
         currentState = 'RESULTS';
         await renderResults(bridge, results);
      } else {
        console.log('Selected empty/placeholder slot');
      }
    } else if (currentState === 'RESULTS') {
      // Select Itinerary
      const itin = lastSearchResults[currentSelectItemIndex];
      if (itin) {
        currentState = 'DETAILS';
        await renderDetails(bridge, itin);
      }
    }
  }
});