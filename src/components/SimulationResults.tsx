import { memo } from 'react';
import { OrderSimulation } from '@/types/orderbook';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimulationResultsProps {
  simulation: OrderSimulation;
  onReset: () => void;
}

const SimulationResults = ({ simulation, onReset }: SimulationResultsProps) => {
  const { form, fillPercentage, marketImpact, slippage, timeToFill } = simulation;
  
  const getSlippageColor = (slippage: number) => {
    if (slippage < 0.5) return "text-green-600";
    if (slippage < 1) return "text-yellow-600";
    return "text-red-600";
  };
  
  const getImpactColor = (impact: number) => {
    if (impact < 10) return "text-green-600";
    if (impact < 25) return "text-yellow-600";
    return "text-red-600";
  };
  
  const getFillColor = (percentage: number) => {
    if (percentage >= 95) return "bg-green-500";
    if (percentage >= 75) return "bg-yellow-500";
    if (percentage >= 50) return "bg-orange-500";
    return "bg-red-500";
  };
  
  const showWarning = slippage > 1 || marketImpact > 25 || fillPercentage < 50;
  
  return (
    <Card className="shadow-lg bg-background/95 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Simulation Results</CardTitle>
          <Badge 
            variant={form.side === 'Buy' ? "default" : "destructive"}
            className={form.side === 'Buy' ? "bg-green-600" : ""}
          >
            {form.side} {form.type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Order Details</span>
          <span className="font-medium">
            {form.quantity} {form.symbol} {form.type === 'Limit' ? `@ ${form.price}` : '@ Market'}
          </span>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Fill Percentage</span>
            <span className="font-medium">{fillPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={fillPercentage} className={cn(getFillColor(fillPercentage))} />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Market Impact</div>
            <div className={cn("font-medium text-lg", getImpactColor(marketImpact))}>
              {marketImpact.toFixed(1)}%
            </div>
          </div>
          
          <div>
            <div className="text-sm text-muted-foreground">Slippage</div>
            <div className={cn("font-medium text-lg", getSlippageColor(slippage))}>
              {slippage.toFixed(2)}%
            </div>
          </div>
          
          <div>
            <div className="text-sm text-muted-foreground">Estimated Time</div>
            <div className="font-medium text-lg flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {timeToFill || 'N/A'}
            </div>
          </div>
          
          <div>
            <div className="text-sm text-muted-foreground">Exchange</div>
            <div className="font-medium text-lg">{form.exchange}</div>
          </div>
        </div>
        
        {showWarning && (
          <div className="border rounded-md p-2 bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 flex items-start space-x-2">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <div className="text-xs">
              <strong className="font-medium">Warning:</strong> This order may experience {fillPercentage < 50 ? 'poor fill rate, ' : ''}
              {slippage > 1 ? 'high slippage, ' : ''}
              {marketImpact > 25 ? 'significant market impact.' : ''}
            </div>
          </div>
        )}
        
        <Button 
          onClick={onReset} 
          className="w-full mt-2" 
          variant="outline"
        >
          Reset <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default memo(SimulationResults);