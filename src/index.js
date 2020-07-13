module.exports = class Middleware {
	constructor() {
		this._fns = [];
	}

	use(...fns) {
		fns.map((f) =>
			Array.isArray(f) ? this._fns.push(...f) : this._fns.push(f)
		);
		return this;
	}

	process(onerror, ...params) {
		try {
			let middleware = this._fns.shift();
			return middleware
				? middleware(...params, (err) =>
						err
							? onerror(err, ...params)
							: this.process(onerror, ...params)
				  )
				: onerror(null, ...params);
		} catch (err) {
			onerror(err, ...params);
		}
	}
};
