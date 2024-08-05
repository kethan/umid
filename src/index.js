export const run =
	(mode = 0) =>
		(...fns) =>
			async (...params) =>
				new Promise((resolve, reject) => {
					fns = fns.flat(1 / 10).filter(fn => fn?.call);
					let i = 0;
					let loop = async () => {
						if (i >= fns.length) return resolve();
						let fn = fns[i++];
						let argsCount = fn.length <= params.length;
						let result = mode === 1 ? await fn(...params, next) : await fn(...params, !argsCount && next);
						if (mode !== 1 && result) return resolve(result);
						if (mode !== 1 && argsCount) await next();
					};
					let next = (err) => err ? reject(err) : loop().catch(next);
					next();
				});