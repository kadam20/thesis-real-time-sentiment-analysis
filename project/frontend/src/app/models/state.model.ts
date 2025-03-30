export class State {
  type: string;
  id: string;
  properties: StateProperty;
  geometry: StateGeometry;
}

export class StateProperty {
  name: string;
  sentiment?: number;
  trumpSentiment?: number;
  bidenSentiment?: number;
  trumpAmount?: number;
  bidenAmount?: number;
  tooltipContent?: string;
  code: string;
}

class StateGeometry {
  type: string;
  coordinates: any;
}

export class StateData {
  state_code: string;
  total_sentiment: number;
  biden_sentiment: number;
  biden_count: number;
  trump_sentiment: number;
  trump_count: number;
}