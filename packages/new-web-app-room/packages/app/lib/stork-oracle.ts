// Stork Oracle Integration
// Documentation: https://www.stork.network/
// GitHub: https://github.com/Stork-Oracle

export interface StorkPriceData {
  symbol: string;
  price: number;
  timestamp: number;
  confidence: number;
  source: string;
}

export interface StorkOracleConfig {
  apiKey?: string;
  network: 'mainnet' | 'testnet';
  endpoint: string;
}

export class StorkOracle {
  private config: StorkOracleConfig;
  private priceCache: Map<string, StorkPriceData> = new Map();
  private subscribers: Map<string, ((data: StorkPriceData) => void)[]> = new Map();

  constructor(config: StorkOracleConfig) {
    this.config = {
      ...config,
      endpoint: config.endpoint || 'https://api.stork.network/v1'
    };
  }

  /**
   * Get current price for a token
   */
  async getPrice(symbol: string): Promise<StorkPriceData | null> {
    try {
      // In a real implementation, this would call the Stork API
      // For demo purposes, we'll simulate price data
      const mockPrice = this.generateMockPrice(symbol);
      
      this.priceCache.set(symbol, mockPrice);
      this.notifySubscribers(symbol, mockPrice);
      
      return mockPrice;
    } catch (error) {
      console.error('Failed to fetch price from Stork Oracle:', error);
      return null;
    }
  }

  /**
   * Subscribe to real-time price updates
   */
  subscribe(symbol: string, callback: (data: StorkPriceData) => void): () => void {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, []);
    }
    
    this.subscribers.get(symbol)!.push(callback);
    
    // Start price feed for this symbol
    this.startPriceFeed(symbol);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(symbol) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get historical price data for settlement
   */
  async getHistoricalPrice(symbol: string, timestamp: number): Promise<StorkPriceData | null> {
    try {
      // In production, this would query historical data from Stork
      const mockHistoricalPrice = this.generateMockPrice(symbol, timestamp);
      return mockHistoricalPrice;
    } catch (error) {
      console.error('Failed to fetch historical price:', error);
      return null;
    }
  }

  /**
   * Verify price data authenticity (cryptographic verification)
   */
  async verifyPriceData(data: StorkPriceData): Promise<boolean> {
    try {
      // In production, this would verify cryptographic signatures
      // Stork provides signed price data for tamper-proof verification
      return data.confidence > 0.95 && data.timestamp > 0;
    } catch (error) {
      console.error('Failed to verify price data:', error);
      return false;
    }
  }

  /**
   * Get multiple token prices in batch
   */
  async getBatchPrices(symbols: string[]): Promise<Map<string, StorkPriceData>> {
    const results = new Map<string, StorkPriceData>();
    
    try {
      // In production, this would be a single batch API call
      const promises = symbols.map(symbol => this.getPrice(symbol));
      const prices = await Promise.all(promises);
      
      symbols.forEach((symbol, index) => {
        if (prices[index]) {
          results.set(symbol, prices[index]);
        }
      });
    } catch (error) {
      console.error('Failed to fetch batch prices:', error);
    }
    
    return results;
  }

  private generateMockPrice(symbol: string, timestamp?: number): StorkPriceData {
    const basePrice = this.getBasePriceForSymbol(symbol);
    const volatility = 0.05; // 5% volatility
    const randomChange = (Math.random() - 0.5) * 2 * volatility;
    const price = basePrice * (1 + randomChange);
    
    return {
      symbol,
      price: Math.max(0.0001, price),
      timestamp: timestamp || Date.now(),
      confidence: 0.98 + Math.random() * 0.02, // 98-100% confidence
      source: 'stork-oracle'
    };
  }

  private getBasePriceForSymbol(symbol: string): number {
    const basePrices: Record<string, number> = {
      'DFT': 0.001,
      'GMT': 0.005,
      'TEST': 1.0,
      'ETH': 2000,
      'BTC': 45000
    };
    
    return basePrices[symbol] || 0.001;
  }

  private startPriceFeed(symbol: string) {
    // Simulate real-time price updates every 2 seconds
    const interval = setInterval(async () => {
      const callbacks = this.subscribers.get(symbol);
      if (!callbacks || callbacks.length === 0) {
        clearInterval(interval);
        return;
      }
      
      const priceData = await this.getPrice(symbol);
      if (priceData) {
        this.notifySubscribers(symbol, priceData);
      }
    }, 2000);
  }

  private notifySubscribers(symbol: string, data: StorkPriceData) {
    const callbacks = this.subscribers.get(symbol) || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in price update callback:', error);
      }
    });
  }
}

// Default Stork Oracle instance for testnet
export const storkOracle = new StorkOracle({
  network: 'testnet',
  endpoint: 'https://api.stork.network/v1'
});

// Settlement utilities
export class PredictionSettlement {
  private oracle: StorkOracle;

  constructor(oracle: StorkOracle) {
    this.oracle = oracle;
  }

  /**
   * Settle a prediction market based on price movement
   */
  async settlePrediction(
    symbol: string,
    launchTime: number,
    settlementTime: number,
    direction: 'up' | 'down'
  ): Promise<{ won: boolean; initialPrice: number; finalPrice: number; change: number }> {
    try {
      // Get prices at launch and settlement times
      const initialPrice = await this.oracle.getHistoricalPrice(symbol, launchTime);
      const finalPrice = await this.oracle.getHistoricalPrice(symbol, settlementTime);

      if (!initialPrice || !finalPrice) {
        throw new Error('Failed to get price data for settlement');
      }

      // Verify price data authenticity
      const initialValid = await this.oracle.verifyPriceData(initialPrice);
      const finalValid = await this.oracle.verifyPriceData(finalPrice);

      if (!initialValid || !finalValid) {
        throw new Error('Price data verification failed');
      }

      const priceChange = finalPrice.price - initialPrice.price;
      const percentChange = (priceChange / initialPrice.price) * 100;

      let won = false;
      if (direction === 'up' && priceChange > 0) {
        won = true;
      } else if (direction === 'down' && priceChange < 0) {
        won = true;
      }

      return {
        won,
        initialPrice: initialPrice.price,
        finalPrice: finalPrice.price,
        change: percentChange
      };
    } catch (error) {
      console.error('Settlement failed:', error);
      throw error;
    }
  }

  /**
   * Calculate payout for winning predictions
   */
  calculatePayout(
    betAmount: number,
    odds: number,
    won: boolean
  ): number {
    if (!won) return 0;
    return betAmount * odds;
  }
}
