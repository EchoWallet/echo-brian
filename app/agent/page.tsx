"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  Menu,
  Settings,
  Bell,
  Wallet,
  PaperclipIcon,
  Mic,
  Send,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { brian } from "@/lib/brain";
import {
  useAccount,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther } from "viem";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CircularNav from "@/components/CircularNav";
import { useStore, NavItem } from "@/store/store";
import { TransactionHistory } from "@/components/TransactionHistory";
// import { BrianCoinbaseSDK } from "@brian-ai/cdp-sdk";

type Message = {
  id: number;
  text: string;
  sender: "user" | "ai";
};

type TransactionStep = {
  chainId: number;
  to: string;
  data: string;
  value: string;
  gasLimit: string;
  blockNumber: number;
  from: string;
};

type Action =
  | "swap"
  | "transfer"
  | "bridge"
  | "balance"
  | "wrap native"
  | "unwrap native"
  | "totalsupply"
  | "approve"
  | "deposit"
  | "stake on Lido"
  | "withdraw"
  | "ENS Forward Resolution"
  | "ENS Reverse Resolution"
  | "ENS Availability"
  | "ENS Expiration"
  | "ENS Registration Cost"
  | "ENS Renewal Cost"
  | "ENS Registration"
  | "ENS Renewal"
  | "AAVE Borrow"
  | "AAVE Repay"
  | "Aave User Data";

export default function Component() {
  const { address, chainId } = useAccount();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! How can I assist you today?",
      sender: "ai",
    },
    {
      id: 2,
      text: "hi",
      sender: "user",
    },
    {
      id: 3,
      text: "Hi there! It's great to see you. How can I help you today?",
      sender: "ai",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");

  const {
    data: hash,
    error,
    isPending,
    sendTransaction,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const { selectedNavItem } = useStore();

  const sendTx = async (message: string) => {
    try {
      const messageToSend = message;
      setInputMessage("");
      // const sdk = new BrianCoinbaseSDK({
      //   brianApiKey: process.env.NEXT_PUBLIC_BRIAN_API_KEY as string,
      //   coinbaseApiKeyName: process.env
      //     .NEXT_PUBLIC_COINBASE_API_KEY_NAME as string,
      //   coinbaseApiKeySecret: process.env
      //     .NEXT_PUBLIC_COINBASE_API_KEY_SECRET as string,
      // });

      // console.log(sdk, "sdk");

      // // Create a wallet
      // await sdk.createWallet({ networkId: "base-sepolia" });
      // // Fund the wallet (only for Sepolia testnet)
      // await sdk.fundWallet();

      // // Execute a transaction based on a prompt
      // const txHashes = await sdk.transact(messageToSend);
      // console.log("Transaction hashes:", txHashes);

      const result = await brian.extract({
        prompt: messageToSend,
      });

      if (!result) {
        console.error("Failed to extract transaction message", result);
        return;
      }

      console.log("Extracted transaction message:", result);

      // Check if the action is valid
      const action: string = result.completion[0].action;
      const validActions = [
        "swap",
        "transfer",
        "bridge",
        "balance",
        "wrap native",
        "unwrap native",
        "totalsupply",
        "approve",
        "deposit",
        "stake on Lido",
        "withdraw",
        "ENS Forward Resolution",
        "ENS Reverse Resolution",
        "ENS Availability",
        "ENS Expiration",
        "ENS Registration Cost",
        "ENS Renewal Cost",
        "ENS Registration",
        "ENS Renewal",
        "AAVE Borrow",
        "AAVE Repay",
        "Aave User Data",
      ];

      if (action == "askbrian") {
        const askResult = await brian.ask({
          prompt: messageToSend,
          kb: "taiko_kb",
        });

        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            text: askResult.answer,
            sender: "ai",
          },
        ]);

        console.log(askResult, "askResult");
        return;
      }

      const transactionResult = await brian.transact({
        ...result,
        address: address!,
        chainId: `${chainId!}`,
      });

      if (!transactionResult[0].data.steps) {
        console.error("No steps found in transaction result");
        return;
      }

      console.log("Transaction steps:", transactionResult[0]);

      // Add AI response to messages
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          text: transactionResult[0].data.description,
          sender: "ai",
        },
      ]);

      // Execute each transaction step
      for (const step of transactionResult[0].data.steps) {
        await sendTransaction({
          to: step.to as `0x${string}`,
          data: step.data as `0x${string}`,
          value: BigInt(step.value || "0"),
          // @ts-ignore
          gas: BigInt(step.gasLimit!),
          chainId: step.chainId,
        });
      }
    } catch (error) {
      console.error("Transaction failed:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          text:
            "Transaction failed: " +
            ((error as any)?.shortMessage || "Please try again"),
          sender: "ai",
        },
      ]);
    }
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim()) {
      setMessages((prev) => [
        ...prev,
        { id: prev.length + 1, text: inputMessage, sender: "user" },
      ]);

      try {
        await sendTx(inputMessage);
      } catch (error) {
        console.error("Failed to send transaction:", error);
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            text: "Failed to send transaction. Please try again.",
            sender: "ai",
          },
        ]);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white relative">
      {/* Top Bar */}
      <div className="flex items-center justify-end p-4 border-b border-zinc-800">
        <CircularNav />
        <ConnectButton />
      </div>

      <div className="flex flex-1">
        {/* History Panel */}
        {selectedNavItem === NavItem.History && (
          <div className="w-80 border-r border-zinc-800">
            <TransactionHistory />
          </div>
        )}

        {/* Chat Area */}
        <ScrollArea className="flex-1">
          <div className="max-w-2xl mx-auto p-4">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "mb-4 flex",
                    message.sender === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2 max-w-[80%] shadow-lg",
                      message.sender === "user"
                        ? "bg-blue-600 bg-opacity-90 backdrop-blur-sm"
                        : "bg-zinc-800 bg-opacity-90 backdrop-blur-sm"
                    )}
                  >
                    {message.sender === "ai" ? (
                      <ReactMarkdown
                        className="text-sm font-mono"
                        remarkPlugins={[remarkGfm]}
                        components={{
                          // Remove empty paragraphs that only contain quotes

                          p: ({ children }) => {
                            if (children && children.toString().trim() === '"')
                              return null;
                            return <p>{children}</p>;
                          },
                        }}
                      >
                        {message.text}
                      </ReactMarkdown>
                    ) : (
                      <p className="text-sm font-mono">{message.text}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="border-t border-zinc-800 p-4">
        <div className="max-w-md mx-auto flex items-center bg-zinc-800 rounded-full overflow-hidden">
          <Button variant="ghost" size="icon" className="hover:bg-zinc-700">
            <PaperclipIcon className="h-5 w-5" />
            <span className="sr-only">Attach file</span>
          </Button>
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                await handleSendMessage();
              }
            }}
            placeholder="Send a message..."
            className="flex-1 bg-transparent border-0 focus-visible:ring-0 text-white placeholder:text-zinc-400"
          />
          <Button variant="ghost" size="icon" className="hover:bg-zinc-700">
            <Mic className="h-5 w-5" />
            <span className="sr-only">Voice input</span>
          </Button>
          <Button
            onClick={handleSendMessage}
            disabled={isPending}
            size="icon"
            className="bg-blue-600 hover:bg-blue-700 rounded-full"
          >
            {isPending ? "Confirming..." : <Send className="h-5 w-5" />}
            <span className="sr-only">Send message</span>
          </Button>
        </div>
        {error && (
          <div className="text-red-500 text-sm mt-2">
            Error: {(error as any).shortMessage || error.message}
          </div>
        )}
        {isConfirming && (
          <div className="text-zinc-400 text-sm mt-2">
            Waiting for confirmation...
          </div>
        )}
        {isConfirmed && (
          <div className="text-green-500 text-sm mt-2">
            Transaction confirmed!
          </div>
        )}
      </div>
    </div>
  );
}
