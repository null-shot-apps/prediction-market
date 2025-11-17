// Testnet Token for Prediction Market Participation
// This simulates a blockchain token for demo purposes

export interface TokenBalance {
  address: string;
  balance: number;
  symbol: string;
  decimals: number;
}

export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  type: 'transfer' | 'mint' | 'bet' | 'payout';
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
}

export class TestnetToken {
  private symbol: string;
  private name: string;
  private decimals: number;
  private totalSupply: number;
  private balances: Map<string, number> = new Map();
  private transactions: Transaction[] = [];
  private allowances: Map<string, Map<string, number>> = new Map();

  constructor(
    name: string = 'Prediction Market Test Token',
    symbol: string = 'TEST',
    decimals: number = 18,
    initialSupply: number = 1000000
  ) {
    this.name = name;
    this.symbol = symbol;
    this.decimals = decimals;
    this.totalSupply = initialSupply;
    
    // Initialize with some test accounts
    this.initializeTestAccounts();
  }

  /**
   * Get token information
   */
  getTokenInfo() {
    return {
      name: this.name,
      symbol: this.symbol,
      decimals: this.decimals,
      totalSupply: this.totalSupply
    };
  }

  /**
   * Get balance for an address
   */
  balanceOf(address: string): number {
    return this.balances.get(address) || 0;
  }

  /**
   * Transfer tokens between addresses
   */
  async transfer(from: string, to: string, amount: number): Promise<Transaction> {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    const fromBalance = this.balanceOf(from);
    if (fromBalance < amount) {
      throw new Error('Insufficient balance');
    }

    // Create transaction
    const transaction: Transaction = {
      id: this.generateTransactionId(),
      from,
      to,
      amount,
      type: 'transfer',
      timestamp: Date.now(),
      status: 'pending'
    };

    // Simulate network delay
    await this.simulateNetworkDelay();

    try {
      // Update balances
      this.balances.set(from, fromBalance - amount);
      this.balances.set(to, this.balanceOf(to) + amount);

      transaction.status = 'confirmed';
      this.transactions.push(transaction);

      return transaction;
    } catch (error) {
      transaction.status = 'failed';
      this.transactions.push(transaction);
      throw error;
    }
  }

  /**
   * Mint new tokens (for testing purposes)
   */
  async mint(to: string, amount: number): Promise<Transaction> {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    const transaction: Transaction = {
      id: this.generateTransactionId(),
      from: '0x0000000000000000000000000000000000000000',
      to,
      amount,
      type: 'mint',
      timestamp: Date.now(),
      status: 'pending'
    };

    await this.simulateNetworkDelay();

    try {
      this.balances.set(to, this.balanceOf(to) + amount);
      this.totalSupply += amount;

      transaction.status = 'confirmed';
      this.transactions.push(transaction);

      return transaction;
    } catch (error) {
      transaction.status = 'failed';
      this.transactions.push(transaction);
      throw error;
    }
  }

  /**
   * Approve spending allowance
   */
  async approve(owner: string, spender: string, amount: number): Promise<boolean> {
    if (!this.allowances.has(owner)) {
      this.allowances.set(owner, new Map());
    }
    
    this.allowances.get(owner)!.set(spender, amount);
    return true;
  }

  /**
   * Get spending allowance
   */
  allowance(owner: string, spender: string): number {
    return this.allowances.get(owner)?.get(spender) || 0;
  }

  /**
   * Transfer from allowance
   */
  async transferFrom(spender: string, from: string, to: string, amount: number): Promise<Transaction> {
    const allowedAmount = this.allowance(from, spender);
    if (allowedAmount < amount) {
      throw new Error('Insufficient allowance');
    }

    const transaction = await this.transfer(from, to, amount);
    
    // Reduce allowance
    this.allowances.get(from)!.set(spender, allowedAmount - amount);
    
    return transaction;
  }

  /**
   * Get transaction history for an address
   */
  getTransactionHistory(address: string): Transaction[] {
    return this.transactions.filter(tx => 
      tx.from === address || tx.to === address
    ).sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get all transactions
   */
  getAllTransactions(): Transaction[] {
    return [...this.transactions].sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Faucet - get free test tokens
   */
  async faucet(address: string): Promise<Transaction> {
    const faucetAmount = 100; // 100 TEST tokens
    const lastFaucet = this.getLastFaucetTime(address);
    const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours

    if (lastFaucet && Date.now() - lastFaucet < cooldownPeriod) {
      throw new Error('Faucet cooldown active. Try again later.');
    }

    return await this.mint(address, faucetAmount);
  }

  private initializeTestAccounts() {
    // Create some test accounts with initial balances
    const testAccounts = [
      { address: '0x1234567890123456789012345678901234567890', balance: 1000 },
      { address: '0x2345678901234567890123456789012345678901', balance: 500 },
      { address: '0x3456789012345678901234567890123456789012', balance: 750 }
    ];

    testAccounts.forEach(account => {
      this.balances.set(account.address, account.balance);
    });
  }

  private generateTransactionId(): string {
    return '0x' + Math.random().toString(16).substr(2, 64);
  }

  private async simulateNetworkDelay(): Promise<void> {
    const delay = Math.random() * 2000 + 500; // 0.5-2.5 seconds
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  private getLastFaucetTime(address: string): number | null {
    const faucetTxs = this.transactions.filter(tx => 
      tx.to === address && 
      tx.type === 'mint' && 
      tx.amount === 100
    );
    
    if (faucetTxs.length === 0) return null;
    return Math.max(...faucetTxs.map(tx => tx.timestamp));
  }
}

// Prediction Market Token Contract
export class PredictionMarketContract {
  private token: TestnetToken;
  private markets: Map<string, PredictionMarket> = new Map();
  private userPositions: Map<string, UserPosition[]> = new Map();

  constructor(token: TestnetToken) {
    this.token = token;
  }

  /**
   * Create a new prediction market
   */
  async createMarket(
    tokenSymbol: string,
    launchTime: number,
    duration: number = 3600000 // 1 hour default
  ): Promise<string> {
    const marketId = this.generateMarketId();
    
    const market: PredictionMarket = {
      id: marketId,
      tokenSymbol,
      launchTime,
      endTime: launchTime + duration,
      totalUpBets: 0,
      totalDownBets: 0,
      status: 'active',
      settled: false,
      winner: null
    };

    this.markets.set(marketId, market);
    return marketId;
  }

  /**
   * Place a bet on a market
   */
  async placeBet(
    marketId: string,
    userAddress: string,
    direction: 'up' | 'down',
    amount: number
  ): Promise<string> {
    const market = this.markets.get(marketId);
    if (!market) {
      throw new Error('Market not found');
    }

    if (market.status !== 'active') {
      throw new Error('Market is not active');
    }

    if (Date.now() > market.endTime) {
      throw new Error('Market has ended');
    }

    // Transfer tokens to contract
    await this.token.transfer(
      userAddress,
      'contract',
      amount
    );

    // Update market totals
    if (direction === 'up') {
      market.totalUpBets += amount;
    } else {
      market.totalDownBets += amount;
    }

    // Record user position
    const position: UserPosition = {
      id: this.generatePositionId(),
      marketId,
      userAddress,
      direction,
      amount,
      odds: this.calculateOdds(market, direction),
      timestamp: Date.now()
    };

    if (!this.userPositions.has(userAddress)) {
      this.userPositions.set(userAddress, []);
    }
    this.userPositions.get(userAddress)!.push(position);

    return position.id;
  }

  /**
   * Settle a market
   */
  async settleMarket(marketId: string, winner: 'up' | 'down'): Promise<void> {
    const market = this.markets.get(marketId);
    if (!market) {
      throw new Error('Market not found');
    }

    if (market.settled) {
      throw new Error('Market already settled');
    }

    market.winner = winner;
    market.settled = true;
    market.status = 'settled';

    // Pay out winners
    await this.payoutWinners(marketId);
  }

  /**
   * Get user positions
   */
  getUserPositions(userAddress: string): UserPosition[] {
    return this.userPositions.get(userAddress) || [];
  }

  /**
   * Get market info
   */
  getMarket(marketId: string): PredictionMarket | undefined {
    return this.markets.get(marketId);
  }

  private calculateOdds(market: PredictionMarket, direction: 'up' | 'down'): number {
    const total = market.totalUpBets + market.totalDownBets;
    if (total === 0) return 2.0;

    if (direction === 'up') {
      return total / (market.totalUpBets || 1);
    } else {
      return total / (market.totalDownBets || 1);
    }
  }

  private async payoutWinners(marketId: string): Promise<void> {
    const market = this.markets.get(marketId);
    if (!market || !market.winner) return;

    const totalPool = market.totalUpBets + market.totalDownBets;
    const winningPool = market.winner === 'up' ? market.totalUpBets : market.totalDownBets;

    // Find all winning positions
    for (const [userAddress, positions] of this.userPositions.entries()) {
      const winningPositions = positions.filter(p => 
        p.marketId === marketId && p.direction === market.winner
      );

      for (const position of winningPositions) {
        const payout = (position.amount / winningPool) * totalPool;
        await this.token.transfer('contract', userAddress, payout);
      }
    }
  }

  private generateMarketId(): string {
    return 'market_' + Math.random().toString(36).substr(2, 9);
  }

  private generatePositionId(): string {
    return 'pos_' + Math.random().toString(36).substr(2, 9);
  }
}

interface PredictionMarket {
  id: string;
  tokenSymbol: string;
  launchTime: number;
  endTime: number;
  totalUpBets: number;
  totalDownBets: number;
  status: 'active' | 'ended' | 'settled';
  settled: boolean;
  winner: 'up' | 'down' | null;
}

interface UserPosition {
  id: string;
  marketId: string;
  userAddress: string;
  direction: 'up' | 'down';
  amount: number;
  odds: number;
  timestamp: number;
}

// Export default instances
export const testToken = new TestnetToken();
export const predictionContract = new PredictionMarketContract(testToken);
