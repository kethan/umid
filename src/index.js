export const run =
	(mode = 0, next, loop, i = 0, result) =>
		(...fns) =>
			(...args) =>
				new Promise((resolve, reject) => {
					fns = fns.flat(1 / 0).filter(fn => fn?.call);
					loop = async () => {
						if (i >= fns.length) return resolve();
						result = mode ? await fns[i++](...args, next) : await fns[i++](...args);
						if (!mode && result) return resolve(result);
						if (!mode) await next();
					};
					(next = (err) => err ? reject(err) : loop().catch(next))()
				});