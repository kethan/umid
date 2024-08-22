export const run = (mode = 0, next, i = 0, fn, result) => (...fns) => async (...args) => {
	fns = fns.flat().filter(fn => fn.call);
	 next = async err => {
		if (err) throw err;
		if (i < fns.length) {
			fn = fns[i++];
			result = await fn(...args, !fn.length <= args.length && next);
			if (mode !== 1 && result) return result;
			if (mode !== 1 && fn.length <= args.length) return await next();
		}
	}
	return next();
};
