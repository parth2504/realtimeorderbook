# Real-Time Orderbook Viewer

A real-time cryptocurrency orderbook viewer with order simulation capabilities across multiple exchanges.

## Technology Stack

- **Frontend Framework**: React + TypeScript with Vite
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **WebSocket Management**: Custom WebSocket service
- **State Management**: React hooks and context
- **Data Visualization**: Canvas-based depth chart

## Key Features

- Real-time orderbook data streaming
- Multi-exchange support (OKX, Bybit, Deribit)
- Order simulation with market impact analysis
- Depth chart visualization
- Price spread indicators
- Option chain style interface
- Dark/Light theme support

## Exchange WebSocket APIs

### Supported Exchanges

1. **OKX**
   - WebSocket URL: `wss://ws.okx.com:8443/ws/v5/public`
   - Channel: `books`
   - Rate Limit: 30 requests per second
   - Documentation: [OKX API docs](https://www.okx.com/docs-v5/en/)

2. **Bybit**
   - WebSocket URL: `wss://stream.bybit.com/v5/public/spot`
   - Channel: `orderbook.50`
   - Rate Limit: 20 requests per second
   - Documentation: [Bybit API docs](https://bybit-exchange.github.io/docs/v5/ws/connect)

3. **Deribit**
   - WebSocket URL: `wss://www.deribit.com/ws/api/v2`
   - Channel: `book.{symbol}.none.20.100ms`
   - Rate Limit: 10 requests per second
   - Documentation: [Deribit API docs](https://docs.deribit.com/)

## Architecture

### WebSocket Service
- Custom WebSocket management with automatic reconnection
- Connection attempt limits: 5 retries
- Message throttling: 300ms
- Supports multiple exchange protocols
- Automatic message parsing and normalization

### Data Processing
- Price level aggregation with 15-unit intervals
- Real-time data smoothing and interpolation
- Depth calculation up to 25 levels
- Volume-weighted average price calculations

## Rate Limiting Considerations

1. **WebSocket Connections**
   - Maximum reconnection attempts: 5
   - Reconnection delay: Progressive backoff
   - Connection timeout: 10 seconds

2. **Data Updates**
   - Update throttle: 300ms
   - Animation frame rate: 60fps
   - Batch processing for large updates

3. **Order Simulation**
   - Maximum orders: No limit
   - Update frequency: Real-time
   - Price level calculations: 25 levels deep

## Assumptions

1. **Market Data**
   - Price movements follow 15-unit intervals
   - Bid/Ask spreads are generally small
   - Volume distribution is roughly normal

2. **Network Conditions**
   - Stable WebSocket connections
   - Latency < 1000ms
   - Sufficient bandwidth for real-time data

3. **User Interface**
   - Desktop-first design
   - Modern browser support
   - Hardware acceleration available

## Performance Optimizations

1. **Data Management**
   - Debounced updates
   - Memoized calculations
   - Progressive loading

2. **Rendering**
   - RequestAnimationFrame for smooth animations
   - CSS transitions for UI updates
   - Virtual scrolling for large datasets

3. **Memory**
   - Circular buffer for historical data
   - Garbage collection optimization
   - Event listener cleanup

## Environment Variables

```env
VITE_WS_RECONNECT_INTERVAL=5000
VITE_MAX_RECONNECT_ATTEMPTS=5
VITE_UPDATE_THROTTLE=300
```

## Commands

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)

## Known Limitations

1. WebSocket reconnection may fail in unstable networks
2. Large price movements may cause visual artifacts
3. Historical data is not persisted
4. Limited mobile optimization

## Future Improvements

1. Add historical data persistence
2. Implement WebSocket connection pooling
3. Add more exchange integrations
4. Improve mobile responsiveness
5. Add trading capabilities
6. Implement server-side aggregation

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
