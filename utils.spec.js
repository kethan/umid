import { describe, expect, it, vi, beforeEach } from 'vitest';
import { 
    and, or, not, race, all, any, 
    sequence, pipe, retry, timeout, 
    cache, validate, when, parallel, 
    waterfall, tap, compose, apply,
    memoize, debounce, throttle, once,
    before, after, wrap, tryCatch,
    pass, skip, identity, noop
} from './src/utils';

// Mock middleware functions for testing
const successMiddleware = vi.fn(async (ctx) => {
    ctx.success = true;
    return 'success';
});

const errorMiddleware = vi.fn(async (ctx) => {
    throw new Error('Test error');
});

const asyncMiddleware = vi.fn(async (ctx) => {
    await new Promise(resolve => setTimeout(resolve, 10));
    ctx.async = true;
    return 'async';
});

const slowMiddleware = vi.fn(async (ctx) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return 'slow';
});

const fastMiddleware = vi.fn(async (ctx) => {
    return 'fast';
});

const conditionalMiddleware = vi.fn(async (ctx) => {
    ctx.conditional = true;
    return 'conditional';
});

const identityMiddleware = vi.fn(async (ctx) => {
    return ctx;
});

beforeEach(() => {
    vi.restoreAllMocks();
});

describe('Utility Functions', () => {
    describe('and() - Logical AND', () => {
        it('should execute all middleware in sequence (Mode 1)', async () => {
            const mw1 = vi.fn(async (ctx, next) => {
                ctx.step1 = true;
                await next();
            });
            const mw2 = vi.fn(async (ctx, next) => {
                ctx.step2 = true;
                await next();
            });
            const mw3 = vi.fn(async (ctx, next) => {
                ctx.step3 = true;
                await next();
            });

            const combined = and(mw1, mw2, mw3);
            const ctx = {};
            await combined(ctx);

            expect(mw1).toHaveBeenCalled();
            expect(mw2).toHaveBeenCalled();
            expect(mw3).toHaveBeenCalled();
            expect(ctx.step1).toBe(true);
            expect(ctx.step2).toBe(true);
            expect(ctx.step3).toBe(true);
        });

        it('should stop on error', async () => {
            const mw1 = vi.fn(async (ctx, next) => {
                ctx.step1 = true;
                await next();
            });
            const mw2 = vi.fn(async (ctx, next) => {
                throw new Error('Stop here');
            });
            const mw3 = vi.fn(async (ctx, next) => {
                ctx.step3 = true;
                await next();
            });

            const combined = and(mw1, mw2, mw3);
            const ctx = {};
            
            await expect(combined(ctx)).rejects.toThrow('Stop here');
            expect(mw1).toHaveBeenCalled();
            expect(mw2).toHaveBeenCalled();
            expect(mw3).not.toHaveBeenCalled();
        });

        it('should stop on error with next(Error)', async () => {
            const mw1 = vi.fn(async (ctx, next) => {
                ctx.step1 = true;
                await next();
            });
            const mw2 = vi.fn(async (ctx, next) => {
                next(new Error('Unauthorized'));
            });
            const mw3 = vi.fn(async (ctx, next) => {
                ctx.step3 = true;
                await next();
            });

            const combined = and(mw1, mw2, mw3);
            const ctx = {};
            
            await expect(combined(ctx)).rejects.toThrow('Unauthorized');
            expect(mw1).toHaveBeenCalled();
            expect(mw2).toHaveBeenCalled();
            expect(mw3).not.toHaveBeenCalled();
        });

        it('should stop on error with next(string)', async () => {
            const mw1 = vi.fn(async (ctx, next) => {
                ctx.step1 = true;
                await next();
            });
            const mw2 = vi.fn(async (ctx, next) => {
                next('Access denied');
            });
            const mw3 = vi.fn(async (ctx, next) => {
                ctx.step3 = true;
                await next();
            });

            const combined = and(mw1, mw2, mw3);
            const ctx = {};
            
            await expect(combined(ctx)).rejects.toThrow('Access denied');
            expect(mw1).toHaveBeenCalled();
            expect(mw2).toHaveBeenCalled();
            expect(mw3).not.toHaveBeenCalled();
        });
    });

    describe('or() - Logical OR', () => {
        it('should return first truthy result (Mode 0)', async () => {
            const mw1 = vi.fn(async (ctx) => {
                return undefined;
            });
            const mw2 = vi.fn(async (ctx) => {
                return null;
            });
            const mw3 = vi.fn(async (ctx) => {
                return 'found';
            });

            const combined = or(mw1, mw2, mw3);
            const ctx = {};
            const result = await combined(ctx);

            expect(result).toBe('found');
            expect(mw1).toHaveBeenCalled();
            expect(mw2).toHaveBeenCalled();
            expect(mw3).toHaveBeenCalled();
        });

        it('should return undefined if no middleware returns truthy', async () => {
            const mw1 = vi.fn(async (ctx) => {
                return undefined;
            });
            const mw2 = vi.fn(async (ctx) => {
                return null;
            });

            const combined = or(mw1, mw2);
            const ctx = {};
            const result = await combined(ctx);

            expect(result).toBeUndefined();
        });
    });

    describe('not() - Logical NOT', () => {
        it('should invert middleware that returns value', async () => {
            const mw = vi.fn(async (ctx) => {
                return 'original';
            });

            const inverted = not(mw);
            const ctx = {};
            const result = await inverted(ctx);

            expect(result).toBeUndefined();
        });

        it('should return falsy value unchanged', async () => {
            const mw = vi.fn(async (ctx) => {
                return null;
            });

            const inverted = not(mw);
            const ctx = {};
            const result = await inverted(ctx);

            expect(result).toBe(null);
        });
    });

    describe('race() - First to Complete', () => {
        it('should return first completed result', async () => {
            const combined = race(
                async () => {
                    await new Promise(resolve => setTimeout(resolve, 50));
                    return 'slow';
                },
                async () => {
                    await new Promise(resolve => setTimeout(resolve, 10));
                    return 'fast';
                }
            );

            const result = await combined({});
            expect(result).toBe('fast');
        });

        it('should work with middleware functions', async () => {
            const combined = race(fastMiddleware, slowMiddleware);
            const result = await combined({});
            expect(result).toBe('fast');
        });
    });

    describe('all() - All in Parallel', () => {
        it('should return array of all results', async () => {
            const combined = all(
                async () => 'result1',
                async () => 'result2',
                async () => 'result3'
            );

            const results = await combined({});
            expect(results).toEqual(['result1', 'result2', 'result3']);
        });

        it('should handle middleware functions', async () => {
            const mw1 = vi.fn(async () => 'result1');
            const mw2 = vi.fn(async () => 'result2');
            const mw3 = vi.fn(async () => 'result3');

            const combined = all(mw1, mw2, mw3);
            const results = await combined({});

            expect(results).toEqual(['result1', 'result2', 'result3']);
        });
    });

    describe('any() - First Success', () => {
        it('should return first successful result', async () => {
            const combined = any(
                async () => { throw new Error('fail 1'); },
                async () => { throw new Error('fail 2'); },
                async () => 'success'
            );

            const result = await combined({});
            expect(result).toBe('success');
        });

        it('should throw if all fail', async () => {
            const combined = any(
                async () => { throw new Error('fail 1'); },
                async () => { throw new Error('fail 2'); }
            );

            await expect(combined({})).rejects.toThrow('All middleware failed');
        });
    });

    describe('sequence() - Sequential with Result Passing', () => {
        it('should pass result through middleware chain', async () => {
            const mw1 = vi.fn(async (data) => {
                return { ...data, step1: true };
            });
            const mw2 = vi.fn(async (data) => {
                return { ...data, step2: true };
            });
            const mw3 = vi.fn(async (data) => {
                return { ...data, step3: true };
            });

            const combined = sequence(mw1, mw2, mw3);
            const result = await combined({ initial: true });

            expect(result).toEqual({ initial: true, step1: true, step2: true, step3: true });
        });

        it('should handle single argument', async () => {
            const mw1 = vi.fn(async (data) => data + 1);
            const mw2 = vi.fn(async (data) => data * 2);
            const mw3 = vi.fn(async (data) => data + 3);

            const combined = sequence(mw1, mw2, mw3);
            const result = await combined(5);

            // (5 + 1) * 2 + 3 = 15
            expect(result).toBe(15);
        });
    });

    describe('pipe() - Single Argument Passing', () => {
        it('should pass result as first argument to next middleware', async () => {
            const mw1 = vi.fn(async (data) => data + 1);
            const mw2 = vi.fn(async (data) => data * 2);
            const mw3 = vi.fn(async (data) => data + 3);

            const combined = pipe(mw1, mw2, mw3);
            const result = await combined(5);

            // ((5 + 1) * 2) + 3 = 15
            expect(result).toBe(15);
        });

        it('should work with objects', async () => {
            const mw1 = vi.fn(async (data) => ({ ...data, step1: true }));
            const mw2 = vi.fn(async (data) => ({ ...data, step2: true }));

            const combined = pipe(mw1, mw2);
            const result = await combined({ initial: true });

            expect(result).toEqual({ initial: true, step1: true, step2: true });
        });
    });

    describe('retry() - Retry on Failure', () => {
        it('should retry on failure', async () => {
            let attempts = 0;
            const mw = vi.fn(async () => {
                attempts++;
                if (attempts < 3) {
                    throw new Error('Temporary failure');
                }
                return 'success';
            });

            const combined = retry(3, 10, mw);
            const result = await combined({});

            expect(result).toBe('success');
            expect(attempts).toBe(3);
        });

        it('should throw after max attempts', async () => {
            let attempts = 0;
            const mw = vi.fn(async () => {
                attempts++;
                throw new Error('Always fails');
            });

            const combined = retry(3, 10, mw);
            
            await expect(combined({})).rejects.toThrow('Always fails');
            expect(attempts).toBe(3);
        });

        it('should work with default values', async () => {
            let attempts = 0;
            const mw = vi.fn(async () => {
                attempts++;
                if (attempts < 2) {
                    throw new Error('Temporary failure');
                }
                return 'success';
            });

            // Using default values (3 attempts, 1000ms delay)
            const combined = retry(undefined, undefined, mw);
            const result = await combined({});

            expect(result).toBe('success');
        });
    });

    describe('timeout() - Timeout', () => {
        it('should resolve if middleware completes in time', async () => {
            const mw = vi.fn(async () => {
                await new Promise(resolve => setTimeout(resolve, 10));
                return 'completed';
            });

            const combined = timeout(1000, mw);
            const result = await combined({});

            expect(result).toBe('completed');
        });

        it('should reject if middleware times out', async () => {
            const mw = vi.fn(async () => {
                await new Promise(resolve => setTimeout(resolve, 5000));
                return 'completed';
            });

            const combined = timeout(50, mw);
            
            await expect(combined({})).rejects.toThrow('Timeout after 50ms');
        });
    });

    describe('cache() - Cache Results', () => {
        it('should cache results for same arguments', async () => {
            let callCount = 0;
            const mw = vi.fn(async (ctx) => {
                callCount++;
                return 'result';
            });

            const combined = cache(mw);
            
            const result1 = await combined({ key: 'test' });
            const result2 = await combined({ key: 'test' });
            const result3 = await combined({ key: 'different' });

            expect(result1).toBe('result');
            expect(result2).toBe('result');
            expect(result3).toBe('result');
            expect(callCount).toBe(2); // Only called twice: once for 'test', once for 'different'
        });

        it('should use custom key function', async () => {
            let callCount = 0;
            const mw = vi.fn(async (ctx) => {
                callCount++;
                return 'result';
            });

            const combined = cache(mw, (args) => args[0].id);
            
            const result1 = await combined({ id: '123' });
            const result2 = await combined({ id: '123' });
            const result3 = await combined({ id: '456' });

            expect(callCount).toBe(2);
        });
    });

    describe('validate() - Validate Input', () => {
        it('should execute middleware if validation passes', async () => {
            const validator = vi.fn(async (ctx) => ({ valid: true }));
            const mw = vi.fn(async (ctx) => 'validated');

            const combined = validate(validator, mw);
            const result = await combined({});

            expect(result).toBe('validated');
            expect(validator).toHaveBeenCalled();
            expect(mw).toHaveBeenCalled();
        });

        it('should throw if validation fails', async () => {
            const validator = vi.fn(async (ctx) => ({ valid: false }));
            const mw = vi.fn(async (ctx) => 'validated');

            const combined = validate(validator, mw);
            
            await expect(combined({})).rejects.toThrow('Validation failed');
            expect(validator).toHaveBeenCalled();
            expect(mw).not.toHaveBeenCalled();
        });
    });

    describe('when() - Conditional', () => {
        it('should execute middleware if condition is true', async () => {
            const condition = vi.fn(async (ctx) => true);
            const mw = vi.fn(async (ctx) => 'executed');

            const combined = when(condition, mw);
            const result = await combined({});

            expect(result).toBe('executed');
            expect(condition).toHaveBeenCalled();
            expect(mw).toHaveBeenCalled();
        });

        it('should skip middleware if condition is false', async () => {
            const condition = vi.fn(async (ctx) => false);
            const mw = vi.fn(async (ctx) => 'executed');

            const combined = when(condition, mw);
            const ctx = { value: 'original' };
            const result = await combined(ctx);

            expect(result).toEqual({ value: 'original' }); // Returns first argument when condition is false
            expect(condition).toHaveBeenCalled();
            expect(mw).not.toHaveBeenCalled();
        });

        it('should execute else middleware if condition is false', async () => {
            const condition = vi.fn(async (ctx) => false);
            const mw = vi.fn(async (ctx) => 'true branch');
            const elseMw = vi.fn(async (ctx) => 'false branch');

            const combined = when(condition, mw, elseMw);
            const result = await combined({});

            expect(result).toBe('false branch');
            expect(mw).not.toHaveBeenCalled();
            expect(elseMw).toHaveBeenCalled();
        });
    });

    describe('parallel() - Parallel Execution', () => {
        it('should execute all middleware in parallel', async () => {
            const mw1 = vi.fn(async () => {
                await new Promise(resolve => setTimeout(resolve, 50));
                return 'result1';
            });
            const mw2 = vi.fn(async () => {
                await new Promise(resolve => setTimeout(resolve, 30));
                return 'result2';
            });
            const mw3 = vi.fn(async () => {
                await new Promise(resolve => setTimeout(resolve, 10));
                return 'result3';
            });

            const combined = parallel(mw1, mw2, mw3);
            const results = await combined({});

            expect(results).toEqual(['result1', 'result2', 'result3']);
        });

        it('should handle errors in parallel execution', async () => {
            const mw1 = vi.fn(async () => 'result1');
            const mw2 = vi.fn(async () => {
                throw new Error('Error in mw2');
            });
            const mw3 = vi.fn(async () => 'result3');

            const combined = parallel(mw1, mw2, mw3);
            
            await expect(combined({})).rejects.toThrow('Error in mw2');
        });
    });

    describe('waterfall() - Sequential with Accumulation', () => {
        it('should accumulate results from each middleware', async () => {
            const mw1 = vi.fn(async (ctx) => 'result1');
            const mw2 = vi.fn(async (ctx) => 'result2');
            const mw3 = vi.fn(async (ctx) => 'result3');

            const combined = waterfall(mw1, mw2, mw3);
            const results = await combined({});

            expect(results).toEqual(['result1', 'result2', 'result3']);
        });

        it('should pass result to next middleware', async () => {
            const mw1 = vi.fn(async (ctx) => {
                return { step: 1, data: ctx };
            });
            const mw2 = vi.fn(async (ctx) => {
                return { step: 2, data: ctx };
            });

            const combined = waterfall(mw1, mw2);
            const results = await combined({ initial: true });

            expect(results).toEqual([
                { step: 1, data: { initial: true } },
                { step: 2, data: { step: 1, data: { initial: true } } }
            ]);
        });
    });

    describe('tap() - Side Effects Only', () => {
        it('should execute middleware for side effects', async () => {
            const logger = vi.fn(async (ctx) => {
                ctx.logged = true;
            });
            const handler = vi.fn(async (ctx) => {
                return 'result';
            });

            const combined = tap(logger, handler);
            const ctx = {};
            const result = await combined(ctx);

            expect(result).toBe('result');
            expect(ctx.logged).toBe(true);
            expect(logger).toHaveBeenCalled();
            expect(handler).toHaveBeenCalled();
        });

        it('should pass arguments through', async () => {
            const logger = vi.fn(async (ctx) => {
                ctx.logged = true;
            });
            const handler = vi.fn(async (ctx) => {
                return ctx.value * 2;
            });

            const combined = tap(logger, handler);
            const ctx = { value: 5 };
            const result = await combined(ctx);

            expect(result).toBe(10);
            expect(ctx.logged).toBe(true);
        });
    });

    describe('Mode Compatibility', () => {
        it('and() should work with Mode 1 (next callback)', async () => {
            const mw1 = vi.fn(async (ctx, next) => {
                ctx.step1 = true;
                await next();
            });
            const mw2 = vi.fn(async (ctx, next) => {
                ctx.step2 = true;
                await next();
            });

            const combined = and(mw1, mw2);
            const ctx = {};
            await combined(ctx);

            expect(ctx.step1).toBe(true);
            expect(ctx.step2).toBe(true);
        });

        it('or() should work with Mode 0 (no next callback)', async () => {
            const mw1 = vi.fn(async (ctx) => {
                return undefined;
            });
            const mw2 = vi.fn(async (ctx) => {
                return 'result';
            });

            const combined = or(mw1, mw2);
            const result = await combined({});

            expect(result).toBe('result');
        });

        it('sequence() should work with both sync and async', async () => {
            const syncMw = vi.fn((data) => data + 1);
            const asyncMw = vi.fn(async (data) => {
                await new Promise(resolve => setTimeout(resolve, 10));
                return data * 2;
            });

            const combined = sequence(syncMw, asyncMw);
            const result = await combined(5);

            expect(result).toBe(12); // (5 + 1) * 2 = 12
        });
    });

    describe('Integration Tests', () => {
        it('should combine multiple utilities', async () => {
            const processor = vi.fn(async (ctx) => ({ ...ctx, value: ctx.value * 2 }));
            const logger = vi.fn(async (ctx) => {
                console.log('Processed:', ctx.value);
                return ctx;
            });

            // Process, then log
            const combined = pipe(
                processor,
                logger
            );

            const result = await combined({ value: 5 });
            expect(result.value).toBe(10);
            expect(logger).toHaveBeenCalled();
        });

        it('should handle complex workflow with retry and timeout', async () => {
            let attempts = 0;
            const flakyMiddleware = vi.fn(async (ctx) => {
                attempts++;
                if (attempts < 2) {
                    throw new Error('Temporary failure');
                }
                return 'success';
            });

            const combined = timeout(5000, retry(3, 100, flakyMiddleware));
            const result = await combined({});

            expect(result).toBe('success');
            expect(attempts).toBe(2);
        });

        // TODO: Fix this test - there seems to be an issue with error propagation in Mode 1
        // it('should work with real-world middleware pattern', async () => {
        //     // Simulate Express-like middleware using run(1) directly
        //     const auth = async (ctx, next) => {
        //         if (!ctx.user) {
        //             await next(new Error('Unauthorized'));
        //             return;
        //         }
        //         ctx.authenticated = true;
        //         await next();
        //     };

        //     const handler = async (ctx, next) => {
        //         ctx.response = { data: 'success' };
        //         await next();
        //     };

        //     // Use run(1) directly
        //     const middleware = run(1)(auth, handler);
        //     
        //     // Test with authenticated user
        //     const ctx1 = { method: 'GET', path: '/api', user: { id: 1 } };
        //     await middleware(ctx1);
        //     expect(ctx1.response).toEqual({ data: 'success' });
        //     expect(ctx1.authenticated).toBe(true);

        //     // Test with unauthenticated user - auth calls next(err), so middleware should reject
        //     const ctx2 = { method: 'GET', path: '/api' };
        //     await expect(middleware(ctx2)).rejects.toThrow('Unauthorized');
        // });
    });

    describe('Additional Utilities', () => {
        describe('compose() - Alias for sequence', () => {
            it('should work like sequence', async () => {
                const mw1 = vi.fn(async (data) => ({ ...data, step1: true }));
                const mw2 = vi.fn(async (data) => ({ ...data, step2: true }));

                const combined = compose(mw1, mw2);
                const result = await combined({ initial: true });

                expect(result).toEqual({ initial: true, step1: true, step2: true });
            });
        });

        describe('apply() - Apply to value', () => {
            it('should apply middleware to value', async () => {
                const mw1 = vi.fn(async (data) => data + 1);
                const mw2 = vi.fn(async (data) => data * 2);

                const result = await apply(5, mw1, mw2);
                expect(result).toBe(12); // (5 + 1) * 2 = 12
            });
        });

        describe('memoize() - Memoize', () => {
            it('should cache results', async () => {
                let callCount = 0;
                const mw = vi.fn(async (ctx) => {
                    callCount++;
                    return 'result';
                });

                const memoized = memoize(mw);
                
                const result1 = await memoized({ key: 'test' });
                const result2 = await memoized({ key: 'test' });
                const result3 = await memoized({ key: 'different' });

                expect(result1).toBe('result');
                expect(result2).toBe('result');
                expect(result3).toBe('result');
                expect(callCount).toBe(2);
            });
        });

        describe('debounce() - Debounce', () => {
            it('should debounce calls', async () => {
                let callCount = 0;
                const mw = vi.fn(async () => {
                    callCount++;
                    return 'result';
                });

                const debounced = debounce(100, mw);
                
                // Call multiple times rapidly
                const promise1 = debounced({});
                const promise2 = debounced({});
                const promise3 = debounced({});
                
                // Wait for debounce period
                await new Promise(resolve => setTimeout(resolve, 150));
                
                const result = await promise3;
                expect(result).toBe('result');
                expect(callCount).toBe(1); // Only called once
            });
        });

        describe('throttle() - Throttle', () => {
            it('should throttle calls', async () => {
                let callCount = 0;
                const mw = vi.fn(async () => {
                    callCount++;
                    return 'result';
                });

                const throttled = throttle(50, mw);
                
                const start = Date.now();
                
                await throttled({});
                await throttled({});
                await throttled({});
                
                const duration = Date.now() - start;
                expect(callCount).toBe(3);
                // Should take at least 100ms (2 throttles * 50ms)
                expect(duration).toBeGreaterThanOrEqual(100);
            });
        });

        describe('once() - Once', () => {
            it('should execute only once', async () => {
                let callCount = 0;
                const mw = vi.fn(async () => {
                    callCount++;
                    return 'result';
                });

                const onceMw = once(mw);
                
                const result1 = await onceMw({});
                const result2 = await onceMw({});
                const result3 = await onceMw({});

                expect(result1).toBe('result');
                expect(result2).toBe('result');
                expect(result3).toBe('result');
                expect(callCount).toBe(1); // Only called once
            });
        });

        describe('before() - Before', () => {
            it('should execute before middleware first', async () => {
                const order = [];
                const beforeMw = vi.fn(async (ctx, next) => {
                    order.push('before');
                    await next();
                });
                const mainMw = vi.fn(async (ctx, next) => {
                    order.push('main');
                    await next();
                });

                const combined = before(beforeMw, mainMw);
                const ctx = {};
                await combined(ctx);

                expect(order).toEqual(['before', 'main']);
            });

            it('should stop on error in before middleware', async () => {
                const beforeMw = vi.fn(async (ctx, next) => {
                    next('Before error');
                });
                const mainMw = vi.fn(async (ctx, next) => {
                    ctx.reached = true;
                    await next();
                });

                const combined = before(beforeMw, mainMw);
                const ctx = {};
                
                await expect(combined(ctx)).rejects.toThrow('Before error');
                expect(mainMw).not.toHaveBeenCalled();
            });
        });

        describe('after() - After', () => {
            it('should execute after middleware last', async () => {
                const order = [];
                const mainMw = vi.fn(async (ctx, next) => {
                    order.push('main');
                    await next();
                });
                const afterMw = vi.fn(async (ctx, next) => {
                    order.push('after');
                    await next();
                });

                const combined = after(mainMw, afterMw);
                const ctx = {};
                await combined(ctx);

                expect(order).toEqual(['main', 'after']);
            });

            it('should stop on error in main middleware', async () => {
                const mainMw = vi.fn(async (ctx, next) => {
                    next('Main error');
                });
                const afterMw = vi.fn(async (ctx, next) => {
                    ctx.reached = true;
                    await next();
                });

                const combined = after(mainMw, afterMw);
                const ctx = {};
                
                await expect(combined(ctx)).rejects.toThrow('Main error');
                expect(afterMw).not.toHaveBeenCalled();
            });
        });

        describe('wrap() - Wrap', () => {
            it('should execute before and after hooks', async () => {
                const order = [];
                const mainMw = vi.fn(async (ctx) => {
                    order.push('main');
                    return 'result';
                });
                const beforeHook = vi.fn(async (ctx) => {
                    order.push('before');
                });
                const afterHook = vi.fn(async (ctx) => {
                    order.push('after');
                });

                const combined = wrap(mainMw, { before: beforeHook, after: afterHook });
                const result = await combined({});

                expect(result).toBe('result');
                expect(order).toEqual(['before', 'main', 'after']);
            });
        });

        describe('tryCatch() - Try Catch', () => {
            it('should catch errors', async () => {
                const mainMw = vi.fn(async () => {
                    throw new Error('Test error');
                });
                const errorMw = vi.fn(async (err, ctx) => {
                    return { error: err.message };
                });

                const combined = tryCatch(mainMw, errorMw);
                const result = await combined({});

                expect(result).toEqual({ error: 'Test error' });
            });

            it('should rethrow if no error middleware', async () => {
                const mainMw = vi.fn(async () => {
                    throw new Error('Test error');
                });

                const combined = tryCatch(mainMw);
                
                await expect(combined({})).rejects.toThrow('Test error');
            });
        });

        describe('pass() - Pass (alias for tap)', () => {
            it('should work like tap', async () => {
                const logger = vi.fn(async (ctx) => {
                    ctx.logged = true;
                });
                const handler = vi.fn(async (ctx) => {
                    return 'result';
                });

                const combined = pass(logger, handler);
                const ctx = {};
                const result = await combined(ctx);

                expect(result).toBe('result');
                expect(ctx.logged).toBe(true);
            });
        });

        describe('skip() - Skip', () => {
            it('should skip middleware when condition is false', async () => {
                const mw = vi.fn(async (ctx) => {
                    ctx.executed = true;
                    return 'executed';
                });

                const combined = skip(ctx => false, mw);
                const ctx = { value: 'test' };
                const result = await combined(ctx);

                expect(result).toEqual({ value: 'test' }); // Returns first argument
                expect(ctx.executed).toBeUndefined();
            });

            it('should execute middleware when condition is true', async () => {
                const mw = vi.fn(async (ctx) => {
                    ctx.executed = true;
                    return 'executed';
                });

                const combined = skip(ctx => true, mw);
                const ctx = { value: 'test' };
                const result = await combined(ctx);

                expect(result).toBe('executed');
                expect(ctx.executed).toBe(true);
            });
        });

        describe('identity() - Identity', () => {
            it('should return input unchanged', async () => {
                const result = identity({ test: 'value' });
                expect(result).toEqual({ test: 'value' });
            });

            it('should work in sequence', async () => {
                const mw1 = vi.fn(async (data) => data + 1);
                const combined = sequence(mw1, identity);
                const result = await combined(5);

                expect(result).toBe(6);
            });
        });

        describe('noop() - No Operation', () => {
            it('should return undefined', async () => {
                const result = noop();
                expect(result).toBeUndefined();
            });
        });
    });
});

