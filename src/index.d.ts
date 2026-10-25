/**
 * Universal Middleware - Fast, lightweight middleware framework
 * 
 * @example
 * ```typescript
 * // Mode 0: Sequential execution without next callback
 * import { run } from 'umid';
 * 
 * const execute = run(0);
 * 
 * const fn1 = async (arg: string) => {
 *   console.log('fn1', arg);
 * };
 * 
 * const fn2 = async (arg: string) => {
 *   console.log('fn2', arg);
 *   return 'result';
 * };
 * 
 * await execute(fn1, fn2)('hello');
 * // Output: fn1 hello, fn2 hello
 * // Returns: 'result'
 * ```
 * 
 * @example
 * ```typescript
 * // Mode 1: Express-like middleware with next callback
 * import { run } from 'umid';
 * 
 * const middleware = run(1);
 * 
 * const auth = async (req: Request, res: Response, next: NextFunction) => {
 *   if (req.headers.authorized) {
 *     next();
 *   } else {
 *     next(new Error('Unauthorized'));
 *   }
 * };
 * 
 * const logger = async (req: Request, res: Response, next: NextFunction) => {
 *   console.log('Request received');
 *   next();
 * };
 * 
 * await middleware(auth, logger)(req, res);
 * ```
 */

/**
 * Next function type for Mode 1 middleware
 */
export type NextFunction = (error?: any) => Promise<void>;

/**
 * Generic function type that can be used in the middleware chain
 */
export type MiddlewareFunction<T extends any[] = any[]> = (
  ...args: [...T, NextFunction?]
) => Promise<any> | void;

/**
 * Run function that creates a middleware executor
 * 
 * @param mode - Execution mode (0 = sequential without next, 1 = with next callback)
 * @returns A function that accepts middleware functions and returns an executor
 * 
 * @example
 * ```typescript
 * // Mode 0: Simple sequential execution
 * const execute = run(0);
 * await execute(fn1, fn2)(arg1, arg2);
 * 
 * // Mode 1: Express-like middleware
 * const middleware = run(1);
 * await middleware(auth, logger)(req, res);
 * ```
 */
export function run(mode?: number): <T extends any[]>(...fns: MiddlewareFunction<T>[]) => (...args: T) => Promise<any>;

/**
 * Run function with default mode (0)
 */
export function run(): <T extends any[]>(...fns: MiddlewareFunction<T>[]) => (...args: T) => Promise<any>;

export default run;
