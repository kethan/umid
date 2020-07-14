# Universal Middleware

Fast, lightweight middleware framework.

# Features

* **Lightweight** - less than 370 bytes minified
* **Browser and Node** - Use in browser and node
* **Async Await and Promise support** - Support both async await and promise functions
* **No Dependency** - No Bloating. No external dependencies
* **Express.js style middlware** - Express.js like design

# Install

```
$ npm install --save umid
```
# Usage

## Basic Example

```js
const Middleware = require("umid");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let m = new Middleware();

m.use((context, next) => {
	console.log("M1 context", context);
	context.exec = "M1 executed";
	next();
}).use(async (context, next) => {
	await sleep(2000);
	console.log("M2 context", context);
	context.exec = "M2 executed in 2 seconds";
	next();
});

let m3 = async (context, next) => {
	await sleep(1000);
	console.log("M3 context", context);
	context.exec = "M3 executed in 1 second";
	next();
};

let m4 = async (context, next) => {
	console.log("M4 context", context);
	context.exec = "M4 executed";
	next();
};

let m5 = async (context, next) => {
	console.log("M5 context", context);
	context.exec = "M5 executed";
	next();
};

let errorMiddleware = async (context, next) => {
	throw "got error!!";
	next();
};

m.use(m3, [m4, m5]);

// A middleware with error
// m.use(errorMiddleware);

let context = {};

m.process((err, context) => {
	if (err) console.log("error!", err, context);
	else console.log("Complete!", context);
}, context);

```

# API

### Middleware()

Returns an instance of a middleware

### use((context, next))

Attach context and middleware(s).

These are the different signatures for use function

#### use(...middlewares)
#### use(middleware)
#### use([middleware1, middleware2])
#### use(middleware1, middleware2)

### context
The context that passes to the next middleware. This can be updated and passed on to next middleware.

### next
Type: Function

Most importantly, a middleware must either call next() or terminate the response with next('reason').

#### process((err, context), initialContext)

Its signature is (err, context), where err is the String or Error thrown by your middleware.

### (err,context)
Type: Function

A catch-all error handler; executed whenever a middleware throws an error.

### intialContext

This is for assigning the middlewares with intial context object to pass.

### Middleware Errors

If an error arises within a middleware, the loop will be exited. This means that no other middleware will execute.

There are three ways to "throw" an error from within a middleware function.

1. Pass any string to next('Err')

This will exit the loop with your error string as the error message.

```js
new Middleware().use((context, next) => {
  let err = new Error('Try again');
  next(err);
});
```

2. Pass an Error to next()

This is similar to the above option.

```js
new Middleware().use((context, next) => {
  let err = new Error('Try again');
  next(err);
});
```
3. Terminate with throw

```js
new Middleware().use((context, next) => {
  let err = new Error('Try again');
  throw err;
});
```

# License

MIT © Kethan Surana
