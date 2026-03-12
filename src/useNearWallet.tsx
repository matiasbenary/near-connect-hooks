import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useMemo,
} from "react";
import { AccessKeyList, FailoverRpcProvider, getTransactionLastResult, JsonRpcProvider, nearToYocto } from "near-api-js";
import {
  NearConnector,
  type SignedMessage,
  type NearWalletBase,
  type SignAndSendTransactionsParams,
  type AddFunctionCallKeyParams as ConnectorAddFunctionCallKeyParams,
} from "@hot-labs/near-connect";
import { Action, Actions } from "./actions.js";
import type {
  ViewFunctionParams,
  FunctionCallParams,
  TransferParams,
  AddFunctionCallKeyParams,
  DeleteKeyParams,
  NearContextValue,
} from "./types.js";
import { createAccessKeyPlugin } from "function-call-key-plugin";

const DEFAULT_RPC_PROVIDERS = {
  mainnet: ["https://free.rpc.fastnear.com"],
  testnet: ["https://test.rpc.fastnear.com"],
};

const NearContext = createContext<NearContextValue | undefined>(undefined);

type NearConnectorOptions = ConstructorParameters<typeof NearConnector>[0];

export function NearProvider({ children, config = {} }: { children: ReactNode, config?: NearConnectorOptions }) {
  const [wallet, setWallet] = useState<NearWalletBase | undefined>(undefined);
  const [signedAccountId, setSignedAccountId] = useState("");
  const [loading, setLoading] = useState(true);

  const network = config.network || "testnet";
  const urls = (config.providers && config.providers[network]?.length) ? config.providers[network] : DEFAULT_RPC_PROVIDERS[network];
  const provider = useMemo(
    () => new FailoverRpcProvider(urls.map(url => new JsonRpcProvider({ url }))),
    [config.providers]
  );

  const connector = useMemo(
    () => new NearConnector(config),
    [network]
  );

  const accessKeyPlugin = useMemo(() => createAccessKeyPlugin({ network, providers: config.providers }), [network]);

  useEffect(() => {
    async function initializeConnector() {
      connector.use(accessKeyPlugin);
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

  async function signIn(param?: { addFunctionCallKey: Omit<ConnectorAddFunctionCallKeyParams, "publicKey"> }) {
    if (!connector) return;

    let addFCK: ConnectorAddFunctionCallKeyParams | undefined = undefined;

    if (param) {
      const { contractId, allowMethods, gasAllowance } = param.addFunctionCallKey;

      let allowance: string;

      if (gasAllowance) {
        allowance = gasAllowance.kind === "unlimited" ? "0" : gasAllowance.amount;
      } else {
        allowance = nearToYocto("0.25").toString();
      }

      const methodNames = allowMethods.anyMethod ? [] : allowMethods.methodNames;

      const publicKey = accessKeyPlugin.createLocalKeyFor({
        contractId,
        methodNames,
        allowance,
      });

      addFCK = {
        contractId,
        allowMethods,
        gasAllowance,
        publicKey,
      };
    }

    const wallet = await connector.connect({
      addFunctionCallKey: addFCK,
    });

    if (wallet) {
      setWallet(wallet);
      const accounts = await wallet.getAccounts();
      setSignedAccountId(accounts[0]?.accountId || "");
    }
  }

  async function signOut() {
    if (!connector || !wallet) return;
    await connector.disconnect(wallet);

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

  async function callFunctionRaw({
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

  async function callFunction({
    contractId,
    method,
    args = {},
    gas = "30000000000000",
    deposit = "0",
  }: FunctionCallParams) {
    const result = await callFunctionRaw({ contractId, method, args, gas, deposit });
    return getTransactionLastResult(result);
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
    callFunctionRaw,
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