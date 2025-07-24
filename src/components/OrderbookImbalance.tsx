import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { OrderBook } from '@/types/orderbook';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { memo } from 'react';

interface OrderbookImbalanceProps {
  orderBook: OrderBook;
}

const OrderbookImbalance = memo(({ orderBook }: OrderbookImbalanceProps) => {
  if (!orderBook.bids.length || !orderBook.asks.length) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Order Imbalance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate volume disparity metrics
  const bidVolume = orderBook.bids.reduce((sum, bid) => sum + bid.quantity, 0);
  const askVolume = orderBook.asks.reduce((sum, ask) => sum + ask.quantity, 0);
  const totalVolume = bidVolume + askVolume;
  
  const bidPercentage = totalVolume > 0 ? (bidVolume / totalVolume) * 100 : 50;
  const askPercentage = totalVolume > 0 ? (askVolume / totalVolume) * 100 : 50;
  
  const imbalanceRatio = bidVolume / askVolume;
  const imbalancePercentage = Math.abs((bidPercentage - 50) * 2);
  const imbalanceDirection = bidPercentage >= askPercentage ? 'buy' : 'sell';
  
  // Calculate pressure from price levels
  const topBidPrice = Math.max(...orderBook.bids.map(b => b.price));
  const topBidVolume = orderBook.bids.find(b => b.price === topBidPrice)?.quantity || 0;
  
  const bottomAskPrice = Math.min(...orderBook.asks.map(a => a.price));
  const bottomAskVolume = orderBook.asks.find(a => a.price === bottomAskPrice)?.quantity || 0;
  
  const topLevelImbalance = topBidVolume / (bottomAskVolume || 1);
  const pressureDirection = topLevelImbalance > 1 ? 'up' : 'down';
  const pressureStrength = Math.min(Math.abs(1 - topLevelImbalance) * 10, 100);
  
  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Order Imbalance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Buy vs Sell Volume</span>
            <span className="text-sm font-medium">{imbalanceRatio.toFixed(2)}x</span>
          </div>
          
          <div className="flex h-2 overflow-hidden rounded-full bg-muted">
            <div 
              className="bg-green-500" 
              style={{ width: `${bidPercentage}%` }}
            />
            <div 
              className="bg-red-500" 
              style={{ width: `${askPercentage}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs">
            <span>Bids: {bidVolume.toFixed(2)}</span>
            <span>Asks: {askVolume.toFixed(2)}</span>
          </div>
          
          <div className={cn(
            "flex items-center justify-center py-2 rounded-md",
            imbalanceDirection === 'buy' 
              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" 
              : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
          )}>
            <span className="text-sm font-medium">
              {imbalanceDirection === 'buy' ? 'Buy' : 'Sell'} Pressure: {imbalancePercentage.toFixed(0)}%
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Price Pressure</span>
            <div className="flex items-center">
              {pressureDirection === 'up' ? (
                <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={cn(
                "text-sm font-medium",
                pressureDirection === 'up' ? "text-green-600" : "text-red-600"
              )}>
                {pressureStrength.toFixed(0)}%
              </span>
            </div>
          </div>
          <Progress 
            value={pressureStrength} 
            className={cn(
              pressureDirection === 'up' ? "bg-green-200" : "bg-red-200"
            )}
          />
          <div className="text-xs text-muted-foreground">
            {pressureDirection === 'up' 
              ? 'Upward pressure: more buyers at top of book' 
              : 'Downward pressure: more sellers at top of book'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default OrderbookImbalance;