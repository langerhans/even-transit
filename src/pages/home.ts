import { 
  CreateStartUpPageContainer, 
  RebuildPageContainer, 
  ListContainerProperty, 
  TextContainerProperty, 
  ListItemContainerProperty, 
  type EvenAppBridge
} from '@evenrealities/even_hub_sdk';
import type { Place } from '../config';

interface SavedConnection {
  id: string;
  from: Place;
  to: Place;
}

export async function renderHome(bridge: EvenAppBridge, isFirstRender: boolean = false, connections: SavedConnection[] = []) {
  console.log('Rendering Home...', connections);
  
  const textContainer = new TextContainerProperty({
    containerID: 1,
    containerName: 'title-txt',
    content: 'Even Transit',
    xPosition: 8, yPosition: 0, width: 240, height: 32,
    isEventCapture: 0,
  });

  const connectionNames = connections.length > 0 
    ? connections.map(c => `${c.from.name.substring(0, 30)} -> ${c.to.name.substring(0, 30)}`)
    : ['Add Connections in App'];

  const listContainer = new ListContainerProperty({
    containerID: 2,
    containerName: 'home-list',
    itemContainer: new ListItemContainerProperty({
      itemCount: connectionNames.length,
      itemWidth: 566,
      isItemSelectBorderEn: 1,
      itemName: connectionNames,
    }),
    isEventCapture: 1,
    xPosition: 4, yPosition: 40, width: 572, height: 248,
  });

  // Note: We package these into the request object
  const config = {
    containerTotalNum: 2,
    textObject: [textContainer],
    listObject: [listContainer],
  };

  if (isFirstRender) {
    const pageContainer = new CreateStartUpPageContainer(config);
    await bridge.createStartUpPageContainer(pageContainer);
  } else {
    // For updates, we use RebuildPageContainer
    const pageContainer = new RebuildPageContainer(config);
    await bridge.rebuildPageContainer(pageContainer);
  }
}
