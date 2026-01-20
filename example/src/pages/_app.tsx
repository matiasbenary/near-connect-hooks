import "@/styles/globals.css";

import type { AppProps } from "next/app";
import { Navigation } from "@/components/Navigation";
import { NearProvider } from "near-connect-hooks";
import { NetworkId } from "@/config";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <NearProvider
      config={{
        network: NetworkId,
        providers: {
          testnet: ['https://test.rpc.fastnear.com']
        }
      }}
    >
      <Navigation />
      <Component {...pageProps} />
    </NearProvider>
  );
}
