import { JsonRpcProvider } from "near-api-js";
import { NearConnector, type NearWalletBase } from "@hot-labs/near-connect";

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
  callFunction: (params: FunctionCallParams) => Promise<any>;
  transfer: (params: TransferParams) => Promise<any>;
  addFunctionCallKey: (params: AddFunctionCallKeyParams) => Promise<any>;
  deleteKey: (params: DeleteKeyParams) => Promise<any>;
  provider: JsonRpcProvider;
  connector: NearConnector;
  network: "mainnet" | "testnet";
}
