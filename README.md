# Universal Middleware

Fast, lightweight middleware framework.

# Features

-   **Lightweight** - [![Badge size](https://deno.bundlejs.com/badge?q=umid&treeshake=[*]&config={"compression":"brotli"})](https://unpkg.com/umid)

-   **Browser and Node** - Use in browser and node
-   **Async Await and Promise support** - Support both async await and promise functions
-   **No Dependency** - No Bloating. No external dependencies
-   **Express.js style middlware** - Express.js like design

[![Version](https://img.shields.io/npm/v/umid.svg?color=success&style=flat-square)](https://www.npmjs.com/package/umid) [![Badge size](https://deno.bundlejs.com/badge?q=umid&treeshake=[*]&config={"compression":"brotli"})](https://unpkg.com/umid) [![Badge size](https://deno.bundlejs.com/badge?q=umid&treeshake=[*]&config={"compression":"gzip"})](https://unpkg.com/umid)

**yarn**: `yarn add umid`

**npm**: `npm i umid`

**cdn**: https://unpkg.com/umid

**module**: https://unpkg.com/umid?module

## Installation

To use this utility, simply import it into your project:

```javascript
import { run } from "umid";
```

## Usage

The `run` function accepts a mode and returns a function that accepts an array of functions to be executed asynchronously. The execution behavior depends on the mode specified.

### Parameters

-   `mode` (optional): Specifies the execution mode. Default is `2`.
-   `...fns`: An array of functions to be executed.
-   `...args`: Parameters to be passed to the functions.

### Modes

1. **Mode 0: Without `next`**
2. **Mode 1: With `next`**
3. **Mode 2: (Default) Both**

### Examples

#### Mode 0: Without `next`

In this mode, the functions are called sequentially without a `next` callback.

```javascript
const runWithoutNext = run(0);

const fn1 = async (param1, param2) => {
	console.log("fn1", param1, param2);
};

const fn2 = async (param1, param2) => {
	console.log("fn2", param1, param2);
	return "result2";
};

runWithoutNext(fn1, fn2)("hello", "world")
	.then((result) => console.log("Final result:", result))
	.catch((err) => console.error("Error:", err));
```

#### Mode 1: With `next`

In this mode, the functions are called sequentially with a `next` callback, which must be called to proceed to the next function.

```javascript
const runWithNext = run(1);

const fn1 = async (param1, param2, next) => {
	console.log("fn1", param1, param2);
	next();
};

const fn2 = async (param1, param2, next) => {
	console.log("fn2", param1, param2);
	next();
};

runWithNext(fn1, fn2)("hello", "world")
	.then(() => console.log("All functions executed"))
	.catch((err) => console.error("Error:", err));
```

#### Mode 2: Both

In this mode, the functions are called sequentially and can choose whether to call `next` or return a result. If a function returns a result, the chain is resolved with that result.

```javascript
const runBoth = run(2);

const fn1 = async (param1, param2, next) => {
	console.log("fn1", param1, param2);
	next();
};

const fn2 = async (param1, param2) => {
	console.log("fn2", param1, param2);
	return "result2";
};

runBoth(fn1, fn2)("hello", "world")
	.then((result) => console.log("Final result:", result))
	.catch((err) => console.error("Error:", err));
```

## API

### `run(mode) => (...fns) => async (...args) => Promise`

#### Parameters:

-   `mode`: Number (optional) - Execution mode (0, 1, or 2). Default is `0`.
-   `...fns`: Array - Functions to be executed.
-   `...args`: Array - Parameters to be passed to the functions.

#### Returns:

-   `Promise`: Resolves when all functions are executed or when a function returns a result (in mode 0 or 2).

## License

This project is licensed under the MIT License. See the LICENSE file for details.
