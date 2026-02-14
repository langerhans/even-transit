// Helper function to format time (HH:MM)
import type { Itinerary } from '@motis-project/motis-client';

export const formatTime = (isoString: string): string => {
  return new Date(isoString).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Berlin' // Ensuring correct local time
  });
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}:${m.toString().padStart(2, '0')}h`;
};

// Main extraction function (adapted for SDK types)
export const extractItinerarySummaries = (itineraries: Itinerary[]): string[] => {
  return itineraries.map((itinerary) => {
    // A. Times & Delay Calculation
    const start = formatTime(itinerary.startTime);
    const end = formatTime(itinerary.endTime);
    
    const realTime = new Date(itinerary.startTime).getTime();
    
    // Attempt to find scheduled time from the first leg or use realTime if missing
    const firstLeg = itinerary.legs[0];
    const schedTimeStr = firstLeg?.scheduledStartTime || itinerary.startTime;
    const schedTime = new Date(schedTimeStr).getTime();
    
    const delayMins = Math.round((realTime - schedTime) / 60000);
    
    // Format delay: If > 0, add "(+X)", otherwise empty
    const delayStr = delayMins > 0 ? `(+${delayMins})` : '';

    // B. Duration (convert seconds to minutes)
    const duration = Math.round(itinerary.duration / 60) + 'min';

    // C. Transport Details (Find first non-walking leg)
    const mainLeg = itinerary.legs.find(l => l.mode !== 'WALK') || itinerary.legs[0];
    const trainName = mainLeg.displayName || mainLeg.tripShortName || 'N/A';
    
    // D. Platform
    // Fallback to scheduled track if real-time track is missing
    const track = mainLeg.from.track || mainLeg.from.scheduledTrack || '?';

    // E. Transfers
    const transferStr = itinerary.transfers === 0 ? 'Dir' : `${itinerary.transfers}x`;

    // F. Template Composition
    // Pattern: HH:MM(+D)-HH:MM | Dur | Trf | Train | Pl.X
    return `${start}${delayStr} - ${end} | ${duration} | ${transferStr} | ${trainName} | Pl. ${track}`;
  });
};
