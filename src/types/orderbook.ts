export interface OrderLevel {
  price: number;
  quantity: number;
  total?: number; // Cumulative quantity at this level
  percentage?: number; // For visualization
}

export interface OrderBook {
  bids: OrderLevel[];
  asks: OrderLevel[];
  timestamp: number;
}

export type Exchange = 'OKX' | 'Bybit' | 'Deribit';

export interface Symbol {
  name: string;
  exchange: Exchange;
}

export type OrderType = 'Market' | 'Limit';
export type OrderSide = 'Buy' | 'Sell';
export type DelayOption = 'immediate' | '5s' | '10s' | '30s';

export interface OrderForm {
  exchange: Exchange;
  symbol: string;
  type: OrderType;
  side: OrderSide;
  price: number | null;
  quantity: number;
  delay: DelayOption;
}

export interface OrderSimulation {
  form: OrderForm;
  fillPercentage: number;
  marketImpact: number;
  slippage: number;
  timeToFill?: string;
  active: boolean;
}

export interface WebSocketMessage {
  type: string;
  data?: unknown;
}