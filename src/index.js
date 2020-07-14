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

	run(onerror, ...params) {
		try {
			let middleware = this._fns.shift();
			middleware
				? middleware(...params, (err) =>
						err
							? onerror(err, ...params)
							: this.run(onerror, ...params)
				  )
				: onerror(null, ...params);
		} catch (err) {
			onerror(err, ...params);
		}
	}

	process(...params) {
		return new Promise((resolve, reject) => {
			this.run((err, context) => {
				if (err) reject(err);
				else resolve(context);
			}, ...params);
		});
	}
};
