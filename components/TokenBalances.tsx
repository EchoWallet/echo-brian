import { useAccount } from "wagmi";
import { useState, useEffect, useMemo } from "react";
import { formatUnits } from "viem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Search,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useStore } from "@/store/store";
import { GoldRushClient, ChainName } from "@covalenthq/client-sdk";

interface TokenBalance {
  contractAddress: string;
  balance: string;
  symbol: string;
  decimals: number;
  name: string;
  quoteRate?: number | null;
  quote?: number | null;
  logoUrl?: string | null;
}

export const CHAINID_TO_CHAINNAME: Record<number, ChainName> = {
  1: ChainName.ETH_MAINNET,
  11155111: ChainName.ETH_SEPOLIA,
  137: ChainName.MATIC_MAINNET,
  80002: ChainName.POLYGON_AMOY_TESTNET,
  8453: ChainName.BASE_MAINNET,
  84532: ChainName.BASE_SEPOLIA_TESTNET,
  167000: ChainName.TAIKO_MAINNET,
  167009: ChainName.TAIKO_HEKLA_TESTNET,
};

export function TokenBalances() {
  const { address, chainId } = useAccount();
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"value" | "name" | "balance">("value");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const { reset } = useStore();

  // Update fetchBalances function
  useEffect(() => {
    async function fetchBalances() {
      if (!address || !chainId) return;

      try {
        setIsLoading(true);
        const client = new GoldRushClient(
          process.env.NEXT_PUBLIC_GOLDRUSH_API_KEY!
        );

        const balanceResp =
          await client.BalanceService.getTokenBalancesForWalletAddress(
            CHAINID_TO_CHAINNAME[chainId],
            address
          );

        if (balanceResp.error) {
          throw balanceResp.error_message;
        }

        const tokenBalances: TokenBalance[] = (balanceResp.data?.items ?? [])
          .filter((item) => item.balance && BigInt(item.balance) > BigInt(0))
          .filter(
            (item) =>
              item.contract_address &&
              item.contract_ticker_symbol &&
              item.contract_decimals &&
              item.contract_name
          )
          .map((item) => ({
            contractAddress: item.contract_address!,
            balance: item.balance!.toString(),
            symbol: item.contract_ticker_symbol!,
            decimals: item.contract_decimals!,
            name: item.contract_name!,
            quoteRate: item.quote_rate,
            quote: item.quote,
            logoUrl: item.logo_url,
          }));

        setTokenBalances(tokenBalances);
      } catch (error) {
        console.error("Failed to fetch balances:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBalances();
  }, [address, chainId]);

  useEffect(() => {
    const client = new GoldRushClient(
      process.env.NEXT_PUBLIC_GOLDRUSH_API_KEY!
    );

    const ApiServices = async () => {
      try {
        const balanceResp =
          await client.BalanceService.getTokenBalancesForWalletAddress(
            "eth-mainnet",
            "demo.eth"
          );

        if (balanceResp.error) {
          throw balanceResp;
        }

        console.log(balanceResp.data);
      } catch (error) {
        console.error(error);
      }
    };

    ApiServices();
  }, []);

  // Update calculateTotalValue to use quote values
  const calculateTotalValue = (balances: TokenBalance[]): number => {
    return balances.reduce((total, token) => {
      return total + (token.quote || 0);
    }, 0);
  };

  // Update the filtered and sorted tokens to not rely on TOKEN_PRICES
  const filteredAndSortedTokens = useMemo(() => {
    const filtered = tokenBalances.filter((token) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        token.name.toLowerCase().includes(searchLower) ||
        token.symbol.toLowerCase().includes(searchLower)
      );
    });

    return filtered.sort((a, b) => {
      // First, separate 0% tokens
      const percentageA =
        ((a.quote || 0) / calculateTotalValue(tokenBalances)) * 100;
      const percentageB =
        ((b.quote || 0) / calculateTotalValue(tokenBalances)) * 100;

      if (percentageA === 0 && percentageB !== 0) return 1;
      if (percentageA !== 0 && percentageB === 0) return -1;

      // Then apply the regular sorting
      const balanceA = Number(formatUnits(BigInt(a.balance), a.decimals));
      const balanceB = Number(formatUnits(BigInt(b.balance), b.decimals));

      let comparison = 0;
      switch (sortBy) {
        case "value":
          comparison = (a.quote || 0) - (b.quote || 0);
          break;
        case "balance":
          comparison = balanceA - balanceB;
          break;
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [tokenBalances, searchQuery, sortBy, sortDirection]);

  if (!address) {
    return (
      <div className="p-8 text-center space-y-4 bg-black/20 backdrop-blur-lg rounded-xl border border-zinc-800/50">
        <AlertCircle className="w-12 h-12 text-zinc-400 mx-auto" />

        <button
          onClick={reset}
          className="absolute top-0 right-3 p-1.5 rounded-full bg-white/[0.02] border border-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.05] transition-all duration-200 group"
        >
          <X className="h-4 w-4 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
        </button>
        <div>
          <h3 className="text-lg font-medium text-zinc-200">
            Wallet Not Connected
          </h3>
          <p className="text-sm text-zinc-400 mt-1">
            Please connect your wallet to view token balances
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center space-y-4 bg-black/20 backdrop-blur-lg rounded-xl border border-zinc-800/50">
        <Loader2 className="w-12 h-12 text-blue-400 mx-auto animate-spin" />
        <div className="text-zinc-400">Loading your portfolio...</div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {/* Portfolio Value Card with Close Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-br from-blue-950/30 to-purple-950/30 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/10 shadow-lg group"
        >
          {/* Close Button */}
          <button
            onClick={reset}
            className="absolute top-3 right-3 p-1.5 rounded-full 
              bg-white/[0.02] border border-white/[0.02] 
              hover:bg-white/[0.05] hover:border-white/[0.05] 
              transition-all duration-200 group"
          >
            <X className="h-4 w-4 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
          </button>

          <h2 className="text-lg font-semibold mb-2 text-zinc-200 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-400" />
            Portfolio Value
          </h2>
          <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            $
            {calculateTotalValue(tokenBalances).toLocaleString("en-US", {
              maximumFractionDigits: 2,
            })}
          </div>
        </motion.div>
        {/* Search and Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
            <Input
              placeholder="Search tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-zinc-900/50 border-zinc-800/50 text-zinc-200 placeholder:text-zinc-500"
            />
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    setSortDirection((prev) =>
                      prev === "asc" ? "desc" : "asc"
                    );
                  }}
                  className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50 hover:border-blue-500/50 transition-colors"
                >
                  {sortDirection === "desc" ? (
                    <TrendingDown className="h-5 w-5 text-zinc-400" />
                  ) : (
                    <TrendingUp className="h-5 w-5 text-zinc-400" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle sort direction</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Token List */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-sm font-medium text-zinc-400">
              Token Balances
            </h3>
            <div className="flex gap-2">
              {["value", "name", "balance"].map((option) => (
                <button
                  key={option}
                  onClick={() =>
                    setSortBy(option as "value" | "name" | "balance")
                  }
                  className={`text-xs px-3 py-1 rounded-full transition-colors ${
                    sortBy === option
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/50"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {filteredAndSortedTokens.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-zinc-400 bg-zinc-900/50 backdrop-blur-sm rounded-xl p-4 border border-zinc-800/50 text-center"
              >
                {searchQuery
                  ? "No tokens found matching your search"
                  : "No tokens found"}
              </motion.div>
            ) : (
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {filteredAndSortedTokens.map((token, index) => {
                  const balance = Number(
                    formatUnits(BigInt(token.balance), token.decimals)
                  );
                  const percentage = token.quote
                    ? (token.quote / calculateTotalValue(tokenBalances)) * 100
                    : 0;

                  return (
                    <motion.div
                      key={token.contractAddress}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="group relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                      <div className="relative p-4 rounded-xl bg-zinc-900/50 backdrop-blur-md border border-zinc-800/50 hover:border-blue-500/50 transition-all duration-300">
                        <div className="flex items-center justify-between mb-3">
                          <div className="space-y-1">
                            <div className="font-medium text-zinc-200 flex items-center gap-2">
                              {token.name}
                              <span className="text-xs text-zinc-500">
                                ({token.symbol})
                              </span>
                            </div>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-xs text-zinc-500 hover:text-zinc-400 transition-colors cursor-help">
                                    {token.contractAddress.slice(0, 6)}...
                                    {token.contractAddress.slice(-4)}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    Contract Address: {token.contractAddress}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-zinc-200">
                              {balance.toLocaleString("en-US", {
                                maximumFractionDigits: 4,
                              })}{" "}
                              {token.symbol}
                            </div>
                            <div className="text-sm text-zinc-400">
                              $
                              {token.quote?.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }) || "0.00"}
                            </div>
                          </div>
                        </div>

                        <div className="relative h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                          />
                        </div>
                        <div className="mt-1 text-xs text-zinc-500 text-right">
                          {percentage.toFixed(1)}% of portfolio
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </ScrollArea>
  );
}
