import terser from '@rollup/plugin-terser';

const resolve = (pkg, input = "src/index", output = "dist/index") => ({
	input: `${input}.js`,
	output: [
		{
			file: `${output}.es.js`,
			format: 'es',
			exports: 'named',
			plugins: [terser()]
		},
		{
			file: `${output}.cjs`,
			format: 'cjs',
			exports: 'named',
			plugins: [terser()]
		},
		{
			file: `${output}.min.js`,
			format: 'iife',
			name: pkg,
			strict: false,
			compact: true,
			plugins: [terser()]
		},
		{
			file: `${output}.umd.js`,
			format: 'umd',
			name: pkg,
			strict: false,
			compact: true,
			plugins: [terser()]
		}
	]
});

const resolveUtils = (input = "src/utils", output = "dist/utils") => ({
	input: `${input}.js`,
	output: [
		{
			file: `${output}.es.js`,
			format: 'es',
			exports: 'named',
			plugins: [terser()]
		},
		{
			file: `${output}.cjs`,
			format: 'cjs',
			exports: 'named',
			plugins: [terser()]
		},
		{
			file: `${output}.min.js`,
			format: 'iife',
			name: 'umidUtils',
			strict: false,
			compact: true,
			plugins: [terser()]
		},
		{
			file: `${output}.umd.js`,
			format: 'umd',
			name: 'umidUtils',
			strict: false,
			compact: true,
			plugins: [terser()]
		}
	]
});

export default [
	resolve("umid"),
	resolveUtils()
];
