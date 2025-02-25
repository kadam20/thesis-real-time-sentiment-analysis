export class State {
  type: string;
  id: string;
  properties: StateProperty;
  geometry: StateGeometry;
}

class StateProperty {
  name: string;
  sentiment?: number;
  trumpSentiment?: number;
  bidenSentiment?: number;
  trumpAmount?: number;
  bidenAmount?: number;
  tooltipContent?: string;
  density: number;
}

class StateGeometry {
  type: string;
  coordinates: any;
}
