import { NearConnector, type SignedMessage, type NearWalletBase } from "@hot-labs/near-connect";
import { type FinalExecutionOutcome, JsonRpcProvider } from "near-api-js";

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
  signedAccountId: string;
  wallet: NearWalletBase | undefined;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  viewFunction: (params: ViewFunctionParams) => Promise<any>;
  callFunction: (params: FunctionCallParams) => Promise<FinalExecutionOutcome>;
  transfer: (params: TransferParams) => Promise<FinalExecutionOutcome>;
  addFunctionCallKey: (params: AddFunctionCallKeyParams) => Promise<FinalExecutionOutcome>;
  deleteKey: (params: DeleteKeyParams) => Promise<FinalExecutionOutcome>;
  signNEP413Message: (params: { message: string; recipient: string; nonce: Uint8Array; }) => Promise<SignedMessage>;
  provider: JsonRpcProvider;
  connector: NearConnector;
  network: "mainnet" | "testnet";
}
