"use client";

import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import { formatUnits } from "viem";
import { ScrollArea } from "./ui/scroll-area";

interface TokenBalance {
  contractAddress: string;
  balance: string;
  symbol: string;
  decimals: number;
  name: string;
}

interface TokenBalanceResponse {
  status: string;
  message: string;
  result: string;
}

async function fetchTokenBalance(
  address: string,
  contractAddress: string,
  chainId: number
): Promise<TokenBalanceResponse> {
  // Select the appropriate domain based on chainId
  const domain = chainId === 167009 
    ? 'api-hekla.taikoscan.io'
    : chainId === 167000 
      ? 'api.taikoscan.io'
      : 'api.etherscan.io';

  const apiKey = chainId === 167000 || chainId === 167009
    ? process.env.NEXT_PUBLIC_TAIKOSCAN_API_KEY
    : process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;

  const response = await fetch(
    `https://${domain}/api?module=account&action=tokenbalance&address=${address}&contractaddress=${contractAddress}&tag=latest&apikey=${apiKey}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch token balance');
  }

  return response.json();
}

// You would need to maintain a list of common tokens for each network
const NETWORK_TOKENS: Record<number, Array<{ address: string; symbol: string; decimals: number; name: string }>> = {
  1: [
    { address: '0xdac17f958d2ee523a2206206994597c13d831ec7', symbol: 'USDT', decimals: 6, name: 'Tether USD' },
    { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', symbol: 'USDC', decimals: 6, name: 'USD Coin' },
    // Add more Ethereum tokens
  ],
  167000: [
    // Add Taiko tokens
  ],
  167009: [
    // Add Taiko Hekla tokens
  ],
};

export function TokenBalances() {
  const { address, chainId } = useAccount();
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBalances() {
      if (!address || !chainId) return;

      try {
        setIsLoading(true);
        const tokens = NETWORK_TOKENS[chainId] || [];
        const balances = await Promise.all(
          tokens.map(async (token) => {
            const response = await fetchTokenBalance(address, token.address, chainId);
            return {
              contractAddress: token.address,
              balance: response.result,
              symbol: token.symbol,
              decimals: token.decimals,
              name: token.name,
            };
          })
        );

        // Filter out zero balances
        const nonZeroBalances = balances.filter(token => 
          BigInt(token.balance) > BigInt(0)
        );

        setTokenBalances(nonZeroBalances);
      } catch (error) {
        console.error("Failed to fetch token balances:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBalances();
  }, [address, chainId]);

  if (!address) {
    return (
      <div className="p-4 text-zinc-400">
        Please connect your wallet to view token balances
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-4 text-zinc-400">Loading token balances...</div>;
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <h2 className="text-lg font-semibold mb-4">Token Balances</h2>
        {tokenBalances.length === 0 ? (
          <div className="text-zinc-400">No tokens found</div>
        ) : (
          tokenBalances.map((token) => (
            <div
              key={token.contractAddress}
              className="p-4 rounded-lg bg-zinc-800/50 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-zinc-300">{token.name}</span>
                <span className="text-sm font-medium text-zinc-300">
                  {formatUnits(BigInt(token.balance), token.decimals)} {token.symbol}
                </span>
              </div>
              <div className="text-xs text-zinc-500">
                {token.contractAddress}
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
} 