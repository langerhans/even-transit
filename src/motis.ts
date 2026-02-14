import { plan, client, geocode, type Itinerary } from '@motis-project/motis-client';
import type { Place } from './config';

client.setConfig({
  baseUrl: 'https://api.transitous.org',
});

export async function searchStation(query: string): Promise<Place[]> {
  if (!query || query.length < 3) return [];
  try {
    const { data, error } = await geocode({ query: { text: query, type: "STOP" } });
    if (error || !data) {
      console.error('MOTIS Geocode failed:', error);
      return [];
    }
    // Map Motis geocode result to our Place interface
    // data is typically an array of matches directly
    return (data as any[]).map((match) => ({
      name: match.name,
      id: match.id,
    }));
  } catch (e) {
    console.error('MOTIS Geocode Exception:', e);
    return [];
  }
}

export async function fetchConnections(from: Place, to: Place): Promise<Itinerary[]> {
  console.log(`Fetching plan from ${from.id} to ${to.id}...`);
  try {
    const { data, error } = await plan({
      query: {
        fromPlace: from.id,
        toPlace: to.id,
        joinInterlinedLegs: false,
        maxMatchingDistance: 250,
        fastestDirectFactor: 1.5,
        detailedTransfers: false,
        time: new Date().toISOString(),
      }
    });

    if (error || !data) {
      console.error('MOTIS SDK Fetch failed:', error);
      return [];
    }

    return data.itineraries || [];
  } catch (e) {
    console.error('MOTIS SDK Fetch Exception:', e);
    return [];
  }
}
