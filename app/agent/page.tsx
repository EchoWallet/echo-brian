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

  const sendTx = async (message: string) => {
    try {
      const messageToSend = message;
      setInputMessage("");

      const result = await brian.extract({
        prompt: messageToSend,
      });

      if (!result) {
        console.error("Failed to extract transaction message", result);
        return;
      }

      console.log("Extracted transaction message:", result);

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
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="hover:bg-zinc-800">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[300px] bg-zinc-900 border-zinc-800"
          >
            <SheetHeader>
              <SheetTitle className="text-white">Details</SheetTitle>
            </SheetHeader>
            <div className="space-y-6 mt-6">
              <div>
                <h3 className="text-sm font-medium text-zinc-400 mb-2">
                  Wallet Overview
                </h3>
                <div className="space-y-2 text-sm">
                  <p>Balance: 1000 ETH</p>
                  <p>Assets: 5 NFTs</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-zinc-400 mb-2">
                  Transaction History
                </h3>
                <div className="space-y-2 text-sm">
                  <p>Last tx: 0x1234...5678</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-zinc-400 mb-2">
                  AI Activity Log
                </h3>
                <div className="space-y-2 text-sm">
                  <p>Last action: Message sent</p>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <ConnectButton />
        {/* <div className="flex gap-2"> */}
        {/* <Button variant="ghost" size="icon" className="hover:bg-zinc-800"> */}
        {/* <Wallet className="h-5 w-5" /> */}
        {/* <span className="sr-only">Wallet</span> */}
        {/* </Button> */}
        {/* <Button variant="ghost" size="icon" className="hover:bg-zinc-800">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
          <Button variant="ghost" size="icon" className="hover:bg-zinc-800">
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button> */}
        {/* </div> */}
      </div>

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
                  <p className="text-sm font-mono">{message.text}</p>
                  {/* {message.actions && (
                    <div className="flex gap-2 mt-2">
                      {message.actions.map((action) => (
                        <button
                          key={action}
                          className="text-xs text-zinc-400 hover:text-white transition-colors"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  )} */}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>

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
