"use client";

import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import { formatEther } from "viem";
import { ScrollArea } from "./ui/scroll-area";
import { EtherscanProvider, Networkish } from "ethers";

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  isError: string;
  functionName: string;
}

interface TaikoApiResponse {
  status: string;
  message: string;
  result: Transaction[];
}

class MyEtherscanProvider extends EtherscanProvider {
  constructor(networkish: Networkish, apiKey?: string) {
    super(networkish, apiKey);
  }

  async getHistory(
    address: string,
    startBlock?: number,
    endBlock?: number
  ): Promise<Array<any>> {
    const params = {
      action: "txlist",
      address,
      startblock: startBlock ?? 0,
      endblock: endBlock ?? 99999999,
      sort: "desc", // Changed to desc to get latest first
    };

    return this.fetch("account", params);
  }
}

async function fetchTaikoTransactions(
  address: string,
  chainId: number
): Promise<Transaction[]> {
  // Select the appropriate domain based on chainId
  const domain =
    chainId === 167009 ? "api-hekla.taikoscan.io" : "api.taikoscan.io";

  const response = await fetch(
    `https://${domain}/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=50&sort=desc&apikey=${process.env.NEXT_PUBLIC_TAIKOSCAN_API_KEY}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch from Taiko API");
  }

  const data: TaikoApiResponse = await response.json();
  return data.result;
}

export function TransactionHistory() {
  const { address, chainId } = useAccount();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTransactions() {
      if (!address) return;

      try {
        setIsLoading(true);
        let txs: Transaction[];

        // Check if the network is either Taiko or Taiko Hekla
        if (chainId === 167000 || chainId === 167009) {
          txs = await fetchTaikoTransactions(address, chainId);
        } else {
          const provider = new MyEtherscanProvider(
            chainId || 1,
            process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY
          );
          txs = await provider.getHistory(address);
        }

        setTransactions(txs.slice(0, 50));
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTransactions();
  }, [address, chainId]);

  if (!address) {
    return (
      <div className="p-4 text-zinc-400">
        Please connect your wallet to view transaction history
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-4 text-zinc-400">Loading transactions...</div>;
  }

  const getExplorerUrl = (hash: string) => {
    // Update explorer URLs based on chainId
    if (chainId === 167000) {
      return `https://explorer.test.taiko.xyz/tx/${hash}`;
    } else if (chainId === 167009) {
      return `https://explorer.hekla.taiko.xyz/tx/${hash}`;
    }
    return `https://etherscan.io/tx/${hash}`;
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <h2 className="text-lg font-semibold mb-4">Transaction History</h2>
        {transactions.length === 0 ? (
          <div className="text-zinc-400">No transactions found</div>
        ) : (
          transactions.map((tx) => (
            <div
              key={tx.hash}
              className={`p-4 rounded-lg ${
                tx.isError === "1" ? "bg-red-900/20" : "bg-zinc-800/50"
              } space-y-2`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono text-zinc-400">
                  {new Date(Number(tx.timeStamp) * 1000).toLocaleString()}
                </span>
                <span className="text-sm font-medium text-zinc-300">
                  {formatEther(BigInt(tx.value))} ETH
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-xs">
                  <span className="text-zinc-500">From: </span>
                  <span className="font-mono text-zinc-300">{tx.from}</span>
                </div>
                <div className="text-xs">
                  <span className="text-zinc-500">To: </span>
                  <span className="font-mono text-zinc-300">{tx.to}</span>
                </div>
                {tx.functionName && (
                  <div className="text-xs">
                    <span className="text-zinc-500">Function: </span>
                    <span className="font-mono text-zinc-300">
                      {tx.functionName}
                    </span>
                  </div>
                )}
                <div className="text-xs">
                  <span className="text-zinc-500">Hash: </span>
                  <a
                    href={getExplorerUrl(tx.hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-blue-400 hover:text-blue-300"
                  >
                    {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
}
