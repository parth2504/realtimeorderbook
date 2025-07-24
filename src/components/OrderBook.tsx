import { memo, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { OrderLevel, OrderSimulation, OrderSide } from '@/types/orderbook';
import { cn } from '@/lib/utils';

interface OrderBookProps {
  bids: OrderLevel[];
  asks: OrderLevel[];
  simulation: OrderSimulation | null;
  isConnected: boolean;
}

const OrderBook = ({ bids, asks, simulation, isConnected }: OrderBookProps) => {
  // Use refs to track previous values for optimized rendering
  const prevAsksRef = useRef<string>('');
  const prevBidsRef = useRef<string>('');
  
  // Store stringified versions of data to prevent unnecessary re-renders
  useEffect(() => {
    prevAsksRef.current = JSON.stringify(asks);
    prevBidsRef.current = JSON.stringify(bids);
  }, [asks, bids]);
  const renderLevels = (levels: OrderLevel[], side: OrderSide, isBid: boolean) => {
    if (!levels.length) {
      return (
        <tr>
          <td colSpan={3} className="text-center text-muted-foreground p-2">
            No data available
          </td>
        </tr>
      );
    }

    return levels.map((level, index) => {
      const isSimulated = simulation?.active && 
        simulation.form.side === side && 
        simulation.form.type === 'Limit' && 
        simulation.form.price === level.price;

      return (
        <tr 
          key={`${level.price}-${index}`}
          className={cn(
            "text-right",
            isSimulated ? "bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300" : ""
          )}
        >
          <td className="py-1 px-2">
            <span className={cn(
              isBid ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}>
              {level.price.toFixed(2)}
            </span>
          </td>
          <td className="py-1 px-2">{level.quantity.toFixed(4)}</td>
          <td className="py-1 px-2">{level.total?.toFixed(4) || '-'}</td>
          <td className="py-1 px-1 w-1/4 relative">
            <div className={cn(
              "absolute top-0 bottom-0 opacity-20",
              isBid ? "bg-green-500 right-0" : "bg-red-500 left-0"
            )} 
            style={{ width: `${level.percentage || 0}%` }} />
          </td>
        </tr>
      );
    });
  };

  return (
    <Card className="shadow-lg">
      <CardContent className="p-4 relative">
        {!isConnected && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Connecting...</p>
            </div>
          </div>
        )}
        <div className="overflow-auto max-h-[50vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background">
              <tr className="text-muted-foreground border-b">
                <th className="text-right py-2 px-2">Price</th>
                <th className="text-right py-2 px-2">Amount</th>
                <th className="text-right py-2 px-2">Total</th>
                <th className="py-2 px-1 w-1/4">Depth</th>
              </tr>
            </thead>
            <tbody>
              {/* Asks (sell orders) - displayed in reverse order */}
              {renderLevels([...asks].reverse(), 'Sell', false)}
              
              {/* Spread indicator */}
              {bids.length > 0 && asks.length > 0 && (
                <tr className="border-y bg-muted/50">
                  <td colSpan={4} className="text-center py-1 text-xs text-muted-foreground">
                    Spread: {((asks[0]?.price || 0) - (bids[0]?.price || 0)).toFixed(2)} ({(((asks[0]?.price || 0) - (bids[0]?.price || 0)) / (asks[0]?.price || 1) * 100).toFixed(2)}%)
                  </td>
                </tr>
              )}
              
              {/* Bids (buy orders) */}
              {renderLevels(bids, 'Buy', true)}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(OrderBook);