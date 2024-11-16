"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { SmartWalletsProvider } from "@privy-io/react-auth/smart-wallets";
import { baseSepolia } from "viem/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {createConfig} from '@privy-io/wagmi';
import { http } from "wagmi";
import {WagmiProvider} from '@privy-io/wagmi';

export const config = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(),
  },
});

export default function Providers({ children }) {
  const queryClient = new QueryClient();
  return (
    <PrivyProvider
      appId="cm3k2licy006ppgg0ks6xywtm"
      config={{
        loginMethods: ["github"],
        appearance: {
          theme: "light",
        },
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
        },
        defaultChain: baseSepolia,
      }}
    >
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={config}>
            {children}
          </WagmiProvider>
        </QueryClientProvider>
    </PrivyProvider>
  );
}
