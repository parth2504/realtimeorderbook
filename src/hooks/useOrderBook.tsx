import { useState, useEffect, useCallback, useRef } from 'react';
import { OrderBook, Exchange } from '@/types/orderbook';
import WebSocketService from '@/services/api/websocketService';
import { processOrderBookData } from '@/services/orderbookService';
import { debounce } from '@/lib/utils';

const DEFAULT_ORDERBOOK: OrderBook = {
  bids: [],
  asks: [],
  timestamp: 0
};

const UPDATE_THROTTLE = 300; // ms between updates to prevent flickering

export const useOrderBook = (exchange: Exchange, symbol: string) => {
  const [orderBook, setOrderBook] = useState<OrderBook>(DEFAULT_ORDERBOOK);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const pendingUpdateRef = useRef<OrderBook | null>(null);

  // Throttled update function to prevent too many re-renders
  const updateOrderBookThrottled = useCallback(
    debounce((data: OrderBook) => {
      setOrderBook(processOrderBookData(data));
      pendingUpdateRef.current = null;
      lastUpdateRef.current = Date.now();
    }, UPDATE_THROTTLE),
    []
  );

  const handleOrderBookUpdate = useCallback((data: unknown) => {
    const bookData = data as OrderBook;
    if (!bookData || !bookData.bids || !bookData.asks) return;
    
    setError(null);
    setIsConnected(true);
    
    // Skip updates that are older than what we already have
    if (bookData.timestamp <= lastUpdateRef.current) return;
    
    // Store the latest update
    pendingUpdateRef.current = bookData;
    
    // If we've just received an update, throttle the visual update
    const timeSinceLastUpdate = Date.now() - lastUpdateRef.current;
    
    if (timeSinceLastUpdate > UPDATE_THROTTLE) {
      // It's been long enough since the last update, process immediately
      updateOrderBookThrottled(bookData);
    } else {
      // Otherwise queue it through the debounced function
      updateOrderBookThrottled(bookData);
    }
  }, [updateOrderBookThrottled]);

  const handleError = useCallback((error: Event) => {
    console.error('WebSocket error:', error);
    setError('Connection error. Attempting to reconnect...');
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (!exchange || !symbol) {
      setOrderBook(DEFAULT_ORDERBOOK);
      pendingUpdateRef.current = null;
      return;
    }

    setError(null);
    setIsConnected(false);
    pendingUpdateRef.current = null;
    lastUpdateRef.current = 0;
    
    try {
      WebSocketService.connect(exchange, symbol, handleOrderBookUpdate, handleError);
      
      return () => {
        WebSocketService.disconnect();
      };
    } catch (err) {
      setError('Failed to connect to WebSocket');
      console.error('WebSocket connection error:', err);
    }
  }, [exchange, symbol, handleOrderBookUpdate, handleError]);

  return { 
    orderBook, 
    isConnected, 
    error,
    reset: () => {
      setOrderBook(DEFAULT_ORDERBOOK);
      pendingUpdateRef.current = null;
      lastUpdateRef.current = 0;
    }
  };
};