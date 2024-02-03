'use client';

import * as React from 'react';
import {
  RainbowKitProvider,
  connectorsForWallets,
} from '@rainbow-me/rainbowkit';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import {
  sepolia,
} from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { infuraProvider } from 'wagmi/providers/infura';


const { chains, publicClient, webSocketPublicClient } = configureChains(
  [
    sepolia,
  ],
  [process.env.NEXT_PUBLIC_INFURA_ID ? infuraProvider({ apiKey: process.env.NEXT_PUBLIC_INFURA_ID }) : publicProvider()]
);

import {
  injectedWallet,
} from '@rainbow-me/rainbowkit/wallets';

const demoAppInfo = {
  appName: 'Candide ERC 4337 Demo Application',
};

const connectors = connectorsForWallets([
  {
    groupName: "Wallet",
    wallets: [
      injectedWallet({ chains }),
    ]
  }
]);

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider modalSize="compact" chains={chains} appInfo={demoAppInfo}>
        {mounted && children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
}