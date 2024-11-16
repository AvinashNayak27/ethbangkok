"use client";

import { PrivyProvider } from "@privy-io/react-auth";

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
      }}
    >
      {children}
    </PrivyProvider>
  );
}
