'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface TokenLaunch {
  id: string;
  name: string;
  symbol: string;
  launchTime: Date;
  initialPrice: number;
  currentPrice: number;
  timeRemaining: number;
  totalVolume: number;
  upBets: number;
  downBets: number;
  status: 'upcoming' | 'active' | 'settled';
}

interface UserPosition {
  tokenId: string;
  direction: 'up' | 'down';
  amount: number;
  odds: number;
}

export default function PredictionMarket() {
  const [tokens, setTokens] = useState<TokenLaunch[]>([
    {
      id: '1',
      name: 'DeFi Token',
      symbol: 'DFT',
      launchTime: new Date(Date.now() + 300000), // 5 minutes from now
      initialPrice: 0.001,
      currentPrice: 0.0012,
      timeRemaining: 3420, // seconds
      totalVolume: 15000,
      upBets: 8500,
      downBets: 6500,
      status: 'active'
    },
    {
      id: '2',
      name: 'Gaming Token',
      symbol: 'GMT',
      launchTime: new Date(Date.now() + 1800000), // 30 minutes from now
      initialPrice: 0.005,
      currentPrice: 0.005,
      timeRemaining: 0,
      totalVolume: 0,
      upBets: 0,
      downBets: 0,
      status: 'upcoming'
    }
  ]);

  const [userBalance, setUserBalance] = useState(1000);
  const [userPositions, setUserPositions] = useState<UserPosition[]>([]);
  const [betAmount, setBetAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<string>('');

  useEffect(() => {
    // Simulate real-time price updates
    const interval = setInterval(() => {
      setTokens(prev => prev.map(token => {
        if (token.status === 'active') {
          const priceChange = (Math.random() - 0.5) * 0.0001;
          return {
            ...token,
            currentPrice: Math.max(0.0001, token.currentPrice + priceChange),
            timeRemaining: Math.max(0, token.timeRemaining - 1)
          };
        }
        return token;
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateOdds = (upBets: number, downBets: number, direction: 'up' | 'down') => {
    const total = upBets + downBets;
    if (total === 0) return 2.0;
    
    if (direction === 'up') {
      return total / upBets || 2.0;
    } else {
      return total / downBets || 2.0;
    }
  };

  const placeBet = (tokenId: string, direction: 'up' | 'down') => {
    const amount = parseFloat(betAmount);
    if (!amount || amount <= 0 || amount > userBalance) return;

    const token = tokens.find(t => t.id === tokenId);
    if (!token || token.status !== 'active') return;

    const odds = calculateOdds(token.upBets, token.downBets, direction);
    
    // Update user balance and positions
    setUserBalance(prev => prev - amount);
    setUserPositions(prev => [...prev, {
      tokenId,
      direction,
      amount,
      odds
    }]);

    // Update token betting data
    setTokens(prev => prev.map(t => {
      if (t.id === tokenId) {
        return {
          ...t,
          totalVolume: t.totalVolume + amount,
          upBets: direction === 'up' ? t.upBets + amount : t.upBets,
          downBets: direction === 'down' ? t.downBets + amount : t.downBets
        };
      }
      return t;
    }));

    setBetAmount('');
  };

  const getPriceChange = (token: TokenLaunch) => {
    const change = ((token.currentPrice - token.initialPrice) / token.initialPrice) * 100;
    return change;
  };

  return (
    <div className="space-y-6">
      {/* User Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Your Account</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Balance</p>
              <p className="text-2xl font-bold">{userBalance.toFixed(2)} TEST</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Positions</p>
              <p className="text-2xl font-bold">{userPositions.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Markets */}
      <div className="grid gap-6">
        {tokens.map(token => (
          <Card key={token.id} className="relative">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {token.name} ({token.symbol})
                    <Badge variant={
                      token.status === 'active' ? 'default' : 
                      token.status === 'upcoming' ? 'secondary' : 'outline'
                    }>
                      {token.status}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Launch: {token.launchTime.toLocaleTimeString()}
                  </p>
                </div>
                {token.status === 'active' && (
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Time Remaining</p>
                    <p className="text-xl font-mono font-bold">
                      {formatTime(token.timeRemaining)}
                    </p>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Price Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Initial Price</p>
                  <p className="font-bold">${token.initialPrice.toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Price</p>
                  <p className="font-bold">${token.currentPrice.toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Change</p>
                  <p className={`font-bold ${getPriceChange(token) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {getPriceChange(token) >= 0 ? '+' : ''}{getPriceChange(token).toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Betting Pool */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>UP: {token.upBets.toFixed(0)} TEST</span>
                  <span>DOWN: {token.downBets.toFixed(0)} TEST</span>
                </div>
                <Progress 
                  value={token.upBets / (token.upBets + token.downBets || 1) * 100} 
                  className="h-2"
                />
                <p className="text-sm text-gray-600 text-center">
                  Total Volume: {token.totalVolume.toFixed(0)} TEST
                </p>
              </div>

              {/* Betting Interface */}
              {token.status === 'active' && (
                <div className="border-t pt-4 space-y-3">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Bet amount"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => placeBet(token.id, 'up')}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={!betAmount || parseFloat(betAmount) <= 0}
                    >
                      BET UP
                      <span className="ml-2 text-xs">
                        {calculateOdds(token.upBets, token.downBets, 'up').toFixed(2)}x
                      </span>
                    </Button>
                    <Button
                      onClick={() => placeBet(token.id, 'down')}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={!betAmount || parseFloat(betAmount) <= 0}
                    >
                      BET DOWN
                      <span className="ml-2 text-xs">
                        {calculateOdds(token.upBets, token.downBets, 'down').toFixed(2)}x
                      </span>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User Positions */}
      {userPositions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {userPositions.map((position, index) => {
                const token = tokens.find(t => t.id === position.tokenId);
                return (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{token?.symbol}</span>
                      <Badge 
                        variant={position.direction === 'up' ? 'default' : 'destructive'}
                        className="ml-2"
                      >
                        {position.direction.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{position.amount} TEST</p>
                      <p className="text-sm text-gray-600">{position.odds.toFixed(2)}x odds</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
