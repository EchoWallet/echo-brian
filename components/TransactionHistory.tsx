"use client";

import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import { formatEther } from "viem";
import { ScrollArea } from "./ui/scroll-area";
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

interface CovalentLogEvent {
  decoded?: {
    name: string;
  };
}

interface CovalentTransactionItem {
  tx_hash: string;
  from_address: string;
  to_address: string | null;
  value: string;
  block_signed_at: string;
  successful: boolean;
  log_events?: CovalentLogEvent[];
}

interface CovalentResponse {
  data: {
    items: CovalentTransactionItem[];
  };
}

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

        const data: CovalentResponse = await response.json();

        const transactions = (data.data?.items || [])
          .filter(
            (tx: CovalentTransactionItem) =>
              tx.from_address?.toLowerCase() === address.toLowerCase() ||
              tx.to_address?.toLowerCase() === address.toLowerCase()
          )
          .map((tx: CovalentTransactionItem) => {
            const relevantLog = tx.log_events?.find(
              (log: CovalentLogEvent) =>
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
              type: tx.from_address?.toLowerCase() === address.toLowerCase()
                ? "sent" as const
                : "received" as const,
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
