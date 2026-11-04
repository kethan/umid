/**
 * Utility functions for umid middleware
 * 
 * These utilities provide logical operators for combining middleware functions
 * in various ways, similar to the operators in uqry.
 */

import { run } from './index.js';

/**
 * AND operator - All middleware must execute successfully
 * Continues to next middleware only if current one calls next()
 * If any middleware calls next(error), the chain stops with that error
 * 
 * @example
 * ```javascript
 * import { run, and } from 'umid';
 * 
 * const middleware = and(auth, logger, rateLimit);
 * await middleware(req, res);
 * ```
 */
export function and(...middleware) {
    return run(1)(...middleware);
}

/**
 * OR operator - Executes middleware until one succeeds
 * Returns the result of the first middleware that returns a truthy value (Mode 0)
 * Or continues until one doesn't throw an error (Mode 1)
 * 
 * @example
 * ```javascript
 * import { run, or } from 'umid';
 * 
 * const middleware = or(tryCache, tryDatabase, tryFallback);
 * const result = await middleware(ctx);
 * ```
 */
export function or(...middleware) {
    return run(0)(...middleware);
}

/**
 * NOT operator - Inverts the middleware behavior
 * If the middleware returns a truthy value, it returns undefined
 * If the middleware returns a falsy value, it returns the value
 * 
 * @example
 * ```javascript
 * import { run, not } from 'umid';
 * 
 * const middleware = not(auth);
 * // If auth returns a user, not(auth) returns undefined
 * // If auth returns undefined/null/false, not(auth) returns that value
 * ```
 */
export function not(middleware) {
    return async function(...args) {
        const result = await middleware(...args);
        return result ? undefined : result;
    };
}

/**
 * RACE operator - Executes middleware in parallel, returns first result
 * Useful for fallback patterns or performance optimization
 * 
 * @example
 * ```javascript
 * import { run, race } from 'umid';
 * 
 * const middleware = race(fastPath, slowPath);
 * const result = await middleware(ctx);
 * ```
 */
export function race(...middleware) {
    return async function(...args) {
        const promises = middleware.map(mw => mw(...args));
        const results = await Promise.any(promises);
        return results;
    };
}

/**
 * ALL operator - Executes all middleware in parallel, waits for all
 * Returns array of all results
 * 
 * @example
 * ```javascript
 * import { run, all } from 'umid';
 * 
 * const results = await all(mw1, mw2, mw3)(ctx);
 * // results is an array of all middleware results
 * ```
 */
export function all(...middleware) {
    return async function(...args) {
        const promises = middleware.map(mw => mw(...args));
        const results = await Promise.all(promises);
        return results;
    };
}

/**
 * ANY operator - Executes middleware in parallel, returns first success
 * Similar to race but only returns on success, not on first completion
 * 
 * @example
 * ```javascript
 * import { run, any } from 'umid';
 * 
 * const result = await any(tryCache, tryDatabase, tryAPI)(ctx);
 * ```
 */
export function any(...middleware) {
    return async function(...args) {
        const promises = middleware.map(mw => mw(...args).catch(() => undefined));
        for (const promise of promises) {
            const result = await promise;
            if (result !== undefined) {
                return result;
            }
        }
        throw new Error('All middleware failed');
    };
}

/**
 * SEQUENCE operator - Executes middleware sequentially with result passing
 * Each middleware receives the result of the previous one
 * 
 * @example
 * ```javascript
 * import { run, sequence } from 'umid';
 * 
 * const result = await sequence(validate, transform, save)(data);
 * ```
 */
export function sequence(...middleware) {
    return async function(arg) {
        let result = arg;
        for (const mw of middleware) {
            result = await mw(result);
        }
        return result;
    };
}

/**
 * PIPE operator - Similar to sequence but with single argument passing
 * Each middleware receives the result of the previous one as first argument
 * 
 * @example
 * ```javascript
 * import { run, pipe } from 'umid';
 * 
 * const result = await pipe(validate, transform, save)(data);
 * ```
 */
export function pipe(...middleware) {
    return async function(arg) {
        let result = arg;
        for (const mw of middleware) {
            result = await mw(result);
        }
        return result;
    };
}

/**
 * RETRY operator - Retries middleware on failure
 * 
 * @example
 * ```javascript
 * import { run, retry } from 'umid';
 * 
 * const middleware = retry(3, 1000, fetchData);
 * const result = await middleware(ctx);
 * ```
 */
export function retry(maxAttempts = 3, delayMs = 1000, middleware) {
    return async function(...args) {
        let lastError;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await middleware(...args);
            } catch (err) {
                lastError = err;
                if (attempt < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                }
            }
        }
        throw lastError;
    };
}

/**
 * TIMEOUT operator - Adds timeout to middleware
 * 
 * @example
 * ```javascript
 * import { run, timeout } from 'umid';
 * 
 * const middleware = timeout(5000, fetchData);
 * const result = await middleware(ctx);
 * ```
 */
export function timeout(ms, middleware) {
    return async function(...args) {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
        });
        const middlewarePromise = middleware(...args);
        return await Promise.race([middlewarePromise, timeoutPromise]);
    };
}

/**
 * CACHE operator - Caches middleware results
 * 
 * @example
 * ```javascript
 * import { run, cache } from 'umid';
 * 
 * const cachedMiddleware = cache(expensiveOperation);
 * const result = await cachedMiddleware(ctx);
 * ```
 */
export function cache(middleware, getKey = (args) => JSON.stringify(args)) {
    const cacheStore = new Map();
    
    return async function(...args) {
        const key = getKey(args);
        if (cacheStore.has(key)) {
            return cacheStore.get(key);
        }
        const result = await middleware(...args);
        cacheStore.set(key, result);
        return result;
    };
}

/**
 * VALIDATE operator - Validates input before middleware
 * 
 * @example
 * ```javascript
 * import { run, validate } from 'umid';
 * 
 * const middleware = validate(schema, handler);
 * const result = await middleware(ctx);
 * ```
 */
export function validate(validator, middleware) {
    return async function(...args) {
        const validation = await validator(...args);
        if (!validation.valid) {
            throw new Error('Validation failed');
        }
        return middleware(...args);
    };
}

/**
 * CONDITIONAL operator - Conditionally executes middleware
 * 
 * @example
 * ```javascript
 * import { run, when } from 'umid';
 * 
 * const middleware = when(ctx => ctx.user, auth);
 * const result = await middleware(ctx);
 * ```
 */
export function when(condition, middleware, elseMiddleware) {
    return async function(...args) {
        const shouldExecute = await condition(...args);
        if (shouldExecute) {
            return middleware(...args);
        } else if (elseMiddleware) {
            return elseMiddleware(...args);
        }
        return args[0]; // Return first argument if no else
    };
}

/**
 * PARALLEL operator - Executes middleware in parallel
 * 
 * @example
 * ```javascript
 * import { run, parallel } from 'umid';
 * 
 * const results = await parallel(mw1, mw2, mw3)(ctx);
 * ```
 */
export function parallel(...middleware) {
    return async function(...args) {
        const promises = middleware.map(mw => mw(...args));
        return await Promise.all(promises);
    };
}

/**
 * WATERFALL operator - Executes middleware sequentially with result accumulation
 * 
 * @example
 * ```javascript
 * import { run, waterfall } from 'umid';
 * 
 * const results = await waterfall(mw1, mw2, mw3)(ctx);
 * // results is an array of all middleware results
 * ```
 */
export function waterfall(...middleware) {
    return async function(...args) {
        const results = [];
        let currentArgs = args;
        for (const mw of middleware) {
            const result = await mw(...currentArgs);
            results.push(result);
            currentArgs = [result];
        }
        return results;
    };
}

/**
 * TAP operator - Executes middleware for side effects, passes through input
 * 
 * @example
 * ```javascript
 * import { run, tap } from 'umid';
 * 
 * const middleware = tap(logger, handler);
 * const result = await middleware(ctx);
 * // result is from handler, logger was called for side effect
 * ```
 */
export function tap(...middleware) {
    return async function(...args) {
        for (const mw of middleware.slice(0, -1)) {
            await mw(...args);
        }
        return middleware[middleware.length - 1](...args);
    };
}

/**
 * COMPOSE operator - Alias for sequence
 * Composes middleware where each receives the result of the previous
 * 
 * @example
 * ```javascript
 * import { run, compose } from 'umid';
 * 
 * const middleware = compose(validate, transform, save);
 * const result = await middleware(data);
 * ```
 */
export const compose = sequence;

/**
 * APPLY operator - Apply middleware to a value
 * Similar to pipe but with explicit application
 * 
 * @example
 * ```javascript
 * import { run, apply } from 'umid';
 * 
 * const result = await apply(data, validate, transform, save);
 * ```
 */
export function apply(value, ...middleware) {
    return pipe(...middleware)(value);
}

/**
 * MEMOIZE operator - Memoize middleware with cache
 * Similar to cache but returns a memoized function
 * 
 * @example
 * ```javascript
 * import { run, memoize } from 'umid';
 * 
 * const memoizedFetch = memoize(fetchData);
 * const result = await memoizedFetch(ctx);
 * ```
 */
export function memoize(middleware, getKey = (args) => JSON.stringify(args)) {
    const cacheStore = new Map();
    
    return async function(...args) {
        const key = getKey(args);
        if (cacheStore.has(key)) {
            return cacheStore.get(key);
        }
        const result = await middleware(...args);
        cacheStore.set(key, result);
        return result;
    };
}

/**
 * DEBOUNCE operator - Debounce middleware calls
 * 
 * @example
 * ```javascript
 * import { run, debounce } from 'umid';
 * 
 * const debouncedMiddleware = debounce(300, handler);
 * const result = await debouncedMiddleware(ctx);
 * ```
 */
export function debounce(ms, middleware) {
    let timeoutId;
    let lastResolve;
    let lastReject;
    
    return async function(...args) {
        clearTimeout(timeoutId);
        
        return new Promise((resolve, reject) => {
            lastResolve = resolve;
            lastReject = reject;
            
            timeoutId = setTimeout(async () => {
                try {
                    const result = await middleware(...args);
                    lastResolve(result);
                } catch (err) {
                    lastReject(err);
                }
            }, ms);
        });
    };
}

/**
 * THROTTLE operator - Throttle middleware calls
 * 
 * @example
 * ```javascript
 * import { run, throttle } from 'umid';
 * 
 * const throttledMiddleware = throttle(1000, handler);
 * const result = await throttledMiddleware(ctx);
 * ```
 */
export function throttle(ms, middleware) {
    let lastCall = 0;
    let lastResolve;
    let lastReject;
    
    return async function(...args) {
        const now = Date.now();
        const timeSinceLast = now - lastCall;
        
        if (timeSinceLast < ms) {
            // Wait until throttle period has passed
            await new Promise(resolve => setTimeout(resolve, ms - timeSinceLast));
        }
        
        lastCall = Date.now();
        
        return new Promise((resolve, reject) => {
            lastResolve = resolve;
            lastReject = reject;
            
            middleware(...args).then(resolve).catch(reject);
        });
    };
}

/**
 * ONCE operator - Execute middleware only once
 * Subsequent calls return the cached result
 * 
 * @example
 * ```javascript
 * import { run, once } from 'umid';
 * 
 * const initMiddleware = once(initialize);
 * await initMiddleware(ctx); // Executes initialize
 * await initMiddleware(ctx); // Returns cached result
 * ```
 */
export function once(middleware) {
    let hasExecuted = false;
    let cachedResult;
    
    return async function(...args) {
        if (hasExecuted) {
            return cachedResult;
        }
        
        hasExecuted = true;
        cachedResult = await middleware(...args);
        return cachedResult;
    };
}

/**
 * BEFORE operator - Execute middleware before main middleware
 * 
 * @example
 * ```javascript
 * import { run, before } from 'umid';
 * 
 * const middleware = before(logger, handler);
 * // logger executes before handler
 * ```
 */
export function before(beforeMiddleware, mainMiddleware) {
    return and(beforeMiddleware, mainMiddleware);
}

/**
 * AFTER operator - Execute middleware after main middleware
 * 
 * @example
 * ```javascript
 * import { run, after } from 'umid';
 * 
 * const middleware = after(handler, logger);
 * // handler executes before logger
 * ```
 */
export function after(mainMiddleware, afterMiddleware) {
    return and(mainMiddleware, afterMiddleware);
}

/**
 * WRAP operator - Wrap middleware with pre/post hooks
 * 
 * @example
 * ```javascript
 * import { run, wrap } from 'umid';
 * 
 * const middleware = wrap(
 *     handler,
 *     { before: startTimer, after: logDuration }
 * );
 * ```
 */
export function wrap(mainMiddleware, { before, after }) {
    return async function(...args) {
        if (before) {
            await before(...args);
        }
        
        const result = await mainMiddleware(...args);
        
        if (after) {
            await after(...args);
        }
        
        return result;
    };
}

/**
 * TRYCATCH operator - Wrap middleware with try-catch
 * 
 * @example
 * ```javascript
 * import { run, tryCatch } from 'umid';
 * 
 * const middleware = tryCatch(handler, errorHandler);
 * ```
 */
export function tryCatch(mainMiddleware, errorMiddleware) {
    return async function(...args) {
        try {
            return await mainMiddleware(...args);
        } catch (err) {
            if (errorMiddleware) {
                return errorMiddleware(err, ...args);
            }
            throw err;
        }
    };
}

/**
 * PASS operator - Pass through middleware that doesn't modify input
 * Useful for logging or metrics
 * 
 * @example
 * ```javascript
 * import { run, pass } from 'umid';
 * 
 * const middleware = pass(logger, handler);
 * ```
 */
export const pass = tap;

/**
 * SKIP operator - Skip middleware based on condition
 * 
 * @example
 * ```javascript
 * import { run, skip } from 'umid';
 * 
 * const middleware = skip(ctx => !ctx.user, auth);
 * // auth is only called if ctx.user exists
 * ```
 */
export function skip(condition, middleware) {
    return when(condition, middleware, identity);
}

/**
 * IDENTITY function - Returns input unchanged
 * 
 * @example
 * ```javascript
 * import { run, identity } from 'umid';
 * 
 * const middleware = sequence(validate, identity, transform);
 * ```
 */
export function identity(x) {
    return x;
}

/**
 * NOOP function - No operation, returns undefined
 * 
 * @example
 * ```javascript
 * import { run, noop } from 'umid';
 * 
 * const middleware = sequence(validate, noop, transform);
 * ```
 */
export function noop() {
    return undefined;
}

/**
 * Export all utilities
 */
export default {
    and,
    or,
    not,
    race,
    all,
    any,
    sequence,
    pipe,
    retry,
    timeout,
    cache,
    validate,
    when,
    parallel,
    waterfall,
    tap,
    compose,
    apply,
    memoize,
    debounce,
    throttle,
    once,
    before,
    after,
    wrap,
    tryCatch,
    pass,
    skip,
    identity,
    noop
};
