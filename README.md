# NEAR Connect Hooks

React hooks for NEAR wallet integration using [@hot-labs/near-connect](https://github.com/hot-dao/near-connect).

## Features

- Simple React hooks for NEAR wallet connection
- Built on top of @hot-labs/near-connect for seamless wallet integration
- TypeScript support with full type definitions
- View and call smart contract functions
- Automatic wallet state management
- Sign in/out functionality
- RPC provider access

## Installation

```bash
npm install near-connect-hooks
# or
yarn add near-connect-hooks
```

## Usage

### 1. Wrap your app with NearProvider

```tsx
import { NearProvider } from 'near-connect-hooks';

function App() {
  return (
    <NearProvider>
      <YourApp />
    </NearProvider>
  );
}
```

#### Configuration Options

The `NearProvider` accepts an optional `config` prop to customize the network and RPC provider:

```tsx
import { NearProvider } from 'near-connect-hooks';

function App() {
  return (
    <NearProvider
      config={{
        network: 'mainnet', // or 'testnet' (default: 'testnet')
        rpcUrl: 'https://rpc.mainnet.near.org', // Optional: custom RPC URL
      }}
    >
      <YourApp />
    </NearProvider>
  );
}
```

**Default Settings:**
- Network: `testnet`
- RPC URL: `https://test.rpc.fastnear.com` (testnet) or `https://rpc.mainnet.near.org` (mainnet)

### 2. Use the hook in your components

```tsx
import { useNearWallet } from 'near-connect-hooks';

function MyComponent() {
  const {
    signedAccountId,
    wallet,
    signIn,
    signOut,
    loading,
    viewFunction,
    callFunction
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

## API Reference

### `useNearWallet()`

Returns an object with the following properties:

#### `signedAccountId: string`
The account ID of the currently connected wallet, or empty string if not connected.

#### `wallet: NearWalletBase | undefined`
The wallet instance from @hot-labs/near-connect.

#### `loading: boolean`
Loading state while initializing the wallet connection.

#### `signIn: () => Promise<void>`
Function to initiate wallet connection.

#### `signOut: () => Promise<void>`
Function to disconnect the current wallet.

#### `provider: JsonRpcProvider`
Direct access to the NEAR JSON-RPC provider for custom queries.

#### `connector: NearConnector`
Direct access to the NEAR connector instance from @hot-labs/near-connect.

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

## Complete Example

```tsx
import { useNearWallet } from 'near-connect-hooks';
import { utils } from 'near-api-js';

function GuestBook() {
  const { signedAccountId, viewFunction, callFunction } = useNearWallet();
  const [messages, setMessages] = useState([]);

  // Fetch messages
  useEffect(() => {
    viewFunction({
      contractId: 'guestbook.testnet',
      method: 'get_messages',
      args: { from_index: '0', limit: '10' }
    }).then(setMessages);
  }, []);

  // Add a message
  const handleSubmit = async (text: string, donation: string) => {
    const deposit = utils.format.parseNearAmount(donation);

    await callFunction({
      contractId: 'guestbook.testnet',
      method: 'add_message',
      args: { text },
      deposit
    });

    // Refresh messages
    const updated = await viewFunction({
      contractId: 'guestbook.testnet',
      method: 'get_messages',
      args: { from_index: '0', limit: '10' }
    });
    setMessages(updated);
  };

  return (
    <div>
      {messages.map((msg, i) => (
        <div key={i}>
          <strong>{msg.sender}:</strong> {msg.text}
        </div>
      ))}
    </div>
  );
}
```

## Example Project

Check out the `/example` directory for a complete Next.js application demonstrating how to use the hooks with a NEAR guestbook smart contract.

To run the example:

```bash
cd example
npm install
npm run dev
```

## Requirements

- React >= 18.0.0
- react-dom >= 18.0.0

## Dependencies

- [@hot-labs/near-connect](https://github.com/hot-dao/near-connect) - NEAR wallet connection
- @near-js/providers - NEAR RPC provider

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

Matias Benary <matiasbenary@gmail.com>

## Repository

https://github.com/matiasbenary/near-connect-hooks
