import { 
  RebuildPageContainer, 
  ListContainerProperty, 
  TextContainerProperty, 
  ListItemContainerProperty, 
  type EvenAppBridge
} from '@evenrealities/even_hub_sdk';
import type { Itinerary } from '@motis-project/motis-client';
import { formatTime } from '../utils';

// Helper to extract point info (time, delay, location)
const getPointInfo = (leg: any, type: 'from' | 'to') => {
  const isFrom = type === 'from';
  const timeProp = isFrom ? 'startTime' : 'endTime';
  const schedTimeProp = isFrom ? 'scheduledStartTime' : 'scheduledEndTime';
  const station = isFrom ? leg.from : leg.to;

  const timeVal = leg[timeProp];
  const schedTimeVal = leg[schedTimeProp] || timeVal;

  const timeFormatted = formatTime(timeVal);

  const real = new Date(timeVal).getTime();
  const sched = new Date(schedTimeVal).getTime();
  const delay = Math.round((real - sched) / 60000);
  const delayStr = delay > 0 ? `(+${delay})` : '';

  const timeStr = `${timeFormatted}${delayStr}`;

  let name = station.name;
  if (name.length > 45) {
    name = name.substring(0, 42) + '...';
  }
  
  const track = station.track || station.scheduledTrack;
  const trackStr = track ? ` Pl.${track}` : '';
  const nameStr = `${name}${trackStr}`;

  return { timeStr, nameStr, fullStr: `${timeStr} ${nameStr}` };
};

// Helper to format a single leg into a readable string
const extractLegDetails = (itinerary: Itinerary): string[] => {
  const details: string[] = [];
  const legs = itinerary.legs;
  let skipNextDeparture = false;

  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];

    // 1. Departure Info
    if (!skipNextDeparture) {
      const dep = getPointInfo(leg, 'from');
      details.push(dep.fullStr);
    }
    skipNextDeparture = false;

    // 2. Transport Info: "| ICE 123 (60min)"
    let modeStr = '';
    const duration = Math.round(leg.duration / 60);
    
    if (leg.mode === 'WALK') {
      modeStr = `Walk`;
    } else {
      modeStr = leg.displayName || leg.tripShortName || leg.mode;
    }
    
    details.push(`  |   ${modeStr} (${duration}min)`);

    // Special case: For intermediate walks, skip the arrival info to reduce clutter.
    // The next leg's departure will be shown instead.
    if (leg.mode === 'WALK' && i < legs.length - 1) {
      continue;
    }

    // 3. Arrival Info
    const arr = getPointInfo(leg, 'to');

    // Check if we can merge with next leg's departure
    if (i < legs.length - 1) {
      const nextLeg = legs[i + 1];
      const nextDep = getPointInfo(nextLeg, 'from');

      if (arr.nameStr === nextDep.nameStr) {
        // Locations match, merge them
        skipNextDeparture = true;
        if (arr.timeStr === nextDep.timeStr) {
          // Exact same time, show once
          details.push(arr.fullStr);
        } else {
          // Different times (e.g. wait/transfer), show range
          details.push(`${arr.timeStr} - ${nextDep.timeStr} ${arr.nameStr}`);
        }
      } else {
        // Locations differ, show arrival normally
        details.push(arr.fullStr);
      }
    } else {
      // Last leg, always show arrival
      details.push(arr.fullStr);
    }
  }

  return details;
};

export async function renderDetails(bridge: EvenAppBridge, itinerary: Itinerary) {
  console.log('Rendering Details...');

  const textContainer = new TextContainerProperty({
    containerID: 1,
    containerName: 'title-txt',
    content: 'Trip Details',
    xPosition: 8, yPosition: 0, width: 240, height: 32,
    isEventCapture: 0,
  });

  const listItems = extractLegDetails(itinerary);

  const listContainer = new ListContainerProperty({
    containerID: 2,
    containerName: 'detail-list',
    itemContainer: new ListItemContainerProperty({
      itemCount: listItems.length,
      itemWidth: 566,
      isItemSelectBorderEn: 0, // Disable visual selection border as it's informational
      itemName: listItems,
    }),
    isEventCapture: 1,
    xPosition: 4, yPosition: 40, width: 572, height: 248,
  });

  const pageContainer = new RebuildPageContainer({
    containerTotalNum: 2,
    textObject: [textContainer],
    listObject: [listContainer],
  });

  await bridge.rebuildPageContainer(pageContainer);
}
