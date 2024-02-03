'use client';

import * as React from 'react';
import {
  RainbowKitProvider,
  getDefaultWallets,
  connectorsForWallets,
  Chain,
} from '@rainbow-me/rainbowkit';
import {
  argentWallet,
  trustWallet,
  ledgerWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import {
  sepolia,
} from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { infuraProvider } from 'wagmi/providers/infura';

const anvil: Chain = {
    id: 31_337,
    name: "Anvil Local",
    network: "anvil",
    nativeCurrency: {
        decimals: 18,
        name: "tETH",
        symbol: "tETH"
    },
    rpcUrls: {
        public: { http: ["http://localhost:8545"]},
        default: { http: ["http://localhost:8545"]},
    },
    testnet: true
}

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [
    // anvil,
    sepolia,
  ],
  [infuraProvider({ apiKey: process.env.NEXT_PUBLIC_INFURA_ID || "" })]
);

const projectId = 'YOUR_PROJECT_ID';

const { wallets } = getDefaultWallets({
  appName: 'RainbowKit demo',
  projectId,
  chains,
});

const demoAppInfo = {
  appName: 'Rainbowkit Demo',
};

const connectors = connectorsForWallets([
  ...wallets,
  {
    groupName: 'Other',
    wallets: [
      argentWallet({ projectId, chains }),
      trustWallet({ projectId, chains }),
      ledgerWallet({ projectId, chains }),
    ],
  },
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
      <RainbowKitProvider chains={chains} appInfo={demoAppInfo}>
        {mounted && children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
}