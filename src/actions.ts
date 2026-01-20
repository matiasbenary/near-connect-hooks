import { NearConnector } from "@hot-labs/near-connect";

// ============================================================================
// Action Builders
// ============================================================================

export const Actions = {
  transfer(amount: string) {
    return { type: "Transfer" as const, params: { deposit: amount } };
  },

  functionCall(
    methodName: string,
    args: Record<string, unknown>,
    gas: string,
    deposit: string
  ) {
    return { type: "FunctionCall" as const, params: { methodName, args, gas, deposit } };
  },

  addFullAccessKey(publicKey: string) {
    return {
      type: "AddKey" as const,
      params: { publicKey, accessKey: { permission: "FullAccess" as const } },
    };
  },

  addFunctionCallKey(
    publicKey: string,
    receiverId: string,
    methodNames: string[] = [],
    allowance?: string
  ) {
    console.log("Creating function call key action", { publicKey, receiverId, methodNames, allowance });
    return {
      type: "AddKey" as const,
      params: {
        publicKey,
        accessKey: { permission: { receiverId, methodNames, allowance } },
      },
    };
  },

  deleteKey(publicKey: string) {
    return { type: "DeleteKey" as const, params: { publicKey } };
  },
};

// ============================================================================
// Types
// ============================================================================

export type Action = ReturnType<typeof Actions[keyof typeof Actions]>;

// ============================================================================
// Helper to send transactions
// ============================================================================

export async function sendTransaction(
  connector: NearConnector,
  receiverId: string,
  actions: Action[]
) {
  const wallet = await connector.wallet();
  return wallet.signAndSendTransaction({ receiverId, actions });
}
