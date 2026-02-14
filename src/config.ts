export interface Place {
  name: string;
  id: string;
}

export const PLACES: Record<string, Place> = {
  Frankfurt: { name: 'Frankfurt (Main) Hbf', id: 'nl-ovapi_stoparea:17791' },
  Destination: { name: 'Destination', id: 'de-DELFI_de:08222:2417' },
};
