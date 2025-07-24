import { OrderBook, OrderLevel, OrderForm, OrderSimulation } from '@/types/orderbook';

export const processOrderBookData = (rawOrderBook: OrderBook): OrderBook => {
  // Sort bids in descending order and asks in ascending order
  const bids = [...rawOrderBook.bids]
    .sort((a, b) => b.price - a.price)
    .slice(0, 15);
  
  const asks = [...rawOrderBook.asks]
    .sort((a, b) => a.price - b.price)
    .slice(0, 15);
  
  // Calculate cumulative quantities and percentages
  let bidTotal = 0;
  let askTotal = 0;
  
  bids.forEach(bid => {
    bidTotal += bid.quantity;
    bid.total = bidTotal;
  });
  
  asks.forEach(ask => {
    askTotal += ask.quantity;
    ask.total = askTotal;
  });
  
  const maxTotal = Math.max(bidTotal, askTotal);
  
  bids.forEach(bid => {
    bid.percentage = bid.total ? (bid.total / maxTotal) * 100 : 0;
  });
  
  asks.forEach(ask => {
    ask.percentage = ask.total ? (ask.total / maxTotal) * 100 : 0;
  });
  
  return {
    bids,
    asks,
    timestamp: rawOrderBook.timestamp
  };
};

export const simulateOrder = (form: OrderForm, orderBook: OrderBook): OrderSimulation => {
  if (!orderBook || !orderBook.bids.length || !orderBook.asks.length) {
    return {
      form,
      fillPercentage: 0,
      marketImpact: 0,
      slippage: 0,
      active: false
    };
  }
  
  // Market order simulation
  if (form.type === 'Market') {
    const levels = form.side === 'Buy' ? orderBook.asks : orderBook.bids;
    
    let remainingQuantity = form.quantity;
    let totalValue = 0;
    let filledLevels = 0;
    
    for (const level of levels) {
      if (remainingQuantity <= 0) break;
      
      const fillQuantity = Math.min(remainingQuantity, level.quantity);
      totalValue += fillQuantity * level.price;
      remainingQuantity -= fillQuantity;
      filledLevels++;
    }
    
    const fillPercentage = ((form.quantity - remainingQuantity) / form.quantity) * 100;
    const averagePrice = totalValue / (form.quantity - remainingQuantity);
    const bestPrice = form.side === 'Buy' ? orderBook.asks[0].price : orderBook.bids[0].price;
    const slippage = form.side === 'Buy' 
      ? ((averagePrice - bestPrice) / bestPrice) * 100
      : ((bestPrice - averagePrice) / bestPrice) * 100;
    
    // Market impact is estimated by the number of levels affected
    const marketImpact = (filledLevels / levels.length) * 100;
    
    return {
      form,
      fillPercentage,
      marketImpact,
      slippage: Math.max(0, slippage),
      timeToFill: 'Immediate',
      active: true
    };
  } 
  // Limit order simulation
  else {
    const orderPrice = form.price || 0;
    const levels = form.side === 'Buy' ? orderBook.asks : orderBook.bids;
    
    // For Buy orders, only levels with price <= order price can be filled
    // For Sell orders, only levels with price >= order price can be filled
    const fillableLevels = form.side === 'Buy'
      ? levels.filter(level => level.price <= orderPrice)
      : levels.filter(level => level.price >= orderPrice);
    
    let remainingQuantity = form.quantity;
    let totalValue = 0;
    
    for (const level of fillableLevels) {
      if (remainingQuantity <= 0) break;
      
      const fillQuantity = Math.min(remainingQuantity, level.quantity);
      totalValue += fillQuantity * level.price;
      remainingQuantity -= fillQuantity;
    }
    
    const fillPercentage = ((form.quantity - remainingQuantity) / form.quantity) * 100;
    
    let marketImpact = 0;
    if (fillPercentage < 100) {
      // Estimate where the order would sit in the orderbook
      const relevantLevels = form.side === 'Buy' ? orderBook.bids : orderBook.asks;
      const depth = relevantLevels.length;
      
      // Find position in orderbook
      let position = 0;
      for (let i = 0; i < relevantLevels.length; i++) {
        const level = relevantLevels[i];
        if (form.side === 'Buy' && orderPrice > level.price) {
          position = i;
          break;
        } else if (form.side === 'Sell' && orderPrice < level.price) {
          position = i;
          break;
        }
      }
      
      // Market impact for limit orders is estimated by how deep in the book the order would sit
      marketImpact = (1 - (position / depth)) * 50; // Scale to max 50% for limit orders
    } else {
      // For fully filled limit orders, impact is similar to market orders but typically less
      marketImpact = fillableLevels.length / levels.length * 75; // 75% of market order impact
    }
    
    // Calculate slippage for filled portion
    const averageFilledPrice = totalValue / (form.quantity - remainingQuantity || 1);
    const slippage = form.side === 'Buy'
      ? ((averageFilledPrice - orderPrice) / orderPrice) * 100
      : ((orderPrice - averageFilledPrice) / orderPrice) * 100;
    
    return {
      form,
      fillPercentage,
      marketImpact: Math.min(100, marketImpact),
      slippage: Math.max(0, slippage),
      timeToFill: estimateTimeToFill(form.delay, fillPercentage),
      active: true
    };
  }
};

const estimateTimeToFill = (delay: string, fillPercentage: number): string => {
  if (delay === 'immediate') {
    return fillPercentage >= 100 ? 'Immediate' : 'Partial fill';
  }
  
  const delayMs = delay === '5s' ? 5000 : delay === '10s' ? 10000 : 30000;
  
  if (fillPercentage >= 100) {
    return `~${delayMs / 1000}s`;
  } else if (fillPercentage > 75) {
    return `>${delayMs / 1000}s`;
  } else if (fillPercentage > 50) {
    return `>>${delayMs / 1000}s`;
  } else if (fillPercentage > 0) {
    return `>>>${delayMs / 1000}s`;
  } else {
    return 'Unlikely to fill';
  }
};

export const getAvailableSymbols = (exchange: string): string[] => {
  switch (exchange) {
    case 'OKX':
      return ['BTC-USDT', 'ETH-USDT', 'SOL-USDT', 'XRP-USDT', 'DOGE-USDT'];
    case 'Bybit':
      return ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT'];
    case 'Deribit':
      return ['BTC-PERPETUAL', 'ETH-PERPETUAL'];
    default:
      return [];
  }
};