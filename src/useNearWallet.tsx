import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useMemo,
} from "react";
import { JsonRpcProvider } from "near-api-js";
import { NearConnector, type NearWalletBase } from "@hot-labs/near-connect";

interface ViewFunctionParams {
  contractId: string;
  method: string;
  args?: Record<string, unknown>;
}

interface FunctionCallParams {
  contractId: string;
  method: string;
  args?: Record<string, unknown>;
  gas?: string;
  deposit?: string;
}

interface NearContextValue {
  signedAccountId: string;
  wallet: NearWalletBase | undefined;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  viewFunction: (params: ViewFunctionParams) => Promise<any>;
  callFunction: (params: FunctionCallParams) => Promise<any>;
  provider: JsonRpcProvider;
  connector: NearConnector;
  network: "mainnet" | "testnet";
}

export interface NearProviderConfig {
  network?: "mainnet" | "testnet";
  rpcUrl?: string;
}

export interface NearProviderProps {
  children: ReactNode;
  config?: NearProviderConfig;
}

const DEFAULT_CONFIG: Required<NearProviderConfig> = {
  network: "testnet",
  rpcUrl: "https://test.rpc.fastnear.com",
};

const DEFAULT_RPC_URLS = {
  mainnet: "https://rpc.mainnet.near.org",
  testnet: "https://test.rpc.fastnear.com",
};

const NearContext = createContext<NearContextValue | undefined>(undefined);

type NearConnectorOptions = ConstructorParameters<typeof NearConnector>[0];

export function NearProvider({ children, config = {} }: { children: ReactNode, config?: NearConnectorOptions }) {
  const [wallet, setWallet] = useState<NearWalletBase | undefined>(undefined);
  const [signedAccountId, setSignedAccountId] = useState("");
  const [loading, setLoading] = useState(true);

  const network = config.network || DEFAULT_CONFIG.network;
  const rpcUrl = DEFAULT_RPC_URLS[network];

  const provider = useMemo(
    () => new JsonRpcProvider({ url: rpcUrl }),
    [rpcUrl]
  );

  const connector = useMemo(
    () => new NearConnector(config),
    [network]
  );

  useEffect(() => {
    async function initializeConnector() {
      const connectedWallet = await connector.getConnectedWallet().catch(() => null);

      if (connectedWallet) {
        setWallet(connectedWallet.wallet);
        setSignedAccountId(connectedWallet.accounts[0].accountId);
      }

      const onSignOut = () => {
        setWallet(undefined);
        setSignedAccountId("");
      };

      const onSignIn = async (payload: { wallet: NearWalletBase }) => {
        setWallet(payload.wallet);
        const accounts = await payload.wallet.getAccounts();
        setSignedAccountId(accounts[0]?.accountId || "");
      };

      connector.on("wallet:signOut", onSignOut);
      connector.on("wallet:signIn", onSignIn);
      setLoading(false);
    }

    initializeConnector();

    return () => {
      if (connector) {
        connector.removeAllListeners("wallet:signOut");
        connector.removeAllListeners("wallet:signIn");
      }
    };
  }, [connector]);

  async function signIn() {
    if (!connector) return;
    const wallet = await connector.connect();
    console.log("Connected wallet", wallet);
    if (wallet) {
      setWallet(wallet);
      const accounts = await wallet.getAccounts();
      setSignedAccountId(accounts[0]?.accountId || "");
    }
  }

  async function signOut() {
    if (!connector || !wallet) return;
    await connector.disconnect(wallet);
    console.log("Disconnected wallet");

    setWallet(undefined);
    setSignedAccountId("");
  }

  async function viewFunction({
    contractId,
    method,
    args = {},
  }: ViewFunctionParams) {
    return provider.callFunction({ contractId, method, args });
  }

  async function callFunction({
    contractId,
    method,
    args = {},
    gas = "30000000000000",
    deposit = "0",
  }: FunctionCallParams) {

    const wallet = await connector.wallet()

    return wallet.signAndSendTransactions({
      transactions: [
        {
          receiverId: contractId,
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: method,
                args,
                gas,
                deposit,
              },
            },
          ],
        },
      ],
    });
  }

  const value: NearContextValue = {
    signedAccountId,
    wallet,
    signIn,
    signOut,
    loading,
    viewFunction,
    callFunction,
    provider,
    connector,
    network,
  };

  return <NearContext.Provider value={value}>{children}</NearContext.Provider>;
}

export function useNearWallet() {
  const context = useContext(NearContext);
  if (context === undefined) {
    throw new Error("useNear must be used within a NearProvider");
  }
  return context;
}