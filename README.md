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

-   `mode` (optional): Specifies the execution mode. Default is `0`.
-   `...fns`: An array of functions to be executed.
-   `...args`: Parameters to be passed to the functions.

### Modes

1. **Mode 0: (Default) Without `next`**
2. **Mode 1: With `next`**

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
	// next('not authorized'); // not authorized error
};

runWithNext(fn1, fn2)("hello", "world")
	.then(() => console.log("All functions executed"))
	.catch((err) => console.error("Error:", err));
```

### Creating a express middleware utility

```js
const expressMiddleware = run(1);

const fn1 = async (req) => {
	console.log('fn1');
};

const fn2 = async (req) => {
	console.log('fn2');
};

const expressMiddleware = (req, res, next) => {
	console.log('ex middleware', req, res, next);
	setTimeout(() => {
		next();
	}, 1000)
}
const fn3 = async (req) => "over";
const req = {};
const res = {};

run()(fn1, expressMiddleware(expressMiddleware), fn2, fn3)(req, res).then(console.log).catch(console.log);

```

## API

### `run(mode) => (...fns) => async (...args) => Promise`

#### Parameters:

-   `mode`: Number (optional) - Execution mode (0, 1). Default is `0`.
-   `...fns`: Array - Functions to be executed.
-   `...args`: Array - Parameters to be passed to the functions.

#### Returns:

-   `Promise`: Resolves when all functions are executed or when a function returns a result (in mode 0).

## License

This project is licensed under the MIT License. See the LICENSE file for details.
