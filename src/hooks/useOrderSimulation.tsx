import { useState, useCallback } from 'react';
import { OrderForm, OrderSimulation, OrderBook } from '@/types/orderbook';
import { simulateOrder } from '@/services/orderbookService';

const DEFAULT_FORM: OrderForm = {
  exchange: 'OKX',
  symbol: 'BTC-USDT',
  type: 'Limit',
  side: 'Buy',
  price: null,
  quantity: 1,
  delay: 'immediate'
};

export const useOrderSimulation = (orderBook: OrderBook) => {
  const [form, setForm] = useState<OrderForm>(DEFAULT_FORM);
  const [simulation, setSimulation] = useState<OrderSimulation | null>(null);

  const updateForm = useCallback((updates: Partial<OrderForm>) => {
    setForm(prev => {
      const updated = { ...prev, ...updates };
      
      // Reset price if switching to market order
      if (updates.type === 'Market') {
        updated.price = null;
      }
      
      // If exchange changes, update symbol to match available options
      if (updates.exchange && updates.exchange !== prev.exchange) {
        switch (updates.exchange) {
          case 'OKX':
            updated.symbol = 'BTC-USDT';
            break;
          case 'Bybit':
            updated.symbol = 'BTCUSDT';
            break;
          case 'Deribit':
            updated.symbol = 'BTC-PERPETUAL';
            break;
        }
      }
      
      return updated;
    });
  }, []);

  const simulate = useCallback(() => {
    if (!orderBook.bids.length || !orderBook.asks.length) {
      return;
    }
    
    const result = simulateOrder(form, orderBook);
    setSimulation(result);
    
    // If there's a delay, schedule the simulation to be removed
    if (form.delay !== 'immediate') {
      const delayMs = form.delay === '5s' ? 5000 : form.delay === '10s' ? 10000 : 30000;
      
      setTimeout(() => {
        setSimulation(null);
      }, delayMs);
    }
  }, [form, orderBook]);

  const resetSimulation = useCallback(() => {
    setSimulation(null);
  }, []);

  return {
    form,
    updateForm,
    simulation,
    simulate,
    resetSimulation,
    resetForm: () => setForm(DEFAULT_FORM)
  };
};