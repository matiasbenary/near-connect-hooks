import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useMemo,
} from "react";
import { AccessKeyList, JsonRpcProvider } from "near-api-js";
import { NearConnector, type SignedMessage, type NearWalletBase, SignAndSendTransactionsParams } from "@hot-labs/near-connect";
import { Action, Actions } from "./actions.js";
import type {
  ViewFunctionParams,
  FunctionCallParams,
  TransferParams,
  AddFunctionCallKeyParams,
  DeleteKeyParams,
  NearContextValue,
} from "./types.js";

const DEFAULT_RPC_URLS = {
  mainnet: "https://free.rpc.fastnear.com",
  testnet: "https://test.rpc.fastnear.com",
};

const NearContext = createContext<NearContextValue | undefined>(undefined);

type NearConnectorOptions = ConstructorParameters<typeof NearConnector>[0];

export function NearProvider({ children, config = {} }: { children: ReactNode, config?: NearConnectorOptions }) {
  const [wallet, setWallet] = useState<NearWalletBase | undefined>(undefined);
  const [signedAccountId, setSignedAccountId] = useState("");
  const [loading, setLoading] = useState(true);

  const network = config.network || "testnet";
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

  async function getBalance(accountId: string) {
    const account = await provider.viewAccount({ accountId, blockQuery: { finality: "final" } });
    return account.amount;
  }

  async function getAccessKeyList(accountId: string) {
    const accessKeyList = await provider.viewAccessKeyList({ accountId, finalityQuery: { finality: "final" } });
    return accessKeyList as unknown as AccessKeyList & { block_hash: string; block_height: number; };
  }

  async function signAndSendTransaction({ receiverId, actions }: { receiverId: string, actions: Action[] }) {
    const wallet = await connector.wallet();
    if (!wallet) throw new Error("Wallet is not connected");
    return wallet.signAndSendTransaction({ receiverId, actions });
  }

  async function signAndSendTransactions(transactions: SignAndSendTransactionsParams) {
    const wallet = await connector.wallet();
    if (!wallet) throw new Error("Wallet is not connected");
    return wallet.signAndSendTransactions(transactions);
  }

  async function callFunction({
    contractId,
    method,
    args = {},
    gas = "30000000000000",
    deposit = "0",
  }: FunctionCallParams) {
    return signAndSendTransaction(
      {
        receiverId: contractId, actions: [
          Actions.functionCall(method, args, gas, deposit),
        ]
      });
  }

  async function transfer({ receiverId, amount }: TransferParams) {
    return signAndSendTransaction(
      {
        receiverId,
        actions: [Actions.transfer(amount)]
      });
  }

  async function addFunctionCallKey({
    publicKey,
    contractId,
    methodNames = [],
    allowance,
  }: AddFunctionCallKeyParams) {
    return signAndSendTransaction(
      {
        receiverId: signedAccountId,
        actions: [
          Actions.addFunctionCallKey(publicKey, contractId, methodNames, allowance),
        ]
      });
  }

  async function deleteKey({ publicKey }: DeleteKeyParams) {
    return signAndSendTransaction(
      {
        receiverId: signedAccountId,
        actions: [
          Actions.deleteKey(publicKey),
        ]
      });
  }

  async function signNEP413Message({ message, recipient, nonce }: { message: string; recipient: string; nonce: Uint8Array; }): Promise<SignedMessage> {
    if (!wallet) throw new Error("Wallet is not connected");
    return wallet.signMessage({ message, recipient, nonce });
  }

  const value: NearContextValue = {
    network,
    loading,
    connector,
    provider,
    signedAccountId,
    getBalance,
    viewFunction,
    getAccessKeyList,
    signIn,
    signOut,
    signAndSendTransaction,
    signAndSendTransactions,
    callFunction,
    transfer,
    addFunctionCallKey,
    signNEP413Message,
    deleteKey,
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