export const run = (mode = 2, next, i = 0, fn, result) => (...fns) => async (...args) => {
	fns = fns.flat(1 / 0).filter(fn => fn.call);
	return (next = async err => {
		if (err) throw err;
		if (i < fns.length) {
			fn = fns[i++];
			result = await fn(...args, !fn.length <= args.length && next);
			if (mode !== 1 && result) return result;
			if (mode !== 1 && fn.length <= args.length) return await next();
		}
	})()
};
