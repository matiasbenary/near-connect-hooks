# NEAR Connect Hooks

React hooks for NEAR wallet integration using [@hot-labs/near-connect](https://github.com/hot-dao/near-connect).

## Features

- ✅ Simple React hooks to connect NEAR wallets
- ✅ Built on top of @hot-labs/near-connect for seamless wallet integration
- ✅ TypeScript support with full type definitions
- ✅ Sign in/out functionality
- ✅ View and call smart contract functions
- ✅ Fetch account balance and access keys
- ✅ Sign and send transactions
- ✅ Access to a Provider for custom RPC calls

## Installation

```bash
npm install near-connect-hooks
# or
yarn add near-connect-hooks
# or
pnpm add near-connect-hooks
```

## Usage

### 1. Wrap your app with NearProvider

The `NearProvider` accepts an optional `config` prop to customize the network and RPC provider:

```tsx
import { NearProvider } from 'near-connect-hooks';

function App() {
  return (
    <NearProvider
      config={{
        network: 'mainnet', // (optional, defaults to 'testnet')
        rpcUrl: 'https://free.rpc.fastnear.com', // (optional, defaults to 'https://test.rpc.fastnear.com')
      }}
    >
      <YourApp />
    </NearProvider>
  );
}
```

### 2. Use the hook in your components

```tsx
import { useNearWallet } from 'near-connect-hooks';

function MyComponent() {
  const {
    loading,
    connector,
    provider,
    getBalance,
    viewFunction,
    getAccessKeyList,
    signIn,
    signOut,
    signedAccountId,
    signAndSendTransaction,
    signAndSendTransactions,
    callFunction,
    transfer,
    addFunctionCallKey,
    signNEP413Message,
    deleteKey,
  } = useNearWallet();

  // Check if user is signed in
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!signedAccountId) {
    return <button onClick={signIn}>Connect Wallet</button>;
  }

  return (
    <div>
      <p>Connected as: {signedAccountId}</p>
      <button onClick={signOut}>Disconnect</button>
    </div>
  );
}
```

## Example

Check the `example` directory for a complete Next.js application demonstrating how to use the hooks with a NEAR guestbook smart contract.

To run the example:

```bash
# Install the library and build it
npm install
npm run build

# Navigate to the example directory
cd example
npm install
npm run dev
```

## API Reference

### `useNearWallet()`

Returns an object with the following properties:

#### `signedAccountId: string`
The account ID of the currently connected wallet, or empty string if not connected.

#### `loading: boolean`
Loading state while initializing the wallet connection.

#### `signIn: () => Promise<void>`
Function to initiate wallet connection.

#### `signOut: () => Promise<void>`
Function to disconnect the current wallet.

#### `network: "mainnet" | "testnet"`
The currently configured network.

#### `viewFunction(params): Promise<any>`
Call a read-only contract method (doesn't require wallet signature).

**Parameters:**
```typescript
{
  contractId: string;  // The contract account ID
  method: string;      // The method name to call
  args?: Record<string, unknown>;  // Method arguments (optional)
}
```

**Example:**
```typescript
const messages = await viewFunction({
  contractId: 'guestbook.testnet',
  method: 'get_messages',
  args: { from_index: '0', limit: '10' }
});
```

#### `callFunction(params): Promise<any>`
Call a contract method that modifies state (requires wallet signature and gas).

**Parameters:**
```typescript
{
  contractId: string;  // The contract account ID
  method: string;      // The method name to call
  args?: Record<string, unknown>;  // Method arguments (optional)
  gas?: string;        // Gas amount (default: "30000000000000")
  deposit?: string;    // NEAR amount to attach in yoctoNEAR (default: "0")
}
```

**Example:**
```typescript
await callFunction({
  contractId: 'guestbook.testnet',
  method: 'add_message',
  args: { text: 'Hello NEAR!' },
  deposit: '1000000000000000000000000' // 1 NEAR in yoctoNEAR
});
```

#### `getBalance(accountId): Promise<bigint>`
Fetch the account balance in yoctoNEAR for the provided account ID.

#### `getAccessKeyList(accountId): Promise<AccessKeyList & { block_hash: string; block_height: number; }>`
Fetch the list of access keys for an account, including the block hash and height of the response.

#### `transfer(params): Promise<FinalExecutionOutcome>`
Send a simple transfer.

**Parameters:**
```typescript
{
  receiverId: string;  // Receiver account ID
  amount: string;      // Amount in yoctoNEAR
}
```

#### `addFunctionCallKey(params): Promise<FinalExecutionOutcome>`
Add an access key restricted to specified contract methods.

**Parameters:**
```typescript
{
  publicKey: string;       // Public key to add
  contractId: string;      // Contract the key can call
  methodNames?: string[];  // Allowed methods (empty = any)
  allowance?: string;      // Allowance in yoctoNEAR (optional)
}
```

#### `deleteKey(params): Promise<FinalExecutionOutcome>`
Delete an access key from the signed-in account.

**Parameters:**
```typescript
{
  publicKey: string;  // Public key to remove
}
```

#### `signNEP413Message(params): Promise<SignedMessage>`
Sign an off-chain message following NEP-413.

**Parameters:**
```typescript
{
  message: string;       // Human-readable message
  recipient: string;     // Intended recipient account ID
  nonce: Uint8Array;     // Unique nonce
}
```

The following low-level methods are also available:

#### `connector: NearConnector`
Direct access to the NEAR connector instance from @hot-labs/near-connect.

#### `provider: JsonRpcProvider`
Direct access to a NEAR JSON-RPC provider from `near-api-js` for custom RPC queries.

#### `signAndSendTransaction(params): Promise<FinalExecutionOutcome>`
Sign and send a single transaction.

**Parameters:**
```typescript
{
  receiverId: string;       // Receiver account ID
  actions: Action[];        // Actions to execute
}
```

#### `signAndSendTransactions(transactions): Promise<FinalExecutionOutcome[]>`
Sign and send multiple transactions in one request.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

Matias Benary <matiasbenary@gmail.com>

## Repository

https://github.com/matiasbenary/near-connect-hooks
