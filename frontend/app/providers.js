"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import {SmartWalletsProvider} from '@privy-io/react-auth/smart-wallets';
import {baseSepolia} from 'viem/chains';


export default function Providers({ children }) {
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
      <SmartWalletsProvider>
        {children}
      </SmartWalletsProvider>
    </PrivyProvider>
  );
}
