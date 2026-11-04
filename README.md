# Universal Middleware (umid)

**Fast, lightweight middleware framework with zero dependencies.**

[![Version](https://img.shields.io/npm/v/umid.svg?color=success&style=flat-square)](https://www.npmjs.com/package/umid) [![Brotli Size](https://deno.bundlejs.com/badge?q=umid&treeshake=[*]&config={"compression":"brotli"})](https://unpkg.com/umid) [![Gzip Size](https://deno.bundlejs.com/badge?q=umid&treeshake=[*]&config={"compression":"gzip"})](https://unpkg.com/umid) [![License](https://img.shields.io/npm/l/umid.svg)](https://github.com/kethan/umid/blob/master/LICENSE) [![TypeScript](https://img.shields.io/badge/TypeScript-Definitions-blue.svg)](https://github.com/kethan/umid)

**📦 Zero dependencies**

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
  - [Express-like Middleware](#1-express-like-middleware)
  - [Data Processing Pipelines](#2-data-processing-pipelines)
  - [Plugin Systems](#3-plugin-systems)
  - [Request/Response Processing](#4-requestresponse-processing)
  - [Context-based Middleware](#5-context-based-middleware)
  - [API Gateway Middleware](#6-api-gateway-middleware)
  - [Event Processing Pipeline](#7-event-processing-pipeline)
  - [Validation Middleware Chain](#8-validation-middleware-chain)
  - [Webhook Processor](#9-webhook-processor)
  - [Caching Middleware](#10-caching-middleware)
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

In Mode 1, functions receive a `next` callback as the last parameter. You **must** call `next()` to proceed to the next function, or `next(error)` to stop execution with an error. The error can be an Error object or a string - both are valid.

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

### 6. API Gateway Middleware

Build a lightweight API gateway with request/response transformation:

```javascript
import { run } from 'umid';
import http from 'http';

const gateway = run(1);

// Request logging
const logRequest = async (req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  req.startTime = Date.now();
  await next();
};

// Route matching
const routeMatcher = async (req, res, next) => {
  const [resource, id] = req.url.split('/').filter(Boolean);
  req.resource = resource;
  req.params = { id };
  await next();
};

// Authentication
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    req.user = await validateToken(authHeader.split(' ')[1]);
  }
  await next();
};

// Rate limiting
const rateLimiter = async (req, res, next) => {
  const ip = req.socket.remoteAddress;
  const limit = await rateLimitStore.increment(ip);
  if (limit > 100) {
    res.writeHead(429, { 'Content-Type': 'application/json' });
    return next(new Error('Rate limit exceeded'));
  }
  await next();
};

// Handler
const apiHandler = async (req, res, next) => {
  const data = await handleRequest(req);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
  await next();
};

// Error handler
const errorHandler = async (err, req, res, next) => {
  console.error('Error:', err);
  res.writeHead(500, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: err.message }));
  await next();
};

// Create HTTP server
const server = http.createServer((req, res) => {
  gateway(
    logRequest,
    routeMatcher,
    authenticate,
    rateLimiter,
    apiHandler,
    errorHandler
  )(req, res).catch(err => {
    res.writeHead(500);
    res.end('Internal Server Error');
  });
});

server.listen(3000, () => console.log('API Gateway running on port 3000'));
```

### 7. Event Processing Pipeline

Process events through a chain of handlers:

```javascript
import { run } from 'umid';

const processEvent = run(0);

// Event validation
const validateEvent = async (event) => {
  if (!event.type) throw new Error('Event type required');
  if (!event.timestamp) event.timestamp = Date.now();
};

// Event enrichment
const enrichEvent = async (event) => {
  event.meta = {
    ip: event.ip || 'unknown',
    userAgent: event.userAgent || 'unknown',
    region: await getRegion(event.ip)
  };
};

// Event filtering
const filterSensitive = async (event) => {
  if (event.type === 'login') {
    delete event.password;
    delete event.token;
  }
};

// Event normalization
const normalizeEvent = async (event) => {
  event.type = event.type.toLowerCase();
  event.timestamp = new Date(event.timestamp).toISOString();
};

// Event persistence
const saveEvent = async (event) => {
  await analyticsStore.insert(event);
  return { success: true, eventId: event.id };
};

// Process incoming event
const result = await processEvent(
  validateEvent,
  enrichEvent,
  filterSensitive,
  normalizeEvent,
  saveEvent
)({
  type: 'USER_LOGIN',
  userId: 'user-123',
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0'
});

console.log('Event processed:', result);
```

### 8. Validation Middleware Chain

Create a chain of validators for form data:

```javascript
import { run } from 'umid';

const validateForm = run(0);

// Required field validation
const required = (fields) => async (data) => {
  for (const field of fields) {
    if (!data[field]) {
      throw new Error(`Field '${field}' is required`);
    }
  }
};

// Email validation
const validateEmail = async (data) => {
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    throw new Error('Invalid email format');
  }
};

// Password strength validation
const validatePassword = async (data) => {
  if (data.password && data.password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
};

// Unique username validation
const validateUniqueUsername = async (data) => {
  if (data.username) {
    const exists = await userStore.exists({ username: data.username });
    if (exists) {
      throw new Error('Username already taken');
    }
  }
};

// Sanitization
const sanitize = async (data) => {
  return {
    username: data.username?.trim(),
    email: data.email?.trim().toLowerCase(),
    password: data.password
  };
};

// Validate and sanitize form data
try {
  const cleanData = await validateForm(
    required(['username', 'email', 'password']),
    validateEmail,
    validatePassword,
    validateUniqueUsername,
    sanitize
  )({
    username: '  john_doe  ',
    email: 'JOHN@EXAMPLE.COM',
    password: 'securePassword123'
  });

  console.log('Valid data:', cleanData);
} catch (error) {
  console.error('Validation failed:', error.message);
}
```

### 9. Webhook Processor

Process incoming webhooks from external services:

```javascript
import { run } from 'umid';
import crypto from 'crypto';

const processWebhook = run(1);

// Verify signature (GitHub, Stripe, etc.)
const verifySignature = async (req, res, next) => {
  const signature = req.headers['x-hub-signature-256'];
  const payload = JSON.stringify(req.body);
  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(payload)
    .digest('hex')}`;
  
  if (signature !== expectedSignature) {
    return next(new Error('Invalid signature'));
  }
  await next();
};

// Parse event type
const parseEvent = async (req, res, next) => {
  req.eventType = req.headers['x-github-event'] || req.body.type;
  req.eventId = req.headers['x-github-delivery'] || req.body.id;
  await next();
};

// Handle specific events
const handlePushEvent = async (req, res, next) => {
  if (req.eventType === 'push') {
    const { repository, ref, commits } = req.body;
    console.log(`New push to ${repository.full_name}@${ref}`);
    for (const commit of commits) {
      console.log(`  - ${commit.message} by ${commit.author.name}`);
    }
  }
  await next();
};

const handlePullRequestEvent = async (req, res, next) => {
  if (req.eventType === 'pull_request') {
    const { action, pull_request } = req.body;
    console.log(`PR ${action}: ${pull_request.title} (#${pull_request.number})`);
  }
  await next();
};

// Acknowledge receipt
const acknowledge = async (req, res, next) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
  await next();
};

// Process webhook
const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    req.body = JSON.parse(body);
    processWebhook(
      verifySignature,
      parseEvent,
      handlePushEvent,
      handlePullRequestEvent,
      acknowledge
    )(req, res).catch(err => {
      console.error('Webhook error:', err);
      res.writeHead(400);
      res.end('Bad Request');
    });
  });
});

server.listen(8080, () => console.log('Webhook processor running on port 8080'));
```

### 10. Caching Middleware

Implement a caching layer with middleware:

```javascript
import { run } from 'umid';

const withCache = run(1);

// Cache middleware
const cacheMiddleware = (cache, options = {}) => {
  const { ttl = 60 } = options;
  
  return async (req, res, next) => {
    const key = req.url + JSON.stringify(req.query);
    const cached = await cache.get(key);
    
    if (cached && !req.headers['no-cache']) {
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'X-Cache': 'HIT'
      });
      return res.end(cached);
    }
    
    // Cache miss - proceed and cache the response
    const originalEnd = res.end;
    const chunks = [];
    
    res.end = (data) => {
      if (data) chunks.push(data);
      const body = Buffer.concat(chunks).toString();
      cache.set(key, body, ttl);
      res.setHeader('X-Cache', 'MISS');
      originalEnd.call(res, data);
    };
    
    await next();
  };
};

// Handler
const handler = async (req, res, next) => {
  const data = await fetchData(req.url);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
  await next();
};

// Create cached endpoint
const cachedHandler = withCache(redisCache, { ttl: 300 });

const server = http.createServer((req, res) => {
  cachedHandler(handler)(req, res).catch(err => {
    res.writeHead(500);
        res.end('Internal Server Error');
  });
});
```

## 🧩 Utility Functions

Inspired by [uqry](https://github.com/kethan/uqry)'s operator pattern, umid provides utility functions for combining and controlling middleware execution.

### Mode Compatibility Summary

| Category | Mode 0 (Return-based) | Mode 1 (next()-based) |
|----------|----------------------|----------------------|
| **Logical** | `or`, `not` | `and`, `before`, `after` |
| **Parallel** | `race`, `all`, `any`, `parallel` | - |
| **Sequential** | `sequence`, `pipe`, `waterfall` | - |
| **Control Flow** | `retry`, `timeout`, `cache`, `validate`, `when`, `tap` | - |
| **Additional** | `compose`, `apply`, `memoize`, `debounce`, `throttle`, `once`, `wrap`, `tryCatch`, `pass`, `skip`, `identity`, `noop` | - |

> **Note:** Mode 1 utilities (`and`, `before`, `after`) use the Express-like middleware pattern where you must call `next()` or `next(error)`. All other utilities use Mode 0 (return-based) pattern.

> **Error Handling in Mode 1:** You can pass either an Error object or a string to `next()`. Both `next(new Error('message'))` and `next('message')` work correctly.

### Import

```javascript
import { run, and, or, not, when, retry, timeout } from 'umid';
// or
import * as utils from 'umid/utils';
```

### Logical Operators

| Function | Mode | Description | Example |
|----------|------|-------------|---------|
| `and(...mw)` | 1 | All middleware must execute successfully (Express-style) | `and(auth, logger, rateLimit)` |
| `or(...mw)` | 0 | First truthy result wins | `or(cache, db, fallback)` |
| `not(mw)` | 0 | Inverts middleware behavior (truthy → undefined) | `not(auth)` |

**Example: AND (Mode 1)**
```javascript
import { run, and } from 'umid';

const middleware = and(
    auth,
    rateLimit,
    cors
);

// All three middleware must call next() without error
await middleware(req, res);
```

**Example: OR (Mode 0)**
```javascript
import { run, or } from 'umid';

const middleware = or(
    tryCache,
    tryDatabase,
    tryFallback
);

// Returns result of first middleware that returns truthy value
const result = await middleware(ctx);
```

### Parallel Execution

| Function | Mode | Description | Example |
|----------|------|-------------|---------|
| `race(...mw)` | 0 | First to complete wins | `race(fastPath, slowPath)` |
| `all(...mw)` | 0 | All in parallel, returns array | `all(mw1, mw2, mw3)` |
| `any(...mw)` | 0 | First success | `any(tryA, tryB, tryC)` |
| `parallel(...mw)` | 0 | Execute all in parallel | `parallel(mw1, mw2)` |

**Example: Race**
```javascript
import { run, race } from 'umid';

const result = await race(
    async () => fetchFromCache(),
    async () => fetchFromAPI()
)({});
// Returns result from whichever completes first
```

**Example: All**
```javascript
import { run, all } from 'umid';

const results = await all(
    fetchUser,
    fetchPosts,
    fetchComments
)({ userId: 1 });
// results = [user, posts, comments]
```

### Sequential Execution

| Function | Mode | Description | Example |
|----------|------|-------------|---------|
| `sequence(...mw)` | 0 | Sequential with result passing | `sequence(validate, transform)` |
| `pipe(...mw)` | 0 | Single arg passing | `pipe(validate, save)` |
| `waterfall(...mw)` | 0 | Sequential with result accumulation | `waterfall(mw1, mw2)` |

**Example: Sequence**
```javascript
import { run, sequence } from 'umid';

const result = await sequence(
    validate,
    sanitize,
    transform,
    save
)({ data: 'raw' });
// Each middleware receives the result of the previous one
```

**Example: Pipe**
```javascript
import { run, pipe } from 'umid';

const result = await pipe(
    validate,
    normalize,
    enrich
)(rawData);
// Single argument passed through each middleware
```

### Control Flow

| Function | Mode | Description | Example |
|----------|------|-------------|---------|
| `retry(n, ms, mw)` | 0 | Retry on failure | `retry(3, 1000, fetch)` |
| `timeout(ms, mw)` | 0 | Add timeout | `timeout(5000, fetch)` |
| `cache(mw, getKey)` | 0 | Cache results | `cache(expensiveOp)` |
| `validate(v, mw)` | 0 | Validate first | `validate(schema, handler)` |
| `when(cond, mw, else)` | 0 | Conditional | `when(isAuth, auth, guest)` |
| `tap(...mw)` | 0 | Side effects only | `tap(logger, handler)` |

**Example: Retry**
```javascript
import { run, retry } from 'umid';

const result = await retry(3, 1000, fetchData)({ url: '/api' });
// Tries up to 3 times with 1 second delay between attempts
```

**Example: Timeout**
```javascript
import { run, timeout } from 'umid';

const result = await timeout(5000, expensiveOperation)({});
// Rejects with timeout error if operation takes > 5 seconds
```

**Example: When (Conditional)**
```javascript
import { run, when } from 'umid';

const middleware = when(
    ctx => ctx.user && ctx.user.role === 'admin',
    adminMiddleware,
    userMiddleware
);

await middleware(ctx);
// Executes adminMiddleware if user is admin, otherwise userMiddleware
```

**Example: Cache**
```javascript
import { run, cache } from 'umid';

const cachedFetch = cache(fetchData, (ctx) => ctx.url);

const result1 = await cachedFetch({ url: '/api/data' });
const result2 = await cachedFetch({ url: '/api/data' }); // Returns cached result
```

**Example: Tap (Side Effects)**
```javascript
import { run, tap } from 'umid';

const middleware = tap(
    logger,    // Executed for side effect
    handler    // Result comes from this
);

const result = await middleware(ctx);
// logger was called, but result is from handler
```

### Complete Example

```javascript
import { run, and, or, when, retry, timeout, validate } from 'umid';

// Define middleware
const validateUser = async (ctx, next) => {
    if (!ctx.user) throw new Error('Unauthorized');
    await next();
};

const rateLimit = async (ctx, next) => {
    const limit = await checkRateLimit(ctx.ip);
    if (limit.exceeded) throw new Error('Rate limited');
    await next();
};

const fetchData = async (ctx, next) => {
    ctx.data = await database.query(ctx.query);
    await next();
};

// Compose middleware
const apiMiddleware = and(
    validateUser,
    rateLimit,
    when(
        ctx => ctx.cache,
        cache(fetchData),
        retry(3, 1000, fetchData)
    )
);

// Use it
await apiMiddleware(req, res);
```

### Additional Utilities

| Function | Mode | Description | Example |
|----------|------|-------------|---------|
| `compose(...mw)` | 0 | Alias for sequence | `compose(validate, transform)` |
| `apply(value, ...mw)` | 0 | Apply middleware to a value | `apply(data, validate, save)` |
| `memoize(mw, getKey)` | 0 | Memoize with cache | `memoize(expensiveOp)` |
| `debounce(ms, mw)` | 0 | Debounce calls | `debounce(300, handler)` |
| `throttle(ms, mw)` | 0 | Throttle calls | `throttle(1000, handler)` |
| `once(mw)` | 0 | Execute only once | `once(initialize)` |
| `before(beforeMw, mainMw)` | 1 | Execute before main | `before(logger, handler)` |
| `after(mainMw, afterMw)` | 1 | Execute after main | `after(handler, logger)` |
| `wrap(mw, hooks)` | 0 | Wrap with before/after hooks | `wrap(handler, { before, after })` |
| `tryCatch(mw, errorMw)` | 0 | Try-catch wrapper | `tryCatch(handler, errorHandler)` |
| `pass(...mw)` | 0 | Alias for tap | `pass(logger, handler)` |
| `skip(cond, mw)` | 0 | Skip based on condition | `skip(isAuth, auth)` |
| `identity(x)` | 0 | Returns input unchanged | `identity(data)` |
| `noop()` | 0 | No operation | `noop()` |

**Example: Memoize**
```javascript
import { memoize } from 'umid';

const expensiveFetch = memoize(async (ctx) => {
    const result = await fetchData(ctx.url);
    return result;
});

// First call executes the function
const result1 = await expensiveFetch({ url: '/api/data' });

// Second call with same args returns cached result
const result2 = await expensiveFetch({ url: '/api/data' });
```

**Example: Debounce**
```javascript
import { debounce } from 'umid';

const debouncedSearch = debounce(300, async (ctx) => {
    const results = await search(ctx.query);
    return results;
});

// Multiple rapid calls will be debounced
debouncedSearch({ query: 'a' });
debouncedSearch({ query: 'ab' });
debouncedSearch({ query: 'abc' });
// Only the last call executes after 300ms
```

**Example: Try-Catch**
```javascript
import { tryCatch } from 'umid';

const safeFetch = tryCatch(
    async (ctx) => fetchData(ctx.url),
    async (err, ctx) => {
        console.error('Fetch failed:', err);
        return { error: err.message };
    }
);

const result = await safeFetch({ url: '/api/data' });
// Either returns data or { error: ... }
```

**Example: Wrap with Hooks**
```javascript
import { wrap } from 'umid';

const withTiming = wrap(
    async (ctx) => {
        // Main middleware
        return await processData(ctx);
    },
    {
        before: async (ctx) => {
            ctx.startTime = Date.now();
        },
        after: async (ctx) => {
            ctx.duration = Date.now() - ctx.startTime;
            console.log('Processing took:', ctx.duration, 'ms');
        }
    }
);

const result = await withTiming(ctx);
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
