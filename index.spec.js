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