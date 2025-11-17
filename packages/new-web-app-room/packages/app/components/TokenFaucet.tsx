'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { testToken } from '@/lib/testnet-token';

export default function TokenFaucet() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [balance, setBalance] = useState(0);

  const handleFaucet = async () => {
    if (!address) {
      setMessage('Please enter a wallet address');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const transaction = await testToken.faucet(address);
      setMessage(`Success! Sent 100 TEST tokens. TX: ${transaction.id.slice(0, 10)}...`);
      setBalance(testToken.balanceOf(address));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Faucet failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckBalance = () => {
    if (!address) {
      setMessage('Please enter a wallet address');
      return;
    }
    
    const userBalance = testToken.balanceOf(address);
    setBalance(userBalance);
    setMessage(`Balance: ${userBalance} TEST`);
  };

  const generateTestAddress = () => {
    const randomAddress = '0x' + Math.random().toString(16).substr(2, 40);
    setAddress(randomAddress);
    setMessage('Generated test address');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🚰 Token Faucet
          <Badge variant="secondary">Testnet</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">
            Get free TEST tokens to participate in prediction markets
          </p>
          <div className="space-y-2">
            <Input
              placeholder="Enter wallet address (0x...)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="font-mono text-sm"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleFaucet}
                disabled={loading || !address}
                className="flex-1"
              >
                {loading ? 'Sending...' : 'Get 100 TEST'}
              </Button>
              <Button
                onClick={handleCheckBalance}
                variant="outline"
                disabled={!address}
              >
                Check Balance
              </Button>
            </div>
            <Button
              onClick={generateTestAddress}
              variant="ghost"
              size="sm"
              className="w-full"
            >
              Generate Test Address
            </Button>
          </div>
        </div>

        {balance > 0 && (
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-green-800">
              Balance: {balance} TEST
            </p>
          </div>
        )}

        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.includes('Success') || message.includes('Balance:')
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}>
            {message}
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Faucet cooldown: 24 hours</p>
          <p>• Amount per request: 100 TEST</p>
          <p>• Use for prediction market betting</p>
        </div>
      </CardContent>
    </Card>
  );
}
