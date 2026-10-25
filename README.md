# Universal Middleware (umid)

**Fast, lightweight middleware framework with zero dependencies.**

[![Version](https://img.shields.io/npm/v/umid.svg?color=success&style=flat-square)](https://www.npmjs.com/package/umid) [![Badge size](https://deno.bundlejs.com/badge?q=umid&treeshake=[*]&config={"compression":"brotli"})](https://unpkg.com/umid) [![Badge size](https://deno.bundlejs.com/badge?q=umid&treeshake=[*]&config={"compression":"gzip"})](https://unpkg.com/umid) [![License](https://img.shields.io/npm/l/umid.svg)](https://github.com/kethan/umid/blob/master/LICENSE) [![TypeScript](https://img.shields.io/badge/TypeScript-Definitions-blue.svg)](https://github.com/kethan/umid)

**📦 Size**: ~1KB (minified), ~500 bytes (brotli compressed) - **Zero dependencies**

**🌐 Environments**: Browser, Node.js, Bun, Deno

**💻 Installation**

```bash
yarn add umid
# or
npm i umid
```

**📥 CDN**

```html
<!-- ES Module -->
<script type="module">
  import { run } from 'https://unpkg.com/umid?module';
</script>

<!-- UMD (works in any environment) -->
<script src="https://unpkg.com/umid"></script>
```

## 🎯 Features

- ✅ **Ultra-lightweight** - Tiny bundle size, no dependencies
- ✅ **Universal** - Works in browsers, Node.js, and any JavaScript environment
- ✅ **Dual Mode** - Two execution modes for different use cases
- ✅ **Async/Await** - Full support for async functions and Promises
- ✅ **TypeScript** - Complete type definitions included
- ✅ **Express-like** - Familiar middleware pattern for Express.js developers
- ✅ **Nested Arrays** - Automatically flattens nested function arrays
- ✅ **Error Handling** - Comprehensive error propagation

## 📚 Table of Contents

- [Installation](#-installation)
- [Features](#-features)
- [Usage](#-usage)
  - [Mode 0: Sequential Execution](#mode-0-sequential-execution)
  - [Mode 1: Middleware with Next](#mode-1-middleware-with-next)
- [Use Cases](#-use-cases)
  - [Express-like Middleware](#express-like-middleware)
  - [Data Processing Pipelines](#data-processing-pipelines)
  - [Plugin Systems](#plugin-systems)
  - [Request/Response Processing](#requestresponse-processing)
  - [Context-based Middleware](#context-based-middleware)
- [API Reference](#-api-reference)
- [Examples](#-examples)
- [Comparison](#-comparison)
- [License](#-license)

## 🚀 Usage

### Import

```javascript
// ES Module (recommended)
import { run } from 'umid';

// CommonJS
const { run } = require('umid');

// UMD (browser)
const run = umid.run;
```

### Mode 0: Sequential Execution

In Mode 0, functions are executed sequentially **without** a `next` callback. If a function returns a truthy value, the chain stops and returns that value.

```javascript
import { run } from 'umid';

const execute = run(0); // or just run() since 0 is default

const logger = async (data) => {
  console.log('Processing:', data);
};

const validator = async (data) => {
  if (!data.value) throw new Error('Invalid data');
};

const transformer = async (data) => {
  data.value = data.value * 2;
  return data; // Returns a truthy value, stops the chain
};

const finalizer = async (data) => {
  // This won't be called because transformer returned a value
  console.log('Finalizing');
};

// Execute the pipeline
await execute(logger, validator, transformer, finalizer)({ value: 5 });
// Output: Processing: { value: 5 }
// Returns: { value: 10 }
```

**Key Characteristics:**
- Functions receive only the arguments you pass
- No `next` callback
- Chain stops when a function returns a truthy value
- All functions receive the same arguments
- Perfect for data transformation pipelines

### Mode 1: Middleware with Next

In Mode 1, functions receive a `next` callback as the last parameter. You **must** call `next()` to proceed to the next function, or `next(error)` to stop execution with an error.

```javascript
import { run } from 'umid';

const middleware = run(1);

const logger = async (req, res, next) => {
  console.log('Request received');
  await next(); // Proceed to next middleware
};

const auth = async (req, res, next) => {
  if (!req.user) {
    next(new Error('Unauthorized'));
    return;
  }
  await next(); // User is authenticated, proceed
};

const handler = async (req, res, next) => {
  res.send({ message: 'Hello!' });
  await next();
};

// Execute the middleware chain
const req = { user: { id: 1 } };
const res = { send: console.log };

await middleware(logger, auth, handler)(req, res);
// Output: Request received
// Output: { message: 'Hello!' }
```

**Key Characteristics:**
- Functions receive a `next` callback as the last parameter
- Must call `next()` to continue the chain
- Call `next(error)` to stop with an error
- Similar to Express.js middleware
- Perfect for HTTP middleware chains

## 🎯 Use Cases

### 1. Express-like Middleware

Create Express.js-style middleware chains without Express:

```javascript
import { run } from 'umid';

const app = run(1);

// Middleware
const cors = async (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  await next();
};

const auth = async (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return next(new Error('Unauthorized'));
  req.user = await validateToken(token);
  await next();
};

const rateLimit = async (req, res, next) => {
  const limit = await checkRateLimit(req.ip);
  if (limit.exceeded) return next(new Error('Rate limit exceeded'));
  await next();
};

const handler = async (req, res, next) => {
  res.json({ data: 'protected data' });
  await next();
};

// Use the middleware
const req = { headers: { authorization: 'Bearer token' }, ip: '127.0.0.1' };
const res = {
  setHeader: console.log,
  json: (data) => console.log('Response:', data)
};

await app(cors, auth, rateLimit, handler)(req, res);
```

### 2. Data Processing Pipelines

Process data through a series of transformations:

```javascript
import { run } from 'umid';

const pipeline = run(0);

const validate = async (data) => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid input');
  }
};

const sanitize = async (data) => {
  // Remove sensitive fields
  delete data.password;
  delete data.token;
};

const normalize = async (data) => {
  // Convert to consistent format
  data.email = data.email?.toLowerCase();
  data.createdAt = new Date(data.createdAt);
};

const enrich = async (data) => {
  // Add derived fields
  data.fullName = `${data.firstName} ${data.lastName}`;
  data.isActive = data.lastLogin > Date.now() - 30 * 24 * 60 * 60 * 1000;
};

const save = async (data) => {
  const result = await database.save(data);
  return result; // Returns the saved document
};

// Process user data
const user = await pipeline(
  validate,
  sanitize,
  normalize,
  enrich,
  save
)({
  firstName: 'John',
  lastName: 'Doe',
  email: 'JOHN@EXAMPLE.COM',
  password: 'secret',
  createdAt: '2024-01-01'
});

console.log(user); // { firstName: 'John', lastName: 'Doe', email: 'john@example.com', fullName: 'John Doe', ... }
```

### 3. Plugin Systems

Build extensible plugin architectures:

```javascript
import { run } from 'umid';

class PluginSystem {
  constructor() {
    this.plugins = [];
    this.runner = run(1);
  }

  use(plugin) {
    this.plugins.push(plugin);
    return this;
  }

  async execute(context) {
    return this.runner(...this.plugins)(context);
  }
}

// Create plugin system
const plugins = new PluginSystem();

// Add plugins
plugins.use(async (ctx, next) => {
  console.log('Plugin 1: Initializing');
  ctx.data = { ...ctx.data, plugin1: true };
  await next();
});

plugins.use(async (ctx, next) => {
  console.log('Plugin 2: Processing');
  ctx.data = { ...ctx.data, plugin2: true };
  await next();
});

plugins.use(async (ctx, next) => {
  console.log('Plugin 3: Finalizing');
  ctx.data = { ...ctx.data, plugin3: true };
  await next();
});

// Execute all plugins
await plugins.execute({ data: {} });
console.log('Final context:', ctx);
// Output: { data: { plugin1: true, plugin2: true, plugin3: true } }
```

### 4. Request/Response Processing

Handle HTTP requests with a clean middleware pattern:

```javascript
import { run } from 'umid';
import http from 'http';

const middleware = run(1);

const parseBody = async (req, res, next) => {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try {
      req.body = JSON.parse(body);
      next();
    } catch (err) {
      next(err);
    }
  });
};

const validate = async (req, res, next) => {
  if (!req.body || !req.body.userId) {
    res.statusCode = 400;
    return next(new Error('Missing userId'));
  }
  next();
};

const handler = async (req, res, next) => {
  const user = await getUser(req.body.userId);
  res.end(JSON.stringify(user));
  next();
};

const errorHandler = async (err, req, res, next) => {
  console.error('Error:', err.message);
  res.statusCode = res.statusCode || 500;
  res.end(JSON.stringify({ error: err.message }));
  next();
};

// Create HTTP server
const server = http.createServer((req, res) => {
  middleware(parseBody, validate, handler, errorHandler)(req, res)
    .catch(err => {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    });
});

server.listen(3000, () => console.log('Server running on port 3000'));
```

### 5. Context-based Middleware

Build middleware that operates on a shared context object:

```javascript
import { run } from 'umid';

const middleware = run(1);

const context = {
  user: null,
  requestId: 'req-' + Date.now(),
  startTime: Date.now(),
  data: {}
};

const authenticate = async (ctx, next) => {
  const token = ctx.headers?.authorization;
  if (token) {
    ctx.user = await validateToken(token);
  }
  await next();
};

const authorize = async (ctx, next) => {
  if (ctx.user?.role !== 'admin') {
    return next(new Error('Forbidden'));
  }
  await next();
};

const logRequest = async (ctx, next) => {
  console.log(`[${ctx.requestId}] Request from ${ctx.user?.id || 'anonymous'}`);
  await next();
};

const measureTime = async (ctx, next) => {
  const start = Date.now();
  await next();
  ctx.duration = Date.now() - start;
};

const handler = async (ctx, next) => {
  ctx.data.result = await processRequest(ctx);
  await next();
};

// Execute with context
await middleware(
  authenticate,
  authorize,
  logRequest,
  measureTime,
  handler
)(context);

console.log(`Request completed in ${context.duration}ms`);
```

## 📖 API Reference

### `run(mode)`

Creates a middleware executor with the specified mode.

#### Parameters

- `mode` (number, optional): Execution mode. Default is `0`.
  - `0`: Sequential execution without `next` callback
  - `1`: Express-like middleware with `next` callback

#### Returns

A curried function that accepts middleware functions and returns an executor.

#### TypeScript

```typescript
import { run, type MiddlewareFunction, type NextFunction } from 'umid';

// Mode 0: Functions don't receive next callback
type Mode0Function<T extends any[]> = (...args: T) => Promise<any> | void;

// Mode 1: Functions receive next callback as last parameter
type Mode1Function<T extends any[]> = (...args: [...T, NextFunction]) => Promise<void>;

// The run function
declare function run(mode?: number): <T extends any[]>(...fns: MiddlewareFunction<T>[]) => (...args: T) => Promise<any>;
```

### Complete TypeScript Example

```typescript
import { run, type NextFunction } from 'umid';

interface Context {
  user?: { id: string; role: string };
  requestId: string;
  data: Record<string, any>;
}

interface Request {
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: any;
}

interface Response {
  status: number;
  body?: any;
  send: (data: any) => void;
}

// Mode 0: Data pipeline
const pipeline = run(0);

const validate: MiddlewareFunction<[Context]> = async (ctx) => {
  if (!ctx.user) throw new Error('User required');
};

const process: MiddlewareFunction<[Context]> = async (ctx) => {
  ctx.data.processed = true;
  return ctx;
};

// Mode 1: HTTP middleware
const middleware = run(1);

const auth: MiddlewareFunction<[Request, Response, NextFunction]> = async (req, res, next) => {
  if (!req.headers.authorization) {
    next(new Error('Unauthorized'));
    return;
  }
  await next();
};

const handler: MiddlewareFunction<[Request, Response, NextFunction]> = async (req, res, next) => {
  res.body = { success: true };
  await next();
};
```

## 📊 Comparison

| Feature | umid | Express.js | Koa | Connect |
|---------|------|-----------|-----|---------|
| **Dependencies** | 0 | ~30 | ~10 | ~5 |
| **Size** | ~1KB | ~50KB | ~5KB | ~2KB |
| **Middleware Pattern** | ✅ | ✅ | ✅ | ✅ |
| **Async/Await** | ✅ | ✅ | ✅ | ✅ |
| **Browser Support** | ✅ | ❌ | ✅ | ❌ |
| **Zero Config** | ✅ | ❌ | ✅ | ✅ |
| **TypeScript** | ✅ | ✅ | ✅ | ❌ |
| **Dual Mode** | ✅ | ❌ | ❌ | ❌ |
| **Nested Arrays** | ✅ | ❌ | ❌ | ❌ |
| **No Framework** | ✅ | ❌ | ❌ | ❌ |

**umid is perfect when you need:**
- Lightweight middleware without framework overhead
- Browser and Node.js compatibility
- Simple, composable middleware chains
- Zero dependencies

**Consider Express.js or Koa when you need:**
- Full HTTP server framework
- Routing
- Templating
- Built-in utilities

## 🧪 Testing

umid has comprehensive test coverage with 35+ tests covering:

- ✅ Sequential execution (Mode 0)
- ✅ Middleware execution (Mode 1)
- ✅ Error handling
- ✅ Promise handling
- ✅ Nested arrays
- ✅ Synchronous and asynchronous functions
- ✅ Edge cases
- ✅ Real-world use cases

Run tests:

```bash
npm test
# or
npm run test:watch  # Watch mode
npm run test:coverage  # With coverage
```

## 📝 Changelog

### v4.0.0
- Revamped code with only 2 modes (0 and 1)
- Simplified API
- **New**: TypeScript definitions
- **New**: More comprehensive tests (35+ tests)
- **New**: Enhanced documentation with use cases

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a PR.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

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
