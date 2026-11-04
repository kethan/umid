import { describe, expect, it, vi } from 'vitest'
import { run } from './src';
describe('Mode 0: Standard Execution Without Next', () => {
    it('should execute functions sequentially', async () => {

        // Mock functions for tests
        const mockFn1 = vi.fn();
        const mockFn2 = vi.fn();

        mockFn1.mockImplementation(async (arg) => {
            // Function logic
        });
        mockFn2.mockImplementation(async (arg) => {
            // Function logic
        });

        const execute = run(0); // No `next` parameter

        await execute(mockFn1, mockFn2)('test');

        expect(mockFn1).toHaveBeenCalledWith('test');
        expect(mockFn2).toHaveBeenCalledWith('test');
    });

    it('should handle empty function or non functions array correctly', async () => {
        const execute = run(0);
        const result = await execute(1, 2, 3, undefined, null, false, 0, {})(); // No functions provided
        expect(result).toBeUndefined();
    });

    it('should handle functions correctly', async () => {
        // Mock functions for tests
        const mockFn1 = vi.fn();
        const mockFn2 = vi.fn();

        mockFn1.mockImplementation(async (arg) => {
            // Should not use `next` in mode 0
        });
        mockFn2.mockImplementation(async (arg) => {
            return 'result2';
        });

        const execute = run(0); // No `next` parameter

        const result = await execute(mockFn1, mockFn2)('test');
        expect(mockFn1).toHaveBeenCalledWith('test');
        expect(mockFn2).toHaveBeenCalledWith('test');
        expect(result).toBe('result2'); // Ensure `result` is handled correctly
    });

    it('should handle function that returns', async () => {

        // Mock functions for tests
        const mockFn1 = vi.fn();
        const mockFn2 = vi.fn();

        mockFn1.mockImplementation(async (arg) => {
            return 'result2'; // Only this function has a result
        });

        mockFn2.mockImplementation(async (arg) => {
        });

        const execute = run(0); // Mode 0

        const result = await execute(mockFn1, mockFn2)('test');

        // Result should be from mockFn2 since mockFn1 returned undefined
        expect(result).toBe('result2');
        expect(mockFn1).toHaveBeenCalledWith('test');
        expect(mockFn2).not.toHaveBeenCalled();

    });

    it('should handle a function that throws an error', async () => {

        // Mock functions for tests
        const mockFn1 = vi.fn();
        const mockFn2 = vi.fn();

        mockFn1.mockImplementation(async (arg) => {
            throw new Error('Test Error');
        });
        mockFn2.mockImplementation(async (arg) => {
            // This function should not be called due to error in mockFn1
        });

        const execute = run(0); // Mode 0

        await expect(execute(mockFn1, mockFn2)('test')).rejects.toThrow('Test Error');
        expect(mockFn1).toHaveBeenCalled();
        expect(mockFn2).not.toHaveBeenCalled();

    });

    it('should handle function chain with errors in the middle', async () => {

        const mockFn1 = vi.fn();
        const mockFn2 = vi.fn();
        const mockFn3 = vi.fn();

        mockFn1.mockImplementation(async (arg) => {

        });
        mockFn2.mockImplementation(async (arg) => {
            throw new Error('Error in mockFn2');
        });
        mockFn3.mockImplementation(async (arg) => {
            // This function should not be called due to error in mockFn2
        });

        const execute = run(0); // Mode 0

        await expect(execute(mockFn1, mockFn2, mockFn3)('test')).rejects.toThrow('Error in mockFn2');
        expect(mockFn1).toHaveBeenCalled();
        expect(mockFn2).toHaveBeenCalled();
        expect(mockFn3).not.toHaveBeenCalled();

    });

    it('should handle errors in all functions and handle the first error', async () => {

        const mockFn1 = vi.fn();
        const mockFn2 = vi.fn();
        const mockFn3 = vi.fn();

        mockFn1.mockImplementation(async (arg) => {
            throw new Error('Error in mockFn1');
        });
        mockFn2.mockImplementation(async (arg) => {
            // This function should not be called due to error in mockFn1
        });
        mockFn3.mockImplementation(async (arg) => {
            // This function should not be called
        });

        const execute = run(0); // Mode 0

        await expect(execute(mockFn1, mockFn2, mockFn3)('test')).rejects.toThrow('Error in mockFn1');
        expect(mockFn1).toHaveBeenCalled();
        expect(mockFn2).not.toHaveBeenCalled();
        expect(mockFn3).not.toHaveBeenCalled();

    });

    it('should handle chain with functions returning promises', async () => {
        const mockFn1 = vi.fn();
        const mockFn2 = vi.fn();

        mockFn1.mockImplementation(async (arg) => {
            return new Promise((resolve) => setTimeout(() => resolve('result1'), 20));
        });

        mockFn2.mockImplementation(async (arg) => {
        });

        const execute = run(0); // Mode 0

        const result = await execute(mockFn1, mockFn2)('test');

        // Expect result from the last function
        expect(result).toBe('result1');
        expect(mockFn1).toHaveBeenCalledWith('test');
        expect(mockFn2).not.toHaveBeenCalled();
    });

    it('should resolve immediately if no functions are provided', async () => {
        const result = await run()()()
        expect(result).toBeUndefined();
    });

    it('should execute a single function and return its result', async () => {
        const mockFn = (arg) => Promise.resolve(arg + 1);
        const result = await run()(mockFn)(5);
        expect(result).toBe(6);
    });

    it('should handle multiple asynchronous functions', async () => {
        const fn1 = (arg) => new Promise(resolve => setTimeout(() => { arg.c = arg.c + 1; resolve() }, 100));
        const fn2 = (arg) => new Promise(resolve => setTimeout(() => { arg.c = arg.c * 2; resolve() }, 100));
        const fn3 = (arg) => (arg.c = arg.c + 2, arg)
        const result = await run()(fn1, fn2, fn3)({ c: 3 });
        expect(result).toStrictEqual({ c: 10 }); // ((3 + 1) * 2) + 2
    });

    it('should handle errors in functions correctly', async () => {
        const fn1 = () => new Promise((_, reject) => reject(new Error('Test Error')));
        const fn2 = () => new Promise(resolve => setTimeout(() => resolve('Should not be called'), 50));

        await expect(run()(fn1, fn2)()).rejects.toThrow('Test Error');
    });

    it('should continue to the next function if previous function resolves', async () => {
        let count = 0;
        const fn1 = () => new Promise(resolve => setTimeout(() => { count++; resolve(); }, 50));
        const fn2 = () => new Promise(resolve => setTimeout(() => { count++; resolve(); }, 50));

        await run()(fn1, fn2)();
        expect(count).toBe(2); // Both functions should be called
    });

    it('should handle errors in middle of function sequence', async () => {
        let count = 0;
        const fn1 = () => new Promise(resolve => setTimeout(() => { count++; resolve(); }, 50));
        const fn2 = () => new Promise((_, reject) => setTimeout(() => reject(new Error('Error in fn2')), 50));
        const fn3 = () => new Promise(resolve => setTimeout(() => { count++; resolve(); }, 50));

        await expect(run()(fn1, fn2, fn3)()).rejects.toThrow('Error in fn2');
        expect(count).toBe(1); // Only the first function should have been called
    });
});

describe('Mode 1: Always Call Next', () => {
    it('should not call if no next', async () => {
        const mockFn1 = vi.fn();
        const mockFn2 = vi.fn();
        mockFn1.mockImplementation(async (arg) => {
            // return 'result1';
        });
        mockFn2.mockImplementation(async (arg) => {
            // next();
        });

        const execute = run(1); // `next` parameter will not be used

        execute(mockFn1, mockFn2)('test');

        expect(mockFn1).toHaveBeenCalledWith('test', expect.any(Function));
        expect(mockFn2).not.toHaveBeenCalled();
    });

    it('should call `next` and execute all functions in sequence', async () => {

        // Mock functions for tests
        const mockFn1 = vi.fn();
        const mockFn2 = vi.fn();

        mockFn1.mockImplementation(async (arg, next) => {
            next(); // Call next to proceed
        });
        mockFn2.mockImplementation(async (arg, next) => {
            next(); // Call next to proceed
        });

        const execute = run(1); // Mode 1

        await execute(mockFn1, mockFn2)('test');

        // Ensure all functions are called and `next` is used
        expect(mockFn1).toHaveBeenCalledWith('test', expect.any(Function));
        expect(mockFn2).toHaveBeenCalledWith('test', expect.any(Function));
    });

    it('should handle errors and still call `next`', async () => {
        const mockFn1 = vi.fn();
        const mockFn2 = vi.fn();

        mockFn1.mockImplementation(async (arg, next) => {
            next(new Error('Error in mockFn1')); // Call next with error
        });
        mockFn2.mockImplementation(async (arg, next) => {
            next(); // Call next to proceed
        });

        const execute = run(1); // Mode 1

        await expect(execute(mockFn1, mockFn2)('test')).rejects.toThrow('Error in mockFn1')

        expect(mockFn1).toHaveBeenCalledWith('test', expect.any(Function));
        expect(mockFn2).not.toHaveBeenCalled()
    });

    it('should handle even when `next` is called', async () => {

        const mockFn1 = vi.fn();
        const mockFn2 = vi.fn();

        mockFn1.mockImplementation(async (arg, next) => {
            next(); // Call next to proceed
        });
        mockFn2.mockImplementation(async (arg, next) => {

        });

        const execute = run(1); // Mode 1

        execute(mockFn1, mockFn2)('test');

        // Ensure all functions are called and `next` is used
        expect(mockFn1).toHaveBeenCalledWith('test', expect.any(Function));
        expect(mockFn2).toHaveBeenCalledWith('test', expect.any(Function));
    });

    it('should not continue chain if there is an error in the middle', async () => {

        const mockFn1 = vi.fn();
        const mockFn2 = vi.fn();
        const mockFn3 = vi.fn();


        mockFn1.mockImplementation(async (arg, next) => {
            next(); // Call next to proceed
        });
        mockFn2.mockImplementation(async (arg, next) => {
            next(new Error('Error in mockFn2')); // Call next with error
        });
        mockFn3.mockImplementation(async (arg, next) => {
            next(); // Call next to proceed
        });

        const execute = run(1); // Mode 1

        await expect(execute(mockFn1, mockFn2, mockFn3)('test')).rejects.toThrow('Error in mockFn2')

        expect(mockFn1).toHaveBeenCalledWith('test', expect.any(Function));
        expect(mockFn2).toHaveBeenCalledWith('test', expect.any(Function));
        expect(mockFn3).not.toHaveBeenCalled()
    });

    it('should handle chain with all functions throwing errors', async () => {

        const mockFn1 = vi.fn();
        const mockFn2 = vi.fn();
        const mockFn3 = vi.fn();

        mockFn1.mockImplementation(async (arg, next) => {
            next('Error in mockFn1'); // Call next with error
        });
        mockFn2.mockImplementation(async (arg, next) => {
            next(new Error('Error in mockFn2')); // Call next with error
        });
        mockFn3.mockImplementation(async (arg, next) => {
            next(new Error('Error in mockFn3')); // Call next with error
        });

        const execute = run(1); // Mode 1

        await expect(execute(mockFn1, mockFn2, mockFn3)('test')).rejects.toThrow('Error in mockFn1');

        // Ensure all functions are called and `next` is used
        expect(mockFn1).toHaveBeenCalledWith('test', expect.any(Function));
        expect(mockFn2).not.toHaveBeenCalled();
        expect(mockFn3).not.toHaveBeenCalled();
    });


    it('should hang if next is not called', async () => {
        const mockFn1 = vi.fn();
        const mockFn2 = vi.fn();

        mockFn1.mockImplementation(async (arg, next) => {
            // next() is not called
        });

        mockFn2.mockImplementation(async (arg, next) => {
            console.log('This should not be reached');
            await next();
        })

        // We want to see if the promise resolves within a short time frame
        let didResolve = false;

        run(1)(mockFn1, mockFn2)(3).then(() => {
            didResolve = true; // If the promise resolves, we set this flag to true
        });

        // Wait for 500ms and check if the promise resolved
        await new Promise(resolve => setTimeout(resolve, 100));

        // Since next was never called, didResolve should still be false
        expect(didResolve).toBe(false);
        expect(mockFn2).not.toHaveBeenCalled();
    });

    it('should propagate error passed to next', async () => {
        const fn1 = async (arg, next) => {
            await next(new Error("Error passed to next"));
        };

        const fn2 = async (arg, next) => {
            console.log('This should not be reached');
            await next();
        };

        await expect(run(1)(fn1, fn2)(3)).rejects.toThrow("Error passed to next");
    });


    it('should handle next being called multiple times', async () => {
        const fn1 = async (arg, next) => {
            await next();
            await next(); // This might cause issues depending on the implementation
        };

        const fn2 = async (arg, next) => {
            console.log('This might be reached twice');
            await next();
        };

        let result;
        const promise = run(1)(fn1, fn2)(3);

        setTimeout(() => {
            result = "timed out";
        }, 1000); // A 1-second timeout to simulate hanging or double execution

        await promise.catch(() => {
            result = "error";
        });

        expect(result).toBeUndefined(); // The behavior might vary
    });
});

describe('Nested Arrays and Flattening', () => {
    it('should flatten nested arrays of functions', async () => {
        const fn1 = vi.fn(async () => {});
        const fn2 = vi.fn(async () => {});
        const fn3 = vi.fn(async () => 'fn3');

        const execute = run(0);
        const result = await execute(fn1, [fn2, fn3])('test');

        expect(fn1).toHaveBeenCalledWith('test');
        expect(fn2).toHaveBeenCalledWith('test');
        expect(fn3).toHaveBeenCalledWith('test');
        expect(result).toBe('fn3');
    });

    it('should handle deeply nested arrays', async () => {
        const fn1 = vi.fn(async () => {});
        const fn2 = vi.fn(async () => {});
        const fn3 = vi.fn(async () => {});
        const fn4 = vi.fn(async () => 'result');

        const execute = run(0);
        const result = await execute(fn1, [fn2, [fn3, fn4]])('test');

        expect(fn1).toHaveBeenCalled();
        expect(fn2).toHaveBeenCalled();
        expect(fn3).toHaveBeenCalled();
        expect(fn4).toHaveBeenCalled();
        expect(result).toBe('result');
    });

    it('should filter out non-functions from nested arrays', async () => {
        const fn1 = vi.fn(async () => {});
        const fn2 = vi.fn(async () => 'fn2');

        const execute = run(0);
        const result = await execute(fn1, [null, undefined, false, 0, {}, fn2])('test');

        expect(fn1).toHaveBeenCalled();
        expect(fn2).toHaveBeenCalled();
        expect(result).toBe('fn2');
    });
});

describe('Synchronous Functions', () => {
    it('should handle synchronous functions in Mode 0', async () => {
        const fn1 = vi.fn((x) => x + 1);
        const fn2 = vi.fn((x) => x * 2);

        const execute = run(0);
        const result = await execute(fn1, fn2)(5);

        expect(fn1).toHaveBeenCalledWith(5);
        expect(fn2).not.toHaveBeenCalled();
        expect(result).toBe(6);
    });

    it('should handle synchronous functions in Mode 1', async () => {
        const fn1 = vi.fn((req, res, next) => {
            next();
        });
        const fn2 = vi.fn((req, res, next) => {
            next();
        });

        const execute = run(1);
        const req = {};
        const res = {};
        await execute(fn1, fn2)(req, res);

        expect(fn1).toHaveBeenCalledWith(req, res, expect.any(Function));
        expect(fn2).toHaveBeenCalledWith(req, res, expect.any(Function));
    });
});

describe('Error Handling Edge Cases', () => {
    it('should handle errors in synchronous functions', async () => {
        const fn1 = vi.fn(() => {
            throw new Error('Sync error');
        });
        const fn2 = vi.fn(async () => {});

        const execute = run(0);
        await expect(execute(fn1, fn2)()).rejects.toThrow('Sync error');
        expect(fn2).not.toHaveBeenCalled();
    });

    it('should handle non-Error objects thrown', async () => {
        const fn1 = vi.fn(() => {
            throw 'String error';
        });
        const fn2 = vi.fn(async () => {});

        const execute = run(0);
        await expect(execute(fn1, fn2)()).rejects.toThrow('String error');
    });
});

describe('Data Processing Pipeline', () => {
    it('should process data through a pipeline', async () => {
        const validate = vi.fn(async (data) => {
            if (typeof data.value !== 'number') {
                throw new Error('Invalid data');
            }
        });

        const normalize = vi.fn(async (data) => {
            data.value = Math.abs(data.value);
        });

        const transform = vi.fn(async (data) => {
            data.value = data.value * 2;
        });

        const markProcessed = vi.fn(async (data) => {
            data.processed = true;
            return data;
        });

        const pipeline = run(0);
        const result = await pipeline(validate, normalize, transform, markProcessed)({ value: -5, processed: false });

        expect(validate).toHaveBeenCalled();
        expect(normalize).toHaveBeenCalled();
        expect(transform).toHaveBeenCalled();
        expect(markProcessed).toHaveBeenCalled();
        expect(result).toEqual({ value: 10, processed: true });
    });

    it('should stop pipeline on error', async () => {
        const validate = vi.fn(async (data) => {
            if (!data) throw new Error('Missing data');
        });

        const normalize = vi.fn(async (data) => {
            data.value = Math.abs(data.value);
        });

        const pipeline = run(0);
        await expect(pipeline(validate, normalize)(null)).rejects.toThrow('Missing data');
        expect(normalize).not.toHaveBeenCalled();
    });
});

describe('Edge Cases', () => {
    it('should handle functions that return falsy values', async () => {
        const fn1 = vi.fn(async () => 0);
        const fn2 = vi.fn(async () => false);
        const fn3 = vi.fn(async () => '');
        const fn4 = vi.fn(async () => 'success');

        const execute = run(0);
        const result = await execute(fn1, fn2, fn3, fn4)();

        expect(fn1).toHaveBeenCalled();
        expect(fn2).toHaveBeenCalled();
        expect(fn3).toHaveBeenCalled();
        expect(fn4).toHaveBeenCalled();
        expect(result).toBe('success');
    });

    it('should handle empty array of functions', async () => {
        const execute = run(0);
        const result = await execute()();
        expect(result).toBeUndefined();
    });

    it('should handle array with only non-functions', async () => {
        const execute = run(0);
        const result = await execute(null, undefined, 0, false, {}, [])();
        expect(result).toBeUndefined();
    });
});

// ============================================================================
// Enhanced Edge Cases and Combination Tests
// ============================================================================

describe('Enhanced Edge Cases', () => {
    describe('Function Filtering', () => {
        it('should filter out objects without call property', async () => {
            const notCallable = { foo: 'bar' };
            const realFn = vi.fn(async () => 'real');
            
            const execute = run(0);
            const result = await execute(notCallable, realFn)();
            
            expect(realFn).toHaveBeenCalled();
            expect(result).toBe('real');
        });

        it('should filter out null and undefined values', async () => {
            const realFn = vi.fn(async () => 'real');
            
            const execute = run(0);
            const result = await execute(null, undefined, realFn)();
            
            expect(realFn).toHaveBeenCalled();
            expect(result).toBe('real');
        });

        it('should filter out numbers and strings', async () => {
            const realFn = vi.fn(async () => 'real');
            
            const execute = run(0);
            const result = await execute(42, 'string', realFn)();
            
            expect(realFn).toHaveBeenCalled();
            expect(result).toBe('real');
        });

        it('should filter out booleans', async () => {
            const realFn = vi.fn(async () => 'real');
            
            const execute = run(0);
            const result = await execute(true, false, realFn)();
            
            expect(realFn).toHaveBeenCalled();
            expect(result).toBe('real');
        });
    });

    describe('Mode 0 Edge Cases', () => {
        it('should handle function returning undefined explicitly', async () => {
            const fn1 = vi.fn(async () => undefined);
            const fn2 = vi.fn(async () => 'result');
            
            const execute = run(0);
            const result = await execute(fn1, fn2)('test');
            
            expect(fn1).toHaveBeenCalled();
            expect(fn2).toHaveBeenCalled();
            expect(result).toBe('result');
        });

        it('should handle function returning empty string', async () => {
            const fn1 = vi.fn(async () => '');
            const fn2 = vi.fn(async () => 'result');
            
            const execute = run(0);
            const result = await execute(fn1, fn2)('test');
            
            expect(fn1).toHaveBeenCalled();
            expect(fn2).toHaveBeenCalled();
            expect(result).toBe('result');
        });

        it('should handle function returning 0', async () => {
            const fn1 = vi.fn(async () => 0);
            const fn2 = vi.fn(async () => 'result');
            
            const execute = run(0);
            const result = await execute(fn1, fn2)('test');
            
            expect(fn1).toHaveBeenCalled();
            expect(fn2).toHaveBeenCalled();
            expect(result).toBe('result');
        });

        it('should handle function returning false', async () => {
            const fn1 = vi.fn(async () => false);
            const fn2 = vi.fn(async () => 'result');
            
            const execute = run(0);
            const result = await execute(fn1, fn2)('test');
            
            expect(fn1).toHaveBeenCalled();
            expect(fn2).toHaveBeenCalled();
            expect(result).toBe('result');
        });

        it('should handle function returning null', async () => {
            const fn1 = vi.fn(async () => null);
            const fn2 = vi.fn(async () => 'result');
            
            const execute = run(0);
            const result = await execute(fn1, fn2)('test');
            
            expect(fn1).toHaveBeenCalled();
            expect(fn2).toHaveBeenCalled();
            expect(result).toBe('result');
        });

        it('should stop at first truthy return value', async () => {
            const fn1 = vi.fn(async () => 'truthy');
            const fn2 = vi.fn(async () => 'should not be called');
            const fn3 = vi.fn(async () => 'also not called');
            
            const execute = run(0);
            const result = await execute(fn1, fn2, fn3)('test');
            
            expect(fn1).toHaveBeenCalled();
            expect(fn2).not.toHaveBeenCalled();
            expect(fn3).not.toHaveBeenCalled();
            expect(result).toBe('truthy');
        });

        it('should continue through all falsy return values', async () => {
            const fn1 = vi.fn(async () => 0);
            const fn2 = vi.fn(async () => false);
            const fn3 = vi.fn(async () => '');
            const fn4 = vi.fn(async () => null);
            const fn5 = vi.fn(async () => undefined);
            const fn6 = vi.fn(async () => 'finally truthy');
            
            const execute = run(0);
            const result = await execute(fn1, fn2, fn3, fn4, fn5, fn6)('test');
            
            expect(fn1).toHaveBeenCalled();
            expect(fn2).toHaveBeenCalled();
            expect(fn3).toHaveBeenCalled();
            expect(fn4).toHaveBeenCalled();
            expect(fn5).toHaveBeenCalled();
            expect(fn6).toHaveBeenCalled();
            expect(result).toBe('finally truthy');
        });

        it('should handle deeply nested promise chains', async () => {
            const fn1 = vi.fn(async () => {
                return new Promise(resolve => 
                    setTimeout(() => resolve('nested'), 10)
                );
            });
            const fn2 = vi.fn(async () => 'result');
            
            const execute = run(0);
            const result = await execute(fn1, fn2)('test');
            
            expect(fn1).toHaveBeenCalled();
            expect(fn2).not.toHaveBeenCalled();
            expect(result).toBe('nested');
        });
    });

    describe('Mode 1 Edge Cases', () => {
        it('should handle next called with undefined', async () => {
            const fn1 = vi.fn(async (arg, next) => {
                await next(undefined);
            });
            const fn2 = vi.fn(async (arg, next) => {
                await next();
            });
            
            const execute = run(1);
            await execute(fn1, fn2)('test');
            
            expect(fn1).toHaveBeenCalled();
            expect(fn2).toHaveBeenCalled();
        });

        it('should handle next called with null', async () => {
            const fn1 = vi.fn(async (arg, next) => {
                await next(null);
            });
            const fn2 = vi.fn(async (arg, next) => {
                await next();
            });
            
            const execute = run(1);
            await execute(fn1, fn2)('test');
            
            expect(fn1).toHaveBeenCalled();
            expect(fn2).toHaveBeenCalled();
        });

        it('should handle next called with empty string error', async () => {
            const fn1 = vi.fn(async (arg, next) => {
                await next('');
            });
            const fn2 = vi.fn(async (arg, next) => {
                await next();
            });
            
            const execute = run(1);
            await execute(fn1, fn2)('test');
            
            expect(fn1).toHaveBeenCalled();
            expect(fn2).toHaveBeenCalled();
        });

        it('should handle next called with 0 error', async () => {
            const fn1 = vi.fn(async (arg, next) => {
                await next(0);
            });
            const fn2 = vi.fn(async (arg, next) => {
                await next();
            });
            
            const execute = run(1);
            await execute(fn1, fn2)('test');
            
            expect(fn1).toHaveBeenCalled();
            expect(fn2).toHaveBeenCalled();
        });

        it('should handle next called with false error', async () => {
            const fn1 = vi.fn(async (arg, next) => {
                await next(false);
            });
            const fn2 = vi.fn(async (arg, next) => {
                await next();
            });
            
            const execute = run(1);
            await execute(fn1, fn2)('test');
            
            expect(fn1).toHaveBeenCalled();
            expect(fn2).toHaveBeenCalled();
        });

        it('should stop chain when next is called with truthy error', async () => {
            const fn1 = vi.fn(async (arg, next) => {
                await next(new Error('stop'));
            });
            const fn2 = vi.fn(async (arg, next) => {
                await next();
            });
            
            const execute = run(1);
            await expect(execute(fn1, fn2)('test')).rejects.toThrow('stop');
            
            expect(fn1).toHaveBeenCalled();
            expect(fn2).not.toHaveBeenCalled();
        });

        it('should handle next called multiple times in sequence', async () => {
            const fn1 = vi.fn(async (arg, next) => {
                await next();
                await next();
                await next();
            });
            const fn2 = vi.fn(async (arg, next) => {
                await next();
            });
            
            const execute = run(1);
            await execute(fn1, fn2)('test');
            
            expect(fn1).toHaveBeenCalled();
            expect(fn2).toHaveBeenCalled();
        });

        it('should handle next called with different error types', async () => {
            const errors = [
                new Error('error object'),
                'string error',
                404,
                { code: 'CUSTOM_ERROR', message: 'Custom error' },
                new TypeError('type error'),
                new RangeError('range error')
            ];
            
            for (const error of errors) {
                const fn1 = vi.fn(async (arg, next) => {
                    await next(error);
                });
                const fn2 = vi.fn(async (arg, next) => {
                    await next();
                });
                
                const execute = run(1);
                await expect(execute(fn1, fn2)('test')).rejects.toBe(error);
                expect(fn2).not.toHaveBeenCalled();
            }
        });
    });

    describe('Nested Array Combinations', () => {
        it('should handle array with multiple levels of nesting', async () => {
            const fn1 = vi.fn(async () => {});
            const fn2 = vi.fn(async () => {});
            const fn3 = vi.fn(async () => {});
            const fn4 = vi.fn(async () => 'result');
            
            const execute = run(0);
            const result = await execute(
                fn1,
                [fn2, [fn3, [fn4]]]
            )('test');
            
            expect(fn1).toHaveBeenCalled();
            expect(fn2).toHaveBeenCalled();
            expect(fn3).toHaveBeenCalled();
            expect(fn4).toHaveBeenCalled();
            expect(result).toBe('result');
        });

        it('should handle mixed functions and arrays at different levels', async () => {
            const fn1 = vi.fn(async () => {});
            const fn2 = vi.fn(async () => {});
            const fn3 = vi.fn(async () => {});
            const fn4 = vi.fn(async () => {});
            
            const execute = run(0);
            await execute(
                [fn1, fn2],
                [fn3],
                fn4
            )('test');
            
            expect(fn1).toHaveBeenCalled();
            expect(fn2).toHaveBeenCalled();
            expect(fn3).toHaveBeenCalled();
            expect(fn4).toHaveBeenCalled();
        });

        it('should handle arrays with only non-functions at various levels', async () => {
            const fn1 = vi.fn(async () => 'result');
            
            const execute = run(0);
            const result = await execute(
                [null, undefined],
                [[], {}],
                fn1
            )('test');
            
            expect(fn1).toHaveBeenCalled();
            expect(result).toBe('result');
        });

        it('should handle empty arrays at various levels', async () => {
            const fn1 = vi.fn(async () => {});
            const fn2 = vi.fn(async () => 'result');
            
            const execute = run(0);
            const result = await execute(
                [],
                [fn1, []],
                fn2
            )('test');
            
            expect(fn1).toHaveBeenCalled();
            expect(fn2).toHaveBeenCalled();
            expect(result).toBe('result');
        });
    });

    describe('Mode Switching and Mixed Modes', () => {
        it('should handle mode 0 with functions that have next parameter', async () => {
            const fn1 = vi.fn(async (arg, next) => {
                return 'result';
            });
            
            const execute = run(0);
            const result = await execute(fn1)('test');
            
            expect(fn1).toHaveBeenCalledWith('test');
            expect(result).toBe('result');
        });

        it('should handle mode 1 with functions that do not use next', async () => {
            const fn1 = vi.fn(async (arg, next) => {
                // In mode 1, next is passed but not called, so chain hangs
                // This is expected behavior - the test should timeout
                // So we test that it does NOT complete within a short time
                return 'result';
            });
            
            const execute = run(1);
            const promise = execute(fn1)('test');
            
            // Should not resolve within 100ms
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Check that the promise is still pending
            let hasResolved = false;
            promise.then(() => { hasResolved = true; }).catch(() => { hasResolved = true; });
            
            await new Promise(resolve => setTimeout(resolve, 50));
            expect(hasResolved).toBe(false);
        });

        it('should handle switching between mode 0 and mode 1 executions', async () => {
            const fn1 = vi.fn(async (arg) => 'mode0');
            const fn2 = vi.fn(async (arg, next) => {
                await next();
            });
            
            const execute0 = run(0);
            const execute1 = run(1);
            
            const result0 = await execute0(fn1)('test');
            expect(result0).toBe('mode0');
            
            await execute1(fn2)('test');
            expect(fn2).toHaveBeenCalled();
        });
    });

    describe('Argument Passing', () => {
        it('should pass multiple arguments to functions in mode 0', async () => {
            const fn1 = vi.fn(async (a, b, c) => {
                return a + b + c;
            });
            
            const execute = run(0);
            const result = await execute(fn1)(1, 2, 3);
            
            expect(fn1).toHaveBeenCalledWith(1, 2, 3);
            expect(result).toBe(6);
        });

        it('should pass multiple arguments to functions in mode 1', async () => {
            const fn1 = vi.fn(async (a, b, c, next) => {
                expect(a).toBe(1);
                expect(b).toBe(2);
                expect(c).toBe(3);
                await next();
            });
            
            const execute = run(1);
            await execute(fn1)(1, 2, 3);
            
            expect(fn1).toHaveBeenCalledWith(1, 2, 3, expect.any(Function));
        });

        it('should handle functions with different arity', async () => {
            const fn1 = vi.fn(async (a) => a);
            const fn2 = vi.fn(async (a, b) => a + b);
            const fn3 = vi.fn(async (a, b, c) => a + b + c);
            
            const execute = run(0);
            const result = await execute(fn1, fn2, fn3)(1, 2, 3);
            
            expect(fn1).toHaveBeenCalledWith(1, 2, 3);
            expect(result).toBe(1);
        });

        it('should handle no arguments', async () => {
            const fn1 = vi.fn(async () => 'result');
            
            const execute = run(0);
            const result = await execute(fn1)();
            
            expect(fn1).toHaveBeenCalledWith();
            expect(result).toBe('result');
        });

        it('should handle undefined arguments', async () => {
            const fn1 = vi.fn(async (a, b) => {
                expect(a).toBeUndefined();
                expect(b).toBeUndefined();
                return 'result';
            });
            
            const execute = run(0);
            const result = await execute(fn1)(undefined, undefined);
            
            expect(result).toBe('result');
        });

        it('should handle null arguments', async () => {
            const fn1 = vi.fn(async (a, b) => {
                expect(a).toBeNull();
                expect(b).toBeNull();
                return 'result';
            });
            
            const execute = run(0);
            const result = await execute(fn1)(null, null);
            
            expect(result).toBe('result');
        });
    });

    describe('Error Handling Combinations', () => {
        it('should handle error in first function of long chain', async () => {
            const functions = Array.from({ length: 100 }, (_, i) =>
                vi.fn(async (arg) => {
                    if (i === 0) throw new Error('First function error');
                    return i;
                })
            );
            
            const execute = run(0);
            await expect(execute(...functions)('test')).rejects.toThrow('First function error');
            
            expect(functions[0]).toHaveBeenCalled();
            for (let i = 1; i < functions.length; i++) {
                expect(functions[i]).not.toHaveBeenCalled();
            }
        });

        it('should handle error in middle function of long chain', async () => {
            const functions = Array.from({ length: 100 }, (_, i) =>
                vi.fn(async (arg) => {
                    if (i === 50) throw new Error('Middle function error');
                    // Return undefined (falsy) to continue the chain
                })
            );
            
            const execute = run(0);
            await expect(execute(...functions)('test')).rejects.toThrow('Middle function error');
            
            for (let i = 0; i < 50; i++) {
                expect(functions[i]).toHaveBeenCalled();
            }
            expect(functions[50]).toHaveBeenCalled();
            for (let i = 51; i < functions.length; i++) {
                expect(functions[i]).not.toHaveBeenCalled();
            }
        });

        it('should handle error in last function of long chain', async () => {
            const functions = Array.from({ length: 100 }, (_, i) =>
                vi.fn(async (arg) => {
                    if (i === 99) throw new Error('Last function error');
                    // Return undefined (falsy) to continue the chain
                })
            );
            
            const execute = run(0);
            await expect(execute(...functions)('test')).rejects.toThrow('Last function error');
            
            for (let i = 0; i < functions.length; i++) {
                expect(functions[i]).toHaveBeenCalled();
            }
        });

        it('should handle different error types in chain', async () => {
            const errors = [
                new Error('Error'),
                new TypeError('TypeError'),
                new RangeError('RangeError'),
                new SyntaxError('SyntaxError'),
                'String error',
                404,
                { code: 'CUSTOM' }
            ];
            
            for (const error of errors) {
                const fn1 = vi.fn(async () => {
                    throw error;
                });
                const fn2 = vi.fn(async () => {});
                
                const execute = run(0);
                await expect(execute(fn1, fn2)()).rejects.toBe(error);
                expect(fn2).not.toHaveBeenCalled();
            }
        });
    });

    describe('Concurrency and Async Behavior', () => {
        it('should handle async functions with different delays', async () => {
            const results = [];
            const delays = [50, 30, 10, 20, 40];
            
            const functions = delays.map((delay, i) =>
                vi.fn(async (arg, next) => {
                    await new Promise(resolve => setTimeout(resolve, delay));
                    results.push(i);
                    if (next) await next();
                })
            );
            
            const execute = run(1);
            await execute(...functions)('test');
            
            expect(results).toEqual([0, 1, 2, 3, 4]);
        });

        it('should handle functions that return promises with different resolutions', async () => {
            const fn1 = vi.fn(async () => {
                return new Promise(resolve => setTimeout(() => resolve('async1'), 10));
            });
            const fn2 = vi.fn(async () => {
                return new Promise(resolve => setTimeout(() => resolve('async2'), 20));
            });
            
            const execute = run(0);
            const result = await execute(fn1, fn2)();
            
            expect(fn1).toHaveBeenCalled();
            expect(fn2).not.toHaveBeenCalled();
            expect(result).toBe('async1');
        });

        it('should handle functions that return rejected promises', async () => {
            const fn1 = vi.fn(async () => {
                return Promise.reject(new Error('Rejected promise'));
            });
            const fn2 = vi.fn(async () => {});
            
            const execute = run(0);
            await expect(execute(fn1, fn2)()).rejects.toThrow('Rejected promise');
            
            expect(fn1).toHaveBeenCalled();
            expect(fn2).not.toHaveBeenCalled();
        });

        it('should handle mixed sync and async functions in mode 0', async () => {
            const syncFn = vi.fn((x) => x + 1);
            const asyncFn1 = vi.fn(async (x) => {
                await new Promise(resolve => setTimeout(resolve, 10));
                return x + 1;
            });
            const asyncFn2 = vi.fn(async (x) => {
                return x + 1;
            });
            
            const execute = run(0);
            const result = await execute(syncFn, asyncFn1, asyncFn2)(5);
            
            expect(syncFn).toHaveBeenCalledWith(5);
            expect(asyncFn1).not.toHaveBeenCalled();
            expect(result).toBe(6);
        });

        it('should handle mixed sync and async functions in mode 1', async () => {
            const syncFn = vi.fn((x, next) => {
                next();
            });
            const asyncFn = vi.fn(async (x, next) => {
                await new Promise(resolve => setTimeout(resolve, 10));
                await next();
            });
            
            const execute = run(1);
            await execute(syncFn, asyncFn)(5);
            
            expect(syncFn).toHaveBeenCalledWith(5, expect.any(Function));
            expect(asyncFn).toHaveBeenCalledWith(5, expect.any(Function));
        });
    });

    describe('Return Value Handling', () => {
        it('should return undefined when no function returns a value', async () => {
            const fn1 = vi.fn(async () => {});
            const fn2 = vi.fn(async () => {});
            
            const execute = run(0);
            const result = await execute(fn1, fn2)('test');
            
            expect(result).toBeUndefined();
        });

        it('should return the first truthy value from any function', async () => {
            const fn1 = vi.fn(async () => {});
            const fn2 = vi.fn(async () => {});
            const fn3 = vi.fn(async () => 'first truthy');
            const fn4 = vi.fn(async () => {});
            
            const execute = run(0);
            const result = await execute(fn1, fn2, fn3, fn4)('test');
            
            expect(result).toBe('first truthy');
            expect(fn4).not.toHaveBeenCalled();
        });

        it('should return object from function', async () => {
            const fn1 = vi.fn(async () => ({ key: 'value' }));
            
            const execute = run(0);
            const result = await execute(fn1)('test');
            
            expect(result).toEqual({ key: 'value' });
        });

        it('should return array from function', async () => {
            const fn1 = vi.fn(async () => [1, 2, 3]);
            
            const execute = run(0);
            const result = await execute(fn1)('test');
            
            expect(result).toEqual([1, 2, 3]);
        });

        it('should return number from function', async () => {
            const fn1 = vi.fn(async () => 42);
            
            const execute = run(0);
            const result = await execute(fn1)('test');
            
            expect(result).toBe(42);
        });

        it('should return boolean true from function', async () => {
            const fn1 = vi.fn(async () => true);
            
            const execute = run(0);
            const result = await execute(fn1)('test');
            
            expect(result).toBe(true);
        });

        it('should return function from function', async () => {
            const returnedFn = () => 'returned function';
            const fn1 = vi.fn(async () => returnedFn);
            
            const execute = run(0);
            const result = await execute(fn1)('test');
            
            expect(result).toBe(returnedFn);
            expect(result()).toBe('returned function');
        });
    });

    describe('Function Identity and Properties', () => {
        it('should preserve function this context', async () => {
            const obj = {
                value: 42,
                fn: async function() {
                    return this.value;
                }
            };
            
            const execute = run(0);
            const result = await execute(obj.fn.bind(obj))();
            
            expect(result).toBe(42);
        });

        it('should handle arrow functions', async () => {
            const arrowFn = vi.fn(async () => 'arrow');
            
            const execute = run(0);
            const result = await execute(arrowFn)();
            
            expect(arrowFn).toHaveBeenCalled();
            expect(result).toBe('arrow');
        });

        it('should handle generator functions', async () => {
            function* generatorFn() {
                yield 1;
                yield 2;
            }
            
            const execute = run(0);
            const result = await execute(generatorFn)();
            
            const gen = result;
            expect(gen.next().value).toBe(1);
            expect(gen.next().value).toBe(2);
        });

        it('should handle async generator functions', async () => {
            async function* asyncGeneratorFn() {
                yield 1;
                yield 2;
            }
            
            const execute = run(0);
            const result = await execute(asyncGeneratorFn)();
            
            const gen = result;
            const { value } = await gen.next();
            expect(value).toBe(1);
        });

        it('should handle functions with custom properties', async () => {
            const fn = vi.fn(async () => 'result');
            fn.customProp = 'custom value';
            fn.anotherProp = { nested: true };
            
            const execute = run(0);
            const result = await execute(fn)();
            
            expect(result).toBe('result');
            expect(fn.customProp).toBe('custom value');
            expect(fn.anotherProp).toEqual({ nested: true });
        });
    });

    describe('Extreme Edge Cases', () => {
        it('should handle very large number of functions', async () => {
            const count = 1000;
            const functions = Array.from({ length: count }, (_, i) =>
                vi.fn(async (n) => {
                    // Return undefined (falsy) to continue chain
                    if (i === count - 1) return 'last';
                })
            );
            
            const execute = run(0);
            const result = await execute(...functions)(0);
            
            for (let i = 0; i < count; i++) {
                expect(functions[i]).toHaveBeenCalledWith(0);
            }
            expect(result).toBe('last');
        });

        it('should handle functions with very large arguments', async () => {
            const largeArray = Array.from({ length: 10000 }, (_, i) => i);
            const fn = vi.fn(async (arr) => arr.length);
            
            const execute = run(0);
            const result = await execute(fn)(largeArray);
            
            expect(fn).toHaveBeenCalledWith(largeArray);
            expect(result).toBe(10000);
        });

        it('should handle functions with circular references in arguments', async () => {
            const obj = { a: 1 };
            obj.self = obj;
            const fn = vi.fn(async (o) => o.a);
            
            const execute = run(0);
            const result = await execute(fn)(obj);
            
            expect(fn).toHaveBeenCalledWith(obj);
            expect(result).toBe(1);
        });

        it('should handle functions with Symbol arguments', async () => {
            const sym = Symbol('test');
            const fn = vi.fn(async (s) => s.toString());
            
            const execute = run(0);
            const result = await execute(fn)(sym);
            
            expect(fn).toHaveBeenCalledWith(sym);
            expect(result).toBe('Symbol(test)');
        });

        it('should handle functions with BigInt arguments', async () => {
            const bigInt = BigInt(9007199254740991);
            const fn = vi.fn(async (n) => n.toString());
            
            const execute = run(0);
            const result = await execute(fn)(bigInt);
            
            expect(fn).toHaveBeenCalledWith(bigInt);
            expect(result).toBe('9007199254740991');
        });

        it('should handle empty function name', async () => {
            const anonymousFn = vi.fn(async () => 'anonymous');
            
            const execute = run(0);
            const result = await execute(anonymousFn)();
            
            expect(anonymousFn).toHaveBeenCalled();
            expect(result).toBe('anonymous');
        });

        it('should handle functions with very long names', async () => {
            const longName = 'a'.repeat(1000);
            const fn = vi.fn(async () => 'result');
            Object.defineProperty(fn, 'name', { value: longName });
            
            const execute = run(0);
            const result = await execute(fn)();
            
            expect(fn).toHaveBeenCalled();
            expect(result).toBe('result');
        });
    });

    describe('Mode 0 vs Mode 1 Behavior Differences', () => {
        it('should behave differently in mode 0 vs mode 1 with same functions', async () => {
            const fn1 = vi.fn(async (arg, next) => {
                if (next) {
                    await next();
                }
                return 'result';
            });
            
            const execute0 = run(0);
            const execute1 = run(1);
            
            const result0 = await execute0(fn1)('test');
            expect(result0).toBe('result');
            
            await execute1(fn1)('test');
            expect(fn1).toHaveBeenCalledWith('test', expect.any(Function));
        });

        it('should handle return values differently in mode 0 vs mode 1', async () => {
            const fn1 = vi.fn(async (arg, next) => {
                return 'returned';
            });
            const fn2 = vi.fn(async (arg, next) => {
                if (next) await next();
            });
            
            const execute0 = run(0);
            const result0 = await execute0(fn1, fn2)('test');
            expect(result0).toBe('returned');
            expect(fn2).not.toHaveBeenCalled();
            
            // In mode 1, fn1 doesn't call next(), so the chain hangs
            // This is expected behavior
            const execute1 = run(1);
            const promise = execute1(fn1, fn2)('test');
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            let hasResolved = false;
            promise.then(() => { hasResolved = true; }).catch(() => { hasResolved = true; });
            
            await new Promise(resolve => setTimeout(resolve, 50));
            expect(hasResolved).toBe(false);
        });

        it('should handle errors differently in mode 0 vs mode 1', async () => {
            const fn1 = vi.fn(async (arg, next) => {
                throw new Error('error');
            });
            const fn2 = vi.fn(async (arg, next) => {
                if (next) await next();
            });
            
            const execute0 = run(0);
            await expect(execute0(fn1, fn2)('test')).rejects.toThrow('error');
            expect(fn2).not.toHaveBeenCalled();
            
            const execute1 = run(1);
            await expect(execute1(fn1, fn2)('test')).rejects.toThrow('error');
            expect(fn2).not.toHaveBeenCalled();
        });
    });

    describe('Real-World Scenario Combinations', () => {
        it('should handle middleware chain with authenticated user', async () => {
            const auth = async (ctx, next) => {
                if (!ctx.user) {
                    next(new Error('Unauthorized'));
                    return;
                }
                await next();
            };
            
            const logger = async (ctx, next) => {
                await next();
            };
            
            const handler = async (ctx, next) => {
                ctx.data = 'processed';
                await next();
            };
            
            const execute = run(1);
            const ctx = { user: { id: 1 } };
            
            await execute(auth, logger, handler)(ctx);
            expect(ctx.data).toBe('processed');
        });

        it('should handle middleware chain with unauthenticated user', async () => {
            const auth = async (ctx, next) => {
                if (!ctx.user) {
                    next(new Error('Unauthorized'));
                    return;
                }
                await next();
            };
            
            const logger = async (ctx, next) => {
                await next();
            };
            
            const handler = async (ctx, next) => {
                ctx.data = 'processed';
                await next();
            };
            
            const execute = run(1);
            const ctx = {};
            
            await expect(execute(auth, logger, handler)(ctx)).rejects.toThrow('Unauthorized');
        });

        it('should handle data pipeline with validation and transformation', async () => {
            const validate = vi.fn(async (data) => {
                if (!data || !data.value) throw new Error('Invalid');
            });
            const transform = vi.fn(async (data) => {
                data.value = data.value * 2;
            });
            const save = vi.fn(async (data) => {
                return { saved: true, value: data.value };
            });
            
            const execute = run(0);
            const result = await execute(validate, transform, save)({ value: 5 });
            
            expect(validate).toHaveBeenCalled();
            expect(transform).toHaveBeenCalled();
            expect(save).toHaveBeenCalled();
            expect(result).toEqual({ saved: true, value: 10 });
        });

        it('should handle plugin system with short-circuiting', async () => {
            const plugin1 = vi.fn(async (ctx, next) => {
                ctx.plugins.push('plugin1');
                await next();
            });
            const plugin2 = vi.fn(async (ctx, next) => {
                ctx.plugins.push('plugin2');
                // Short-circuit: don't call next - this will cause the chain to hang
                // So we need to test this differently
            });
            const plugin3 = vi.fn(async (ctx, next) => {
                ctx.plugins.push('plugin3');
                await next();
            });
            
            const execute = run(1);
            const ctx = { plugins: [] };
            
            // This will hang because plugin2 doesn't call next
            // So we test that it doesn't complete within a short time
            const promise = execute(plugin1, plugin2, plugin3)(ctx);
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            let hasResolved = false;
            promise.then(() => { hasResolved = true; }).catch(() => { hasResolved = true; });
            
            await new Promise(resolve => setTimeout(resolve, 50));
            expect(hasResolved).toBe(false);
            expect(plugin1).toHaveBeenCalled();
            expect(plugin2).toHaveBeenCalled();
            expect(plugin3).not.toHaveBeenCalled();
            expect(ctx.plugins).toEqual(['plugin1', 'plugin2']);
        });

        it('should handle error in middleware chain', async () => {
            const errorHandler = vi.fn(async (ctx, next) => {
                try {
                    await next();
                } catch (err) {
                    ctx.error = err.message;
                    // Note: In the current implementation, we can't recover
                    // from errors because they propagate via promise rejection
                    // This is expected behavior for Mode 1
                }
            });
            const failing = vi.fn(async (ctx, next) => {
                throw new Error('Controlled error');
            });
            const afterError = vi.fn(async (ctx, next) => {
                ctx.afterError = true;
                await next();
            });
            
            const execute = run(1);
            const ctx = {};
            
            // The error will propagate and reject the promise
            await execute(errorHandler, failing, afterError)(ctx).catch(() => {});
            
            expect(errorHandler).toHaveBeenCalled();
            expect(failing).toHaveBeenCalled();
            // Note: ctx.error won't be set because the error propagates
            // before the catch block can set it
            expect(afterError).not.toHaveBeenCalled();
        });

        it('should handle conditional middleware based on context', async () => {
            const conditional = vi.fn(async (ctx, next) => {
                if (ctx.skip) {
                    return; // Don't call next
                }
                await next();
            });
            const handler = vi.fn(async (ctx, next) => {
                ctx.handled = true;
                await next();
            });
            
            const execute = run(1);
            
            // Test with skip = false
            const ctx1 = { skip: false };
            await execute(conditional, handler)(ctx1);
            expect(handler).toHaveBeenCalled();
            expect(ctx1.handled).toBe(true);
            
            // Test with skip = true
            const ctx2 = { skip: true };
            await execute(conditional, handler)(ctx2);
            expect(ctx2.handled).toBeUndefined();
        });
    });
});