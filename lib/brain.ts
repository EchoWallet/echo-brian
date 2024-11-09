import { BrianSDK } from "@brian-ai/sdk";

const options = {
  apiKey: process.env.NEXT_PUBLIC_BRIAN_API_KEY!,
};

export const brian = new BrianSDK(options);

