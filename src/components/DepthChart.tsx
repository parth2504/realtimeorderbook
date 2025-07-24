import { useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderBook, OrderSimulation } from '@/types/orderbook';
import { cn } from '@/lib/utils';

interface DepthChartProps {
  orderBook: OrderBook;
  simulation: OrderSimulation | null;
}

const DepthChart = ({ orderBook, simulation }: DepthChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Use a reference to track previous data to avoid unnecessary redraws
  const prevDataRef = useRef<string>('');
  
  // Extract rendering logic into a memoized function
  const renderChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !orderBook.bids.length || !orderBook.asks.length) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Generate current data signature for comparison
    const currentData = JSON.stringify({
      bids: orderBook.bids.map(b => [b.price, b.quantity]),
      asks: orderBook.asks.map(a => [a.price, a.quantity]),
      simulation: simulation ? { price: simulation.form.price, side: simulation.form.side } : null
    });
    
    // Skip redraw if data hasn't changed
    if (currentData === prevDataRef.current) return;
    prevDataRef.current = currentData;
    
    // Set canvas size
    const devicePixelRatio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    
    ctx.scale(devicePixelRatio, devicePixelRatio);
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    // Sort and prepare data
    const bids = [...orderBook.bids].sort((a, b) => a.price - b.price);
    const asks = [...orderBook.asks].sort((a, b) => a.price - b.price);
    
    // Calculate cumulative volumes
    let bidCumulative = 0;
    const bidPoints = bids.map(bid => {
      bidCumulative += bid.quantity;
      return { price: bid.price, total: bidCumulative };
    });
    
    let askCumulative = 0;
    const askPoints = asks.map(ask => {
      askCumulative += ask.quantity;
      return { price: ask.price, total: askCumulative };
    }).reverse();
    
    // Find min and max values for scaling
    const minPrice = Math.min(...bids.map(b => b.price), ...asks.map(a => a.price));
    const maxPrice = Math.max(...bids.map(b => b.price), ...asks.map(a => a.price));
    const maxVolume = Math.max(
      bidPoints.length > 0 ? bidPoints[bidPoints.length - 1].total : 0,
      askPoints.length > 0 ? askPoints[0].total : 0
    );
    
    // Chart dimensions
    const width = rect.width;
    const height = rect.height;
    const padding = { top: 10, right: 10, bottom: 20, left: 40 };
    
    // Scale functions
    const scaleX = (price: number) => {
      return padding.left + ((price - minPrice) / (maxPrice - minPrice)) * (width - padding.left - padding.right);
    };
    
    const scaleY = (volume: number) => {
      return height - padding.bottom - (volume / maxVolume) * (height - padding.top - padding.bottom);
    };
    
    // Draw axes
    ctx.strokeStyle = '#c1c1c1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.stroke();
    
    // Add mid price line
    const midPrice = (bids[bids.length - 1]?.price + asks[0]?.price) / 2;
    const midX = scaleX(midPrice);
    
    ctx.strokeStyle = '#888';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(midX, padding.top);
    ctx.lineTo(midX, height - padding.bottom);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw bid area
    if (bidPoints.length > 1) {
      ctx.beginPath();
      ctx.moveTo(scaleX(bidPoints[0].price), height - padding.bottom);
      
      bidPoints.forEach(point => {
        ctx.lineTo(scaleX(point.price), scaleY(point.total));
      });
      
      ctx.lineTo(scaleX(bidPoints[bidPoints.length - 1].price), height - padding.bottom);
      ctx.closePath();
      
      ctx.fillStyle = 'rgba(0, 128, 0, 0.2)';
      ctx.fill();
      
      ctx.strokeStyle = 'rgba(0, 128, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(scaleX(bidPoints[0].price), scaleY(bidPoints[0].total));
      
      bidPoints.forEach(point => {
        ctx.lineTo(scaleX(point.price), scaleY(point.total));
      });
      
      ctx.stroke();
    }
    
    // Draw ask area
    if (askPoints.length > 1) {
      ctx.beginPath();
      ctx.moveTo(scaleX(askPoints[0].price), height - padding.bottom);
      
      askPoints.forEach(point => {
        ctx.lineTo(scaleX(point.price), scaleY(point.total));
      });
      
      ctx.lineTo(scaleX(askPoints[askPoints.length - 1].price), height - padding.bottom);
      ctx.closePath();
      
      ctx.fillStyle = 'rgba(220, 0, 0, 0.2)';
      ctx.fill();
      
      ctx.strokeStyle = 'rgba(220, 0, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(scaleX(askPoints[0].price), scaleY(askPoints[0].total));
      
      askPoints.forEach(point => {
        ctx.lineTo(scaleX(point.price), scaleY(point.total));
      });
      
      ctx.stroke();
    }
    
    // Draw simulation order line if applicable
    if (simulation?.active && simulation.form.type === 'Limit' && simulation.form.price) {
      const simPrice = simulation.form.price;
      const simX = scaleX(simPrice);
      
      ctx.strokeStyle = simulation.form.side === 'Buy' ? '#0055ff' : '#ff0055';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(simX, padding.top);
      ctx.lineTo(simX, height - padding.bottom);
      ctx.stroke();
      
      // Draw simulation point
      ctx.fillStyle = simulation.form.side === 'Buy' ? '#0055ff' : '#ff0055';
      ctx.beginPath();
      ctx.arc(simX, padding.top, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Label
      ctx.fillStyle = '#000';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${simulation.form.price}`, simX, height - padding.bottom + 15);
    }
    
    // Draw price labels
    ctx.fillStyle = '#888';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    
    const priceStep = (maxPrice - minPrice) / 5;
    for (let i = 0; i <= 5; i++) {
      const price = minPrice + priceStep * i;
      const x = scaleX(price);
      ctx.fillText(price.toFixed(1), x, height - 5);
    }
    
    // Draw volume labels
    ctx.textAlign = 'right';
    const volumeStep = maxVolume / 4;
    for (let i = 0; i <= 4; i++) {
      const volume = volumeStep * i;
      const y = scaleY(volume);
      ctx.fillText(volume.toFixed(1), padding.left - 5, y + 3);
    }
    
  }, [orderBook, simulation]);
  
  // Call the render function when data changes
  useEffect(() => {
    renderChart();
  }, [orderBook.bids, orderBook.asks, simulation, renderChart]);
  
  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-1">
        <CardTitle className="text-lg">Market Depth</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-64">
          <canvas 
            ref={canvasRef}
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        <div className="flex justify-center mt-2 text-xs">
          <div className="flex items-center mr-4">
            <div className={cn("w-3 h-3 rounded-full bg-green-500 mr-1")} />
            <span>Bids</span>
          </div>
          <div className="flex items-center">
            <div className={cn("w-3 h-3 rounded-full bg-red-500 mr-1")} />
            <span>Asks</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DepthChart;