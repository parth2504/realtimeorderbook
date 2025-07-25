import { Exchange } from '@/types/orderbook';

interface WebSocketConfig {
  url: string;
  subscriptionMessage: (symbol: string) => unknown;
  parseMessage: (message: unknown) => unknown;
}

const exchangeConfigs: Record<Exchange, WebSocketConfig> = {
  OKX: {
    url: 'wss://ws.okx.com:8443/ws/v5/public',
    subscriptionMessage: (symbol: string) => JSON.stringify({
      op: 'subscribe',
      args: [{
        channel: 'books',
        instId: symbol
      }]
    }),
    parseMessage: (message: unknown) => {
      // OKX specific message parsing
      const msg = message as Record<string, unknown>;
      if (!msg.data) return null;
      
      try {
        const data = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data as Record<string, unknown>[];
        if (!Array.isArray(data) || !data[0] || !('asks' in data[0]) || !('bids' in data[0])) return null;
        
        const orderBookData = data[0] as { asks: string[][], bids: string[][] };
        
        return {
          bids: orderBookData.bids.map((bid: string[]) => ({ price: parseFloat(bid[0]), quantity: parseFloat(bid[1]) })),
          asks: orderBookData.asks.map((ask: string[]) => ({ price: parseFloat(ask[0]), quantity: parseFloat(ask[1]) })),
          timestamp: new Date().getTime(),
        };
      } catch (error) {
        console.error('Error parsing OKX message:', error);
        return null;
      }
    }
  },
  Bybit: {
    url: 'wss://stream.bybit.com/v5/public/spot',
    subscriptionMessage: (symbol: string) => JSON.stringify({
      op: 'subscribe',
      args: [`orderbook.50.${symbol}`]
    }),
    parseMessage: (message: unknown) => {
      // Bybit specific message parsing
      const msg = message as Record<string, unknown>;
      if (!msg.data || typeof msg.topic !== 'string' || msg.topic.indexOf('orderbook') === -1) return null;
      
      try {
        const data = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data as Record<string, unknown>;
        if (!data || !('a' in data) || !('b' in data)) return null;
        
        const orderBookData = data as { a: string[][], b: string[][], ts?: number };
        
        return {
          bids: orderBookData.b.slice(0, 50).map((bid: string[]) => ({ price: parseFloat(bid[0]), quantity: parseFloat(bid[1]) })),
          asks: orderBookData.a.slice(0, 50).map((ask: string[]) => ({ price: parseFloat(ask[0]), quantity: parseFloat(ask[1]) })),
          timestamp: orderBookData.ts || new Date().getTime(),
        };
      } catch (error) {
        console.error('Error parsing Bybit message:', error);
        return null;
      }
    }
  },
  Deribit: {
    url: 'wss://www.deribit.com/ws/api/v2',
    subscriptionMessage: (symbol: string) => JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'public/subscribe',
      params: {
        channels: [`book.${symbol}.none.20.100ms`]
      }
    }),
    parseMessage: (message: unknown) => {
      // Deribit specific message parsing
      const msg = message as { params?: { data?: unknown } };
      if (!msg.params?.data) return null;
      
      try {
        const data = msg.params.data as {
          bids: [number, number][],
          asks: [number, number][],
          timestamp?: number
        };
        
        return {
          bids: data.bids.map((bid) => ({ price: bid[0], quantity: bid[1] })),
          asks: data.asks.map((ask) => ({ price: ask[0], quantity: ask[1] })),
          timestamp: data.timestamp || new Date().getTime(),
        };
      } catch (error) {
        console.error('Error parsing Deribit message:', error);
        return null;
      }
    }
  }
};

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private currentExchange: Exchange | null = null;
  private currentSymbol: string | null = null;
  private messageCallback: ((data: unknown) => void) | null = null;
  private errorCallback: ((error: Event) => void) | null = null;

  public connect(
    exchange: Exchange, 
    symbol: string, 
    onMessage: (data: unknown) => void, 
    onError?: (error: Event) => void
  ): void {
    this.disconnect(); // Close existing connection if any
    
    this.currentExchange = exchange;
    this.currentSymbol = symbol;
    this.messageCallback = onMessage;
    this.errorCallback = onError || (() => {});
    
    const config = exchangeConfigs[exchange];
    if (!config) {
      console.error(`Unsupported exchange: ${exchange}`);
      return;
    }
    
    try {
      this.socket = new WebSocket(config.url);
      
      this.socket.onopen = () => {
        console.log(`WebSocket connected to ${exchange}`);
        this.reconnectAttempts = 0;
        if (this.socket && this.currentSymbol) {
          this.socket.send(config.subscriptionMessage(this.currentSymbol) as string);
        }
      };
      
      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const parsedData = config.parseMessage(message);
          
          if (parsedData && this.messageCallback) {
            this.messageCallback(parsedData);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.socket.onerror = (error) => {
        console.error(`WebSocket error for ${exchange}:`, error);
        if (this.errorCallback) {
          this.errorCallback(error);
        }
      };
      
      this.socket.onclose = () => {
        console.log(`WebSocket connection closed for ${exchange}`);
        this.attemptReconnect();
      };
    } catch (error) {
      console.error(`Error connecting to ${exchange} WebSocket:`, error);
      this.attemptReconnect();
    }
  }
  
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    this.reconnectTimeout = setTimeout(() => {
      if (this.currentExchange && this.currentSymbol && this.messageCallback) {
        this.connect(this.currentExchange, this.currentSymbol, this.messageCallback, this.errorCallback || undefined);
      }
    }, delay);
  }
  
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.currentExchange = null;
    this.currentSymbol = null;
    this.messageCallback = null;
    this.errorCallback = null;
  }
  
  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
}

export default new WebSocketService();