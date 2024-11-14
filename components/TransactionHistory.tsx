"use client";

import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import { formatEther } from "viem";
import { ScrollArea } from "./ui/scroll-area";
import { EtherscanProvider, Networkish } from "ethers";
import {
  X,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { useStore } from "@/store/store";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "./ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CHAINID_TO_CHAINNAME } from "./TokenBalances";

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  isError: string;
  functionName: string;
  type: "sent" | "received";
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

// Add dummy transaction data
const DUMMY_TRANSACTIONS: Transaction[] = [
  {
    hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    from: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    to: "0x123d35Cc6634C0532925a3b844Bc454e4438f123",
    value: "1000000000000000000", // 1 ETH
    timeStamp: (Date.now() / 1000 - 3600).toString(), // 1 hour ago
    isError: "0",
    functionName: "transfer",
    type: "sent",
  },
  {
    hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    from: "0x123d35Cc6634C0532925a3b844Bc454e4438f123",
    to: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    value: "500000000000000000", // 0.5 ETH
    timeStamp: (Date.now() / 1000 - 7200).toString(), // 2 hours ago
    isError: "0",
    functionName: "swap",
    type: "received",
  },
  {
    hash: "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
    from: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    to: "0x456d35Cc6634C0532925a3b844Bc454e4438f456",
    value: "100000000000000000", // 0.1 ETH
    timeStamp: (Date.now() / 1000 - 86400).toString(), // 1 day ago
    isError: "1", // Failed transaction
    functionName: "approve",
    type: "sent",
  },
  {
    hash: "0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
    from: "0x456d35Cc6634C0532925a3b844Bc454e4438f456",
    to: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    value: "2000000000000000000", // 2 ETH
    timeStamp: (Date.now() / 1000 - 172800).toString(), // 2 days ago
    isError: "0",
    functionName: "bridge",
    type: "received",
  },
  {
    hash: "0x5432109876fedcba5432109876fedcba5432109876fedcba5432109876fedcba",
    from: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    to: "0x789d35Cc6634C0532925a3b844Bc454e4438f789",
    value: "300000000000000000", // 0.3 ETH
    timeStamp: (Date.now() / 1000 - 259200).toString(), // 3 days ago
    isError: "0",
    functionName: "stake",
    type: "sent",
  },
];

export function TransactionHistory() {
  const { address, chainId } = useAccount();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { reset } = useStore();

  const ITEMS_PER_PAGE = 3;

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!address) return;

      try {
        setIsLoading(true);

        const options = {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_GOLDRUSH_API_KEY}`,
          },
        };

        const response = await fetch(
          `https://api.covalenthq.com/v1/${
            CHAINID_TO_CHAINNAME[chainId!]
          }/address/${address}/transactions_v3/`,
          options
        );

        const data = await response.json();

        const transactions = (data.data?.items || [])
          // Filter transactions where address is either sender or receiver
          .filter(
            (tx: any) =>
              tx.from_address?.toLowerCase() === address.toLowerCase() ||
              tx.to_address?.toLowerCase() === address.toLowerCase()
          )
          .map((tx: any) => {
            const relevantLog = tx.log_events?.find(
              (log: any) =>
                log.decoded?.name && !log.decoded.name.includes("Metadata")
            );

            return {
              hash: tx.tx_hash,
              from: tx.from_address,
              to: tx.to_address || "",
              value: tx.value?.toString() || "0",
              timeStamp: new Date(tx.block_signed_at).getTime().toString(),
              isError: tx.successful ? "0" : "1",
              functionName: relevantLog?.decoded?.name || "Transfer",
              // Add type to easily determine direction in UI
              type:
                tx.from_address?.toLowerCase() === address.toLowerCase()
                  ? "sent"
                  : "received",
            };
          });

        setTransactions(transactions);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [address, chainId]);

  const filteredTransactions = transactions.filter(
    (tx) =>
      tx.functionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.to.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (!address) {
    return (
      <div className="p-8 text-center space-y-4 bg-black/20 backdrop-blur-lg rounded-xl border border-white/[0.02] relative">
        <button
          onClick={reset}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-white/[0.02] border border-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.05] transition-all duration-200 group"
        >
          <X className="h-4 w-4 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
        </button>
        <div className="text-zinc-400">
          Please connect your wallet to view transaction history
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center space-y-4 bg-black/20 backdrop-blur-lg rounded-xl border border-white/[0.02] relative">
        <button
          onClick={reset}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-white/[0.02] border border-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.05] transition-all duration-200 group"
        >
          <X className="h-4 w-4 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
        </button>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full mx-auto"
        />
        <div className="text-zinc-400">Loading transactions...</div>
      </div>
    );
  }
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-950/30 to-purple-950/30 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/10 shadow-lg relative"
        >
          <button
            onClick={reset}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/[0.02] border border-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.05] transition-all duration-200 group"
          >
            <X className="h-4 w-4 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
          </button>
          <h2 className="text-lg font-semibold mb-2 text-zinc-200 flex items-center gap-2">
            <History className="h-5 w-5 text-blue-400" />
            Transaction History
          </h2>
          <div className="text-sm text-zinc-400">
            {filteredTransactions.length} transactions found
          </div>
        </motion.div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/[0.02] border-white/[0.02] text-zinc-200 placeholder:text-zinc-500 focus:border-blue-500/20"
          />
        </div>

        {/* Transactions List */}
        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {paginatedTransactions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-zinc-400 bg-white/[0.02] backdrop-blur-sm rounded-xl p-4 border border-white/[0.02] text-center"
              >
                {searchQuery
                  ? "No transactions found matching your search"
                  : "No transactions found"}
              </motion.div>
            ) : (
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {paginatedTransactions.map((tx, index) => (
                  <motion.div
                    key={tx.hash}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                    <div
                      className={`relative p-4 rounded-xl backdrop-blur-md border transition-all duration-300
                      ${
                        tx.isError === "1"
                          ? "bg-red-950/20 border-red-500/20 hover:border-red-500/40"
                          : "bg-white/[0.02] border-white/[0.02] hover:border-blue-500/20"
                      }`}
                    >
                      {/* Transaction Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {tx.isError === "1" ? (
                            <AlertTriangle className="h-4 w-4 text-red-400" />
                          ) : tx.type === "sent" ? (
                            <ArrowUpRight className="h-4 w-4 text-blue-400" />
                          ) : (
                            <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
                          )}
                          <span className="font-medium text-zinc-200">
                            {tx.functionName || "Transaction"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-medium ${
                              tx.from.toLowerCase() === address?.toLowerCase()
                                ? "text-blue-400"
                                : "text-emerald-400"
                            }`}
                          >
                            {formatEther(BigInt(tx.value))} ETH
                          </span>
                        </div>
                      </div>

                      {/* Transaction Details */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400">
                            {new Date(
                              Number(tx.timeStamp) * 1000
                            ).toLocaleString()}
                          </span>
                          {tx.isError === "1" && (
                            <span className="text-red-400 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Failed
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="text-xs bg-white/[0.02] rounded-lg p-2 border border-white/[0.02]">
                                  <span className="text-zinc-500">From: </span>
                                  <span className="font-mono text-zinc-300">
                                    {tx.from.slice(0, 6)}...{tx.from.slice(-4)}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-mono">{tx.from}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="text-xs bg-white/[0.02] rounded-lg p-2 border border-white/[0.02]">
                                  <span className="text-zinc-500">To: </span>
                                  <span className="font-mono text-zinc-300">
                                    {tx.to.slice(0, 6)}...{tx.to.slice(-4)}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-mono">{tx.to}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <div className="text-xs text-zinc-500">
                            Hash: {tx.hash.slice(0, 6)}...{tx.hash.slice(-4)}
                          </div>
                          <a
                            href={`https://etherscan.io/tx/${tx.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors group"
                          >
                            View
                            <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Pagination Controls */}
                {filteredTransactions.length > ITEMS_PER_PAGE && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between pt-4 border-t border-white/[0.02]"
                  >
                    {/* Page Info */}
                    <div className="text-sm text-zinc-400">
                      Page {currentPage} of {totalPages}
                    </div>

                    {/* Navigation Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className={`p-2 rounded-lg border transition-all duration-200
                        ${
                          currentPage === 1
                            ? "bg-white/[0.02] border-white/[0.02] text-zinc-600 cursor-not-allowed"
                            : "bg-white/[0.02] border-white/[0.02] text-zinc-400 hover:bg-white/[0.05] hover:border-blue-500/20"
                        }`}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {[...Array(totalPages)].map((_, i) => (
                          <button
                            key={i + 1}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`min-w-[2rem] h-8 rounded-lg border transition-all duration-200 text-sm
                            ${
                              currentPage === i + 1
                                ? "bg-blue-500/20 border-blue-500/20 text-blue-400"
                                : "bg-white/[0.02] border-white/[0.02] text-zinc-400 hover:bg-white/[0.05] hover:border-blue-500/20"
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages)
                          )
                        }
                        disabled={currentPage === totalPages}
                        className={`p-2 rounded-lg border transition-all duration-200
                        ${
                          currentPage === totalPages
                            ? "bg-white/[0.02] border-white/[0.02] text-zinc-600 cursor-not-allowed"
                            : "bg-white/[0.02] border-white/[0.02] text-zinc-400 hover:bg-white/[0.05] hover:border-blue-500/20"
                        }`}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </ScrollArea>
  );
}
