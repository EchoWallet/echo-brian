"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { PaperclipIcon, Mic, Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CircularNav from "@/components/CircularNav";
import { useStore, NavItem } from "@/store/store";
import { TransactionHistory } from "@/components/TransactionHistory";
import { TokenBalances } from "@/components/TokenBalances";
import {
  useAccount,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from "wagmi";
import { brian } from "@/lib/brain";
// import { BrianCoinbaseSDK } from "@brian-ai/cdp-sdk";

type Message = {
  id: number;
  text: string;
  sender: "user" | "ai";
};


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

  const [showError, setShowError] = useState(false);
  const [showConfirming, setShowConfirming] = useState(false);
  const [showConfirmed, setShowConfirmed] = useState(false);

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
      // const validActions = [ ... ];

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

      console.log(result, "result", address, chainId);
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
          // @ts-expect-error gas property type mismatch with wagmi
          gas: BigInt(step.gasLimit!),
          chainId: step.chainId,
        });
      }
    } catch (error: unknown) {
      console.error("Transaction failed:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          text:
            "Transaction failed: " +
            ((error as Error)?.message || "Please try again"),
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

  useEffect(() => {
    if (error || isConfirming || isConfirmed) {
      if (error) setShowError(true);
      if (isConfirming) setShowConfirming(true);
      if (isConfirmed) setShowConfirmed(true);

      const timer = setTimeout(() => {
        setShowError(false);
        setShowConfirming(false);
        setShowConfirmed(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error, isConfirming, isConfirmed]);

  return (
    <div className="flex flex-col h-screen relative overflow-hidden">
      {/* Background Layers */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-[#0A0F1A] to-black" />

      {/* Ambient Light Effects */}
      <div className="fixed inset-0">
        <div
          className="absolute -top-[40%] left-1/2 -translate-x-1/2 w-[120%] h-[60%] 
        bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] 
        from-blue-900/[0.03] via-transparent to-transparent 
        blur-3xl"
        />
        <div
          className="absolute -bottom-[20%] left-1/2 -translate-x-1/2 w-[120%] h-[50%] 
        bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] 
        from-indigo-900/[0.02] via-transparent to-transparent 
        blur-3xl"
        />
      </div>

      {/* Noise Texture */}
      <div className="fixed inset-0 bg-[url('/noise.png')] opacity-[0.015]" />

      {/* Main Content Container */}
      <div className="relative flex flex-col h-full">
        {/* Top Navigation Bar */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/[0.02] bg-white/[0.01] backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <CircularNav />
          </div>
          <ConnectButton />
        </div>

        {/* Main Content Area */}
        <div className="relative flex flex-1 h-[calc(100vh-4rem)]">
          {/* Animated Side Panels */}
          <AnimatePresence mode="wait">
            {/* Assets Panel */}
            {selectedNavItem === NavItem.Assets && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                className="h-full border-r border-white/[0.02] bg-white/[0.01] backdrop-blur-sm overflow-hidden"
              >
                <div className="w-80">
                  <TokenBalances />
                </div>
              </motion.div>
            )}

            {/* History Panel */}
            {selectedNavItem === NavItem.History && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                className="h-full border-r border-white/[0.02] bg-white/[0.01] backdrop-blur-sm overflow-hidden"
              >
                <div className="w-80">
                  <TransactionHistory />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat Area Container */}
          <div className="relative flex-1 h-full">
            {/* Messages Area */}
            <ScrollArea className="h-[calc(100vh-10rem)]">
              {" "}
              {/* Adjusted height for header + input */}
              <div className="max-w-3xl mx-auto p-6">
                <AnimatePresence initial={false}>
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{
                        opacity: 0,
                        y: 20,
                        x: message.sender === "user" ? 20 : -20,
                        scale: 0.95,
                      }}
                      animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
                      transition={{
                        duration: 0.4,
                        delay: index * 0.05,
                        type: "spring",
                        bounce: 0.3,
                      }}
                      layout="position"
                      className={cn(
                        "mb-6 flex",
                        message.sender === "user"
                          ? "justify-end"
                          : "justify-start"
                      )}
                    >
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        className={cn(
                          "rounded-2xl px-6 py-3 max-w-[80%] shadow-lg relative group",
                          message.sender === "user"
                            ? "bg-gradient-to-r from-blue-500/40 to-blue-600/40 border border-blue-400/10"
                            : "bg-white/[0.03] border border-white/[0.02]",
                          "backdrop-blur-md"
                        )}
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/[0.05] to-blue-500/0 rounded-2xl"
                          initial={{ opacity: 0 }}
                          whileHover={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                        {message.sender === "ai" ? (
                          <ReactMarkdown
                            className="text-sm font-mono leading-relaxed relative z-10"
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => {
                                if (
                                  children &&
                                  children.toString().trim() === '"'
                                )
                                  return null;
                                return (
                                  <p className="text-zinc-300">{children}</p>
                                );
                              },
                              code: ({ children }) => (
                                <code className="bg-black/20 rounded px-1 py-0.5 text-blue-200">
                                  {children}
                                </code>
                              ),
                            }}
                          >
                            {message.text}
                          </ReactMarkdown>
                        ) : (
                          <p className="text-sm font-mono text-white/90 relative z-10">
                            {message.text}
                          </p>
                        )}
                      </motion.div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>

            {/* Fixed Input Area */}
            <div className="absolute bottom-0 left-0 right-0 bg-white/[0.01] backdrop-blur-sm border-t border-white/[0.02]">
              <div className="max-w-3xl mx-auto p-4">
                <div className="flex items-center gap-2 bg-white/[0.02] rounded-2xl p-2 backdrop-blur-sm border border-white/[0.02]">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-white/5 rounded-xl transition-colors"
                  >
                    <PaperclipIcon className="h-5 w-5 text-zinc-400" />
                  </Button>
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSendMessage();
                      }
                    }}
                    placeholder="Send a message..."
                    className="flex-1 bg-transparent border-0 focus-visible:ring-0 text-white placeholder:text-zinc-500"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-white/5 rounded-xl transition-colors"
                  >
                    <Mic className="h-5 w-5 text-zinc-400" />
                  </Button>
                  <Button
                    onClick={handleSendMessage}
                    disabled={isPending}
                    className={cn(
                      "bg-blue-500/40 hover:bg-blue-500/50",
                      "rounded-xl px-4 py-2 font-medium transition-all duration-200",
                      "border border-blue-400/10",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>

                {/* Status Messages */}
                <AnimatePresence>
                  {(showError || showConfirming || showConfirmed) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute -top-16 left-0 right-0 px-4"
                    >
                      {showError && (
                        <div className="text-red-300 bg-red-500/5 border border-red-500/10 rounded-lg px-4 py-2 backdrop-blur-sm">
                          Error: {(error as Error)?.message || "An error occurred"}
                        </div>
                      )}
                      {showConfirming && (
                        <div className="text-blue-300 bg-blue-500/5 border border-blue-500/10 rounded-lg px-4 py-2 backdrop-blur-sm flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Waiting for confirmation...
                        </div>
                      )}
                      {showConfirmed && (
                        <div className="text-emerald-300 bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-4 py-2 backdrop-blur-sm">
                          Transaction confirmed! ✨
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
