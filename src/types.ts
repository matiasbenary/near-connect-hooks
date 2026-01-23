import { type NearConnector, type SignedMessage, SignAndSendTransactionsParams } from "@hot-labs/near-connect";
import { type FinalExecutionOutcome, type JsonRpcProvider } from "near-api-js";
import type { AccessKeyList } from "near-api-js";
import type { Action } from "./actions";

export interface ViewFunctionParams {
  contractId: string;
  method: string;
  args?: Record<string, unknown>;
}

export interface FunctionCallParams {
  contractId: string;
  method: string;
  args?: Record<string, unknown>;
  gas?: string;
  deposit?: string;
}

export interface TransferParams {
  receiverId: string;
  amount: string;
}

export interface AddFullAccessKeyParams {
  publicKey: string;
}

export interface AddFunctionCallKeyParams {
  publicKey: string;
  contractId: string;
  methodNames?: string[];
  allowance?: string;
}

export interface DeleteKeyParams {
  publicKey: string;
}

export interface NearContextValue {
  network: "mainnet" | "testnet";
  signedAccountId: string;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  getBalance: (accountId: string) => Promise<bigint>;
  getAccessKeyList: (accountId: string) => Promise<AccessKeyList & { block_hash: string; block_height: number; }>;
  signAndSendTransaction: (params: { receiverId: string; actions: Action[]; }) => Promise<FinalExecutionOutcome>;
  signAndSendTransactions: (transactions: SignAndSendTransactionsParams) => Promise<FinalExecutionOutcome[]>;
  viewFunction: (params: ViewFunctionParams) => Promise<any>;
  callFunction: (params: FunctionCallParams) => Promise<FinalExecutionOutcome>;
  transfer: (params: TransferParams) => Promise<FinalExecutionOutcome>;
  addFunctionCallKey: (params: AddFunctionCallKeyParams) => Promise<FinalExecutionOutcome>;
  deleteKey: (params: DeleteKeyParams) => Promise<FinalExecutionOutcome>;
  signNEP413Message: (params: { message: string; recipient: string; nonce: Uint8Array; }) => Promise<SignedMessage>;
  provider: JsonRpcProvider;
  connector: NearConnector;
}
