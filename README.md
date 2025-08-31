# LiteKV

A lightweight TypeScript/JavaScript client for LiteKV key-value storage service.

## Installation

```bash
npm install litekv
```

## Usage

```javascript
import KVStore from "litekv";

const store = new KVStore("your-app-id");

// Set a value
await store.set("username", "john_doe");

// Get a value
const username = await store.get("username"); // 'john_doe'

// Delete a value
await store.delete("username");

// Increment a number
await store.set("counter", "0");
await store.inc("counter", 5); // counter = 5

// Decrement a number
await store.dec("counter", 2); // counter = 3
```

## Options

```javascript
const store = new KVStore("your-app-id", {
  api_url: "https://your-custom-api.com", // Default: https://litekv-api.onrender.com
  shouldCache: true, // Default: false - enables in-memory caching
});
```

> It's recommended to enable cache if values are modified by only one program.
⚠️ Make sure to keep your app key secure and not exposed


## API

### `set(key: string, value: string): Promise<boolean>`

Store a key-value pair. Returns `true` on success.

### `get(key: string): Promise<string | undefined>`

Retrieve a value by key. Returns `undefined` if key doesn't exist.

### `delete(key: string): Promise<boolean>`

Delete a key-value pair. Returns `true` on success.

### `inc(key: string, incBy?: number): Promise<boolean>`

Increment a numeric value. Defaults to increment by 1.

### `dec(key: string, decBy?: number): Promise<boolean>`

Decrement a numeric value. Defaults to decrement by 1.

## Error Handling

The client throws errors for:

- Non-existent app IDs
- Network failures
- Invalid API responses

```javascript
try {
  await store.set("key", "value");
} catch (error) {
  console.error("Operation failed:", error.message);
}
```
