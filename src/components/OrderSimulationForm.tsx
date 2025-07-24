import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/components/ui/use-toast';
import { OrderForm, Exchange, OrderType, OrderSide, DelayOption } from '@/types/orderbook';
import { getAvailableSymbols } from '@/services/orderbookService';
import { useState, useEffect } from 'react';

interface OrderSimulationFormProps {
  form: OrderForm;
  onFormChange: (updates: Partial<OrderForm>) => void;
  onSimulate: () => void;
  isProcessing: boolean;
}

const OrderSimulationForm = ({
  form,
  onFormChange,
  onSimulate,
  isProcessing
}: OrderSimulationFormProps) => {
  const { toast } = useToast();
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([]);

  // Update available symbols when exchange changes
  useEffect(() => {
    const symbols = getAvailableSymbols(form.exchange);
    setAvailableSymbols(symbols);
  }, [form.exchange]);

  const validateForm = (): boolean => {
    if (!form.symbol) {
      toast({
        title: "Symbol required",
        description: "Please select a trading symbol",
        variant: "destructive"
      });
      return false;
    }

    if (form.quantity <= 0) {
      toast({
        title: "Invalid quantity",
        description: "Quantity must be greater than zero",
        variant: "destructive"
      });
      return false;
    }

    if (form.type === 'Limit' && (!form.price || form.price <= 0)) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price for limit orders",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSimulate();
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle>Order Simulation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Exchange Selector */}
        <div className="space-y-1.5">
          <Label htmlFor="exchange">Exchange</Label>
          <Select
            value={form.exchange}
            onValueChange={(value) => onFormChange({ exchange: value as Exchange })}
          >
            <SelectTrigger id="exchange">
              <SelectValue placeholder="Select Exchange" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="OKX">OKX</SelectItem>
              <SelectItem value="Bybit">Bybit</SelectItem>
              <SelectItem value="Deribit">Deribit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Symbol Selector */}
        <div className="space-y-1.5">
          <Label htmlFor="symbol">Symbol</Label>
          <Select
            value={form.symbol}
            onValueChange={(value) => onFormChange({ symbol: value })}
          >
            <SelectTrigger id="symbol">
              <SelectValue placeholder="Select Symbol" />
            </SelectTrigger>
            <SelectContent position="popper">
              {availableSymbols.map(symbol => (
                <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Order Type */}
        <div className="space-y-1.5">
          <Label htmlFor="type">Order Type</Label>
          <RadioGroup
            id="type"
            value={form.type}
            onValueChange={(value) => onFormChange({ type: value as OrderType })}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Market" id="market" />
              <Label htmlFor="market">Market</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Limit" id="limit" />
              <Label htmlFor="limit">Limit</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Side Selector */}
        <div className="space-y-1.5">
          <Label htmlFor="side">Side</Label>
          <RadioGroup
            id="side"
            value={form.side}
            onValueChange={(value) => onFormChange({ side: value as OrderSide })}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Buy" id="buy" />
              <Label htmlFor="buy" className="text-green-600">Buy</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Sell" id="sell" />
              <Label htmlFor="sell" className="text-red-600">Sell</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Price Input - Only for Limit Orders */}
        {form.type === 'Limit' && (
          <div className="space-y-1.5">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter limit price"
              value={form.price || ''}
              onChange={(e) => onFormChange({ price: parseFloat(e.target.value) || null })}
            />
          </div>
        )}

        {/* Quantity Input */}
        <div className="space-y-1.5">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            step="0.001"
            min="0.001"
            placeholder="Enter quantity"
            value={form.quantity}
            onChange={(e) => onFormChange({ quantity: parseFloat(e.target.value) || 0 })}
          />
        </div>

        {/* Timing Controls */}
        <div className="space-y-1.5">
          <Label htmlFor="delay">Timing Simulation</Label>
          <Select
            value={form.delay}
            onValueChange={(value) => onFormChange({ delay: value as DelayOption })}
          >
            <SelectTrigger id="delay">
              <SelectValue placeholder="Select Timing" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="immediate">Immediate</SelectItem>
              <SelectItem value="5s">5s Delay</SelectItem>
              <SelectItem value="10s">10s Delay</SelectItem>
              <SelectItem value="30s">30s Delay</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSubmit}
          className="w-full"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></span>
              Processing...
            </>
          ) : (
            'Simulate Order'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default OrderSimulationForm;