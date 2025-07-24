import { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Exchange } from '@/types/orderbook';
import OrderBook from '@/components/OrderBook';
import OrderSimulationForm from '@/components/OrderSimulationForm';
import SimulationResults from '@/components/SimulationResults';
import DepthChart from '@/components/DepthChart';
import OrderbookImbalance from '@/components/OrderbookImbalance';
import { useOrderBook } from '@/hooks/useOrderBook';
import { useOrderSimulation } from '@/hooks/useOrderSimulation';
import { AlertCircle } from 'lucide-react';

export default function OrderbookViewerPage() {
  const [activeExchange, setActiveExchange] = useState<Exchange>('OKX');
  const [activeSymbol, setActiveSymbol] = useState<string>('BTC-USDT');
  
  // Fetch orderbook data
  const { 
    orderBook, 
    isConnected, 
    error: connectionError 
  } = useOrderBook(activeExchange, activeSymbol);
  
  // Order simulation state
  const { 
    form, 
    updateForm, 
    simulation,
    simulate, 
    resetSimulation
  } = useOrderSimulation(orderBook);
  
  // Handle exchange change from the tabs
  const handleExchangeChange = (exchange: Exchange) => {
    setActiveExchange(exchange);
    
    // Update the symbol based on the exchange
    let symbol = '';
    switch (exchange) {
      case 'OKX':
        symbol = 'BTC-USDT';
        break;
      case 'Bybit':
        symbol = 'BTCUSDT';
        break;
      case 'Deribit':
        symbol = 'BTC-PERPETUAL';
        break;
    }
    
    setActiveSymbol(symbol);
    
    // Also update the form state
    updateForm({ exchange, symbol });
  };
  
  // Keep form exchange and active exchange in sync
  const handleFormExchangeChange = (updates: { exchange: Exchange }) => {
    setActiveExchange(updates.exchange);
    updateForm(updates);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Real-Time Orderbook Viewer</h1>
        <p className="text-muted-foreground">
          View and simulate orders across multiple cryptocurrency exchanges
        </p>
      </header>
      
      <Tabs defaultValue="OKX" onValueChange={(value) => handleExchangeChange(value as Exchange)}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-4 md:space-y-0">
          <TabsList>
            <TabsTrigger value="OKX">OKX</TabsTrigger>
            <TabsTrigger value="Bybit">Bybit</TabsTrigger>
            <TabsTrigger value="Deribit">Deribit</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center">
            <div className={`h-2 w-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">{isConnected ? 'Connected' : 'Connecting...'}</span>
          </div>
        </div>
        
        {connectionError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 mb-4 text-red-800 dark:text-red-400 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {connectionError}
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left column - Order book and depth chart */}
          <div className="lg:col-span-3 space-y-6">
            <TabsContent value="OKX" forceMount={activeExchange === 'OKX'} className="mt-0">
              {/* Using key to ensure complete component refresh when exchange changes */}
              <OrderBook 
                key={`orderbook-OKX-${activeSymbol}`}
                bids={orderBook.bids} 
                asks={orderBook.asks}
                simulation={simulation}
                isConnected={activeExchange === 'OKX' && isConnected}
              />
            </TabsContent>
            
            <TabsContent value="Bybit" forceMount={activeExchange === 'Bybit'} className="mt-0">
              <OrderBook 
                key={`orderbook-Bybit-${activeSymbol}`}
                bids={orderBook.bids} 
                asks={orderBook.asks}
                simulation={simulation}
                isConnected={activeExchange === 'Bybit' && isConnected}
              />
            </TabsContent>
            
            <TabsContent value="Deribit" forceMount={activeExchange === 'Deribit'} className="mt-0">
              <OrderBook 
                key={`orderbook-Deribit-${activeSymbol}`}
                bids={orderBook.bids} 
                asks={orderBook.asks}
                simulation={simulation}
                isConnected={activeExchange === 'Deribit' && isConnected}
              />
            </TabsContent>
            
            <DepthChart orderBook={orderBook} simulation={simulation} />
          </div>
          
          {/* Right column - Order simulation form and metrics */}
          <div className="lg:col-span-2 space-y-6">
            {simulation ? (
              <SimulationResults 
                simulation={simulation} 
                onReset={resetSimulation}
              />
            ) : (
              <OrderSimulationForm 
                form={form}
                onFormChange={(updates) => {
                  if (updates.exchange && updates.exchange !== activeExchange) {
                    handleFormExchangeChange(updates as { exchange: Exchange });
                  } else {
                    updateForm(updates);
                  }
                }}
                onSimulate={simulate}
                isProcessing={false}
              />
            )}
            
            <OrderbookImbalance orderBook={orderBook} />
          </div>
        </div>
      </Tabs>
    </div>
  );
}