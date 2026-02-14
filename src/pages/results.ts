import { 
  RebuildPageContainer, 
  ListContainerProperty, 
  TextContainerProperty, 
  ListItemContainerProperty, 
  type EvenAppBridge
} from '@evenrealities/even_hub_sdk';
import type { Itinerary } from '@motis-project/motis-client';
import { extractItinerarySummaries } from '../utils';

export async function renderResults(bridge: EvenAppBridge, connections: Itinerary[]) {
  console.log('Rendering Results...');

  const textContainer = new TextContainerProperty({
    containerID: 1,
    containerName: 'title-txt',
    content: 'Connections',
    xPosition: 8, yPosition: 0, width: 240, height: 32,
    isEventCapture: 0,
  });

  // Format connections for display
  const summaries = extractItinerarySummaries(connections);
  const listItems = summaries.length > 0 ? [...summaries] : ['No connections found'];

  const listContainer = new ListContainerProperty({
    containerID: 2,
    containerName: 'res-list',
    itemContainer: new ListItemContainerProperty({
      itemCount: listItems.length,
      itemWidth: 566,
      isItemSelectBorderEn: 1,
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
