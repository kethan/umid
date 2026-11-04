/**
 * Utility functions for umid middleware
 * 
 * These utilities provide logical operators for combining middleware functions
 * in various ways, enabling more expressive middleware composition.
 */

import { type MiddlewareFunction, type NextFunction } from './index';

/**
 * AND operator - All middleware must execute successfully
 * In Mode 1: Continues to next middleware only if current one calls next()
 * If any middleware calls next(error), the chain stops with that error
 * 
 * @example
 * ```typescript
 * import { run, and } from 'umid';
 * 
 * const middleware = and(auth, logger, rateLimit);
 * await middleware(req, res);
 * ```
 */
export function and<T extends any[]>(...middleware: MiddlewareFunction<T>[]): MiddlewareFunction<T>;

/**
 * OR operator - Executes middleware until one returns a truthy value
 * Uses Mode 0: Returns the result of the first middleware that returns a truthy value
 * 
 * @example
 * ```typescript
 * import { run, or } from 'umid';
 * 
 * const middleware = or(tryCache, tryDatabase, tryFallback);
 * const result = await middleware(ctx);
 * ```
 */
export function or<T extends any[]>(...middleware: MiddlewareFunction<T>[]): MiddlewareFunction<T>;

/**
 * NOT operator - Inverts the middleware behavior
 * If the middleware would return a value, it returns undefined
 * If the middleware would continue, it stops the chain
 * 
 * @example
 * ```typescript
 * import { run, not } from 'umid';
 * 
 * const middleware = not(auth);
 * // If auth would return a user, not(auth) returns undefined
 * // If auth would call next(), not(auth) stops the chain
 * ```
 */
export function not<T extends any[]>(middleware: MiddlewareFunction<T>): MiddlewareFunction<T>;

/**
 * RACE operator - Executes middleware in parallel, returns first result
 * Useful for fallback patterns or performance optimization
 * 
 * @example
 * ```typescript
 * import { run, race } from 'umid';
 * 
 * const middleware = race(fastPath, slowPath);
 * const result = await middleware(ctx);
 * ```
 */
export function race<T extends any[]>(...middleware: MiddlewareFunction<T>[]): MiddlewareFunction<T>;

/**
 * ALL operator - Executes all middleware in parallel, waits for all
 * Returns array of all results
 * 
 * @example
 * ```typescript
 * import { run, all } from 'umid';
 * 
 * const results = await all(mw1, mw2, mw3)(ctx);
 * // results is an array of all middleware results
 * ```
 */
export function all<T extends any[]>(...middleware: MiddlewareFunction<T>[]): MiddlewareFunction<T>;

/**
 * ANY operator - Executes middleware in parallel, returns first success
 * Similar to race but only returns on success, not on first completion
 * 
 * @example
 * ```typescript
 * import { run, any } from 'umid';
 * 
 * const result = await any(tryCache, tryDatabase, tryAPI)(ctx);
 * ```
 */
export function any<T extends any[]>(...middleware: MiddlewareFunction<T>[]): MiddlewareFunction<T>;

/**
 * SEQUENCE operator - Executes middleware sequentially with result passing
 * Each middleware receives the result of the previous one
 * 
 * @example
 * ```typescript
 * import { run, sequence } from 'umid';
 * 
 * const result = await sequence(validate, transform, save)(data);
 * ```
 */
export function sequence<T extends any[]>(...middleware: MiddlewareFunction<T>[]): (...args: T) => Promise<any>;

/**
 * PIPE operator - Similar to sequence but with single argument passing
 * Each middleware receives the result of the previous one as first argument
 * 
 * @example
 * ```typescript
 * import { run, pipe } from 'umid';
 * 
 * const result = await pipe(validate, transform, save)(data);
 * ```
 */
export function pipe<T, R>(...middleware: Array<(arg: any) => Promise<any> | any>): (arg: T) => Promise<R>;

/**
 * RETRY operator - Retries middleware on failure
 * 
 * @param maxAttempts - Maximum number of retry attempts
 * @param delayMs - Delay between retries in milliseconds
 * @param middleware - Middleware function to retry
 * 
 * @example
 * ```typescript
 * import { run, retry } from 'umid';
 * 
 * const middleware = retry(3, 1000, fetchData);
 * const result = await middleware(ctx);
 * ```
 */
export function retry<T extends any[]>(maxAttempts?: number, delayMs?: number, middleware?: MiddlewareFunction<T>): MiddlewareFunction<T>;
export function retry<T extends any[]>(maxAttempts: number, delayMs: number, middleware: MiddlewareFunction<T>): MiddlewareFunction<T>;

/**
 * TIMEOUT operator - Adds timeout to middleware
 * 
 * @param ms - Timeout in milliseconds
 * @param middleware - Middleware function to timeout
 * 
 * @example
 * ```typescript
 * import { run, timeout } from 'umid';
 * 
 * const middleware = timeout(5000, fetchData);
 * const result = await middleware(ctx);
 * ```
 */
export function timeout<T extends any[]>(ms: number, middleware: MiddlewareFunction<T>): MiddlewareFunction<T>;

/**
 * CACHE operator - Caches middleware results
 * 
 * @param middleware - Middleware function to cache
 * @param getKey - Function to generate cache key from arguments
 * 
 * @example
 * ```typescript
 * import { run, cache } from 'umid';
 * 
 * const cachedMiddleware = cache(expensiveOperation);
 * const result = await cachedMiddleware(ctx);
 * ```
 */
export function cache<T extends any[]>(middleware: MiddlewareFunction<T>, getKey?: (...args: T) => string): MiddlewareFunction<T>;

/**
 * VALIDATE operator - Validates input before middleware
 * 
 * @param validator - Function that validates input and returns { valid: boolean }
 * @param middleware - Middleware function to execute if validation passes
 * 
 * @example
 * ```typescript
 * import { run, validate } from 'umid';
 * 
 * const middleware = validate(schema, handler);
 * const result = await middleware(ctx);
 * ```
 */
export function validate<T extends any[]>(validator: (...args: T) => Promise<{ valid: boolean }> | { valid: boolean }, middleware: MiddlewareFunction<T>): MiddlewareFunction<T>;

/**
 * CONDITIONAL operator - Conditionally executes middleware
 * 
 * @param condition - Function that returns boolean indicating whether to execute middleware
 * @param middleware - Middleware function to execute if condition is true
 * @param elseMiddleware - Middleware function to execute if condition is false
 * 
 * @example
 * ```typescript
 * import { run, when } from 'umid';
 * 
 * const middleware = when(ctx => ctx.user, auth);
 * const result = await middleware(ctx);
 * ```
 */
export function when<T extends any[]>(condition: (...args: T) => Promise<boolean> | boolean, middleware: MiddlewareFunction<T>, elseMiddleware?: MiddlewareFunction<T>): MiddlewareFunction<T>;

/**
 * PARALLEL operator - Executes middleware in parallel
 * 
 * @example
 * ```typescript
 * import { run, parallel } from 'umid';
 * 
 * const results = await parallel(mw1, mw2, mw3)(ctx);
 * ```
 */
export function parallel<T extends any[]>(...middleware: MiddlewareFunction<T>[]): MiddlewareFunction<T>;

/**
 * WATERFALL operator - Executes middleware sequentially with result accumulation
 * 
 * @example
 * ```typescript
 * import { run, waterfall } from 'umid';
 * 
 * const results = await waterfall(mw1, mw2, mw3)(ctx);
 * // results is an array of all middleware results
 * ```
 */
export function waterfall<T extends any[]>(...middleware: MiddlewareFunction<T>[]): MiddlewareFunction<T>;

/**
 * TAP operator - Executes middleware for side effects, passes through input
 * 
 * @example
 * ```typescript
 * import { run, tap } from 'umid';
 * 
 * const middleware = tap(logger, handler);
 * const result = await middleware(ctx);
 * // result is from handler, logger was called for side effect
 * ```
 */
export function tap<T extends any[]>(...middleware: MiddlewareFunction<T>[]): MiddlewareFunction<T>;

/**
 * COMPOSE operator - Alias for sequence
 * Composes middleware where each receives the result of the previous
 */
export const compose: typeof sequence;

/**
 * APPLY operator - Apply middleware to a value
 */
export function apply<T, R>(value: T, ...middleware: Array<(arg: any) => Promise<any> | any>): Promise<R>;

/**
 * MEMOIZE operator - Memoize middleware with cache
 */
export function memoize<T extends any[]>(middleware: MiddlewareFunction<T>, getKey?: (...args: T) => string): MiddlewareFunction<T>;

/**
 * DEBOUNCE operator - Debounce middleware calls
 */
export function debounce<T extends any[]>(ms: number, middleware: MiddlewareFunction<T>): MiddlewareFunction<T>;

/**
 * THROTTLE operator - Throttle middleware calls
 */
export function throttle<T extends any[]>(ms: number, middleware: MiddlewareFunction<T>): MiddlewareFunction<T>;

/**
 * ONCE operator - Execute middleware only once
 */
export function once<T extends any[]>(middleware: MiddlewareFunction<T>): MiddlewareFunction<T>;

/**
 * BEFORE operator - Execute middleware before main middleware
 */
export function before<T extends any[]>(beforeMiddleware: MiddlewareFunction<T>, mainMiddleware: MiddlewareFunction<T>): MiddlewareFunction<T>;

/**
 * AFTER operator - Execute middleware after main middleware
 */
export function after<T extends any[]>(mainMiddleware: MiddlewareFunction<T>, afterMiddleware: MiddlewareFunction<T>): MiddlewareFunction<T>;

/**
 * WRAP operator - Wrap middleware with pre/post hooks
 */
export function wrap<T extends any[]>(mainMiddleware: MiddlewareFunction<T>, hooks: { before?: MiddlewareFunction<T>; after?: MiddlewareFunction<T> }): MiddlewareFunction<T>;

/**
 * TRYCATCH operator - Wrap middleware with try-catch
 */
export function tryCatch<T extends any[]>(mainMiddleware: MiddlewareFunction<T>, errorMiddleware?: (...args: [...T, Error]) => Promise<any> | any): MiddlewareFunction<T>;

/**
 * PASS operator - Alias for tap
 */
export const pass: typeof tap;

/**
 * SKIP operator - Skip middleware based on condition
 */
export function skip<T extends any[]>(condition: (...args: T) => Promise<boolean> | boolean, middleware: MiddlewareFunction<T>): MiddlewareFunction<T>;

/**
 * IDENTITY function - Returns input unchanged
 */
export function identity<T>(x: T): T;

/**
 * NOOP function - No operation, returns undefined
 */
export function noop(): undefined;

/**
 * Utility functions object
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