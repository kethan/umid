// import { describe, expect, it, vi } from 'vitest'
// import { run } from './src';

// // Mock functions for tests
// // const mockFn1 = vi.fn();
// // const mockFn2 = vi.fn();
// // const mockFn3 = vi.fn();
// // const mockFnError = vi.fn();


// describe('Mode 0: Standard Execution Without Next', () => {
//     it('should execute functions sequentially without using next', async () => {

//         const mockFn1 = vi.fn();
//         const mockFn2 = vi.fn();
//         const mockFn3 = vi.fn();
//         const mockFnError = vi.fn();
//         mockFn1.mockImplementation(async (arg) => {
//             // Function logic
//         });
//         mockFn2.mockImplementation(async (arg) => {
//             // Function logic
//         });

//         const execute = run(0); // No `next` parameter

//         await execute(mockFn1, mockFn2)('test');

//         expect(mockFn1).toHaveBeenCalled();
//         expect(mockFn2).not.toHaveBeenCalled();
//     });

//     // it('should handle empty function array correctly', async () => {
//     //     const execute = run(0); // Mode 0

//     //     const result = await execute()(); // No functions provided

//     //     // No functions should result in no errors and no results
//     //     expect(result).toBeUndefined();
//     // });

//     // it('should handle functions correctly and not use `next`', async () => {
//     //     mockFn1.mockImplementation(async (arg) => {
//     //         // Should not use `next` in mode 0
//     //     });
//     //     mockFn2.mockImplementation(async (arg) => {
//     //         return 'result2';
//     //     });

//     //     const execute = run(0); // No `next` parameter

//     //     const result = await execute(mockFn1, mockFn2)('test');
//     //     expect(mockFn1).toHaveBeenCalledWith('test', false);
//     //     expect(mockFn2).toHaveBeenCalledWith('test', false);
//     //     expect(result).toBe('result2'); // Ensure `result` is handled correctly
//     // });

//     // it('should handle function that returns undefined', async () => {
//     //     mockFn1.mockImplementation(async (arg) => {
//     //         // Do not return a result
//     //     });
//     //     mockFn2.mockImplementation(async (arg) => {
//     //         return 'result2'; // Only this function has a result
//     //     });

//     //     const execute = run(0); // Mode 0

//     //     const result = await execute(mockFn1, mockFn2)('test');

//     //     // Result should be from mockFn2 since mockFn1 returned undefined
//     //     expect(result).toBe('result2');
//     // });

//     // it('should handle a function that throws an error', async () => {
//     //     mockFn1.mockImplementation(async (arg) => {
//     //         throw new Error('Test Error');
//     //     });
//     //     mockFn2.mockImplementation(async (arg) => {
//     //         // This function should not be called due to error in mockFn1
//     //     });

//     //     const execute = run(0); // Mode 0

//     //     await expect(execute(mockFn1, mockFn2)('test')).rejects.toThrow('Test Error');
//     // });

//     // it('should handle function chain with errors in the middle', async () => {
//     //     mockFn1.mockImplementation(async (arg) => {

//     //     });
//     //     mockFn2.mockImplementation(async (arg) => {
//     //         throw new Error('Error in mockFn2');
//     //     });
//     //     mockFn3.mockImplementation(async (arg) => {
//     //         // This function should not be called due to error in mockFn2
//     //     });

//     //     const execute = run(0); // Mode 0

//     //     await expect(execute(mockFn1, mockFn2, mockFn3)('test')).rejects.toThrow('Error in mockFn2');
//     // });

//     // it('should handle errors in all functions and propagate the first error', async () => {
//     //     mockFn1.mockImplementation(async (arg) => {
//     //         throw new Error('Error in mockFn1');
//     //     });
//     //     mockFn2.mockImplementation(async (arg) => {
//     //         // This function should not be called due to error in mockFn1
//     //     });
//     //     mockFn3.mockImplementation(async (arg) => {
//     //         // This function should not be called
//     //     });

//     //     const execute = run(0); // Mode 0

//     //     await expect(execute(mockFn1, mockFn2, mockFn3)('test')).rejects.toThrow('Error in mockFn1');
//     // });

//     // it('should handle chain with functions returning promises', async () => {
//     //     mockFn1.mockImplementation(async (arg) => {
//     //         return new Promise((resolve) => resolve('result1'));
//     //     });
//     //     mockFn2.mockImplementation(async (arg) => {
//     //         return new Promise((resolve) => resolve('result2'));
//     //     });

//     //     const execute = run(0); // Mode 0

//     //     const result = await execute(mockFn1, mockFn2)('test');

//     //     // Expect result from the last function
//     //     expect(result).toBe('result1');
//     // });
// });

// // describe('Mode 1: Always Call Next', () => {
// //     it('should not call if no next', async () => {
// //         mockFn1.mockImplementation(async (arg) => {
// //             // return 'result1';
// //         });
// //         mockFn2.mockImplementation(async (arg) => {
// //             // next();
// //         });

// //         const execute = run(1); // `next` parameter will not be used

// //         const result = await execute(mockFn1, mockFn2)('test');

// //         expect(result).toBeUndefined();
// //         expect(mockFn1).toHaveBeenCalledWith('test', false);
// //         expect(mockFn2).not.toHaveBeenCalled();
// //     });
// // });


// // describe('Mode 1: Always Call Next', () => {

// //     it('should call `next` and execute all functions in sequence', async () => {
// //         mockFn1.mockImplementation(async (arg, next) => {
// //             console.log(next);

// //             next(); // Call next to proceed
// //         });
// //         mockFn2.mockImplementation(async (arg, next) => {
// //             next(); // Call next to proceed
// //         });

// //         const execute = run(1); // Mode 1

// //         await execute(mockFn1, mockFn2)('test');

// //         // Ensure all functions are called and `next` is used
// //         expect(mockFn1).toHaveBeenCalledWith('test', expect.any(Function));
// //         expect(mockFn2).toHaveBeenCalledWith('test', expect.any(Function));
// //     });

// //     it('should handle errors and still call `next`', async () => {
// //         mockFn1.mockImplementation(async (arg, next) => {
// //             next(new Error('Error in mockFn1')); // Call next with error
// //         });
// //         mockFn2.mockImplementation(async (arg, next) => {
// //             next(); // Call next to proceed
// //         });

// //         const execute = run(1); // Mode 1

// //         await execute(mockFn1, mockFn2)('test');

// //         // Ensure all functions are called and `next` is used
// //         expect(mockFn1).toHaveBeenCalledWith('test', expect.any(Function));
// //         expect(mockFn2).toHaveBeenCalledWith('test', expect.any(Function));
// //     });

// //     it('should handle results even when `next` is called', async () => {
// //         mockFn1.mockImplementation(async (arg, next) => {
// //             next(); // Call next to proceed
// //         });
// //         mockFn2.mockImplementation(async (arg, next) => {
// //             return 'result2'; // Return result
// //         });

// //         const execute = run(1); // Mode 1

// //         const result = await execute(mockFn1, mockFn2)('test');

// //         // Result should be from the last function that returns a value
// //         expect(result).toBe('result2');
// //     });

// //     it('should continue chain even if there is an error in the middle', async () => {
// //         mockFn1.mockImplementation(async (arg, next) => {
// //             next(); // Call next to proceed
// //         });
// //         mockFn2.mockImplementation(async (arg, next) => {
// //             next(new Error('Error in mockFn2')); // Call next with error
// //         });
// //         mockFn3.mockImplementation(async (arg, next) => {
// //             next(); // Call next to proceed
// //         });

// //         const execute = run(1); // Mode 1

// //         await execute(mockFn1, mockFn2, mockFn3)('test');

// //         // Ensure all functions are called and `next` is used
// //         expect(mockFn1).toHaveBeenCalledWith('test', expect.any(Function));
// //         expect(mockFn2).toHaveBeenCalledWith('test', expect.any(Function));
// //         expect(mockFn3).toHaveBeenCalledWith('test', expect.any(Function));
// //     });

// //     it('should handle chain with all functions throwing errors', async () => {
// //         mockFn1.mockImplementation(async (arg, next) => {
// //             next(new Error('Error in mockFn1')); // Call next with error
// //         });
// //         mockFn2.mockImplementation(async (arg, next) => {
// //             next(new Error('Error in mockFn2')); // Call next with error
// //         });
// //         mockFn3.mockImplementation(async (arg, next) => {
// //             next(new Error('Error in mockFn3')); // Call next with error
// //         });

// //         const execute = run(1); // Mode 1

// //         await execute(mockFn1, mockFn2, mockFn3)('test');

// //         // Ensure all functions are called and `next` is used
// //         expect(mockFn1).toHaveBeenCalledWith('test', expect.any(Function));
// //         expect(mockFn2).toHaveBeenCalledWith('test', expect.any(Function));
// //         expect(mockFn3).toHaveBeenCalledWith('test', expect.any(Function));
// //     });

// //     it('should handle async functions returning promises', async () => {
// //         mockFn1.mockImplementation(async (arg, next) => {
// //             next(); // Call next to proceed
// //         });
// //         mockFn2.mockImplementation(async (arg, next) => {
// //             return new Promise((resolve) => resolve('result2')); // Return promise
// //         });

// //         const execute = run(1); // Mode 1

// //         const result = await execute(mockFn1, mockFn2)('test');

// //         // Result should be from the last function that resolves its promise
// //         expect(result).toBe('result2');
// //     });
// // });
