const assert = require("assert");
const Middleware = require("../src");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe("Middleware flow test", () => {
	it("Empty middleware", (done) => {
		let m = new Middleware();
		m.process(() => {});
		done();
	});

	it("Basic middleware without context", (done) => {
		new Middleware().use((context, next) => next()).process(() => {});
		done();
	});

	it("Basic middleware with context", (done) => {
		new Middleware()
			.use((context, next) => next())
			.process(() => {}, { a: 100 });
		done();
	});

	it("Basic middleware with context, error and complete function", () => {
		new Middleware()
			.use((context, next) => next())
			.process(
				(err, context) => {
					if (err) console.log(err);
					else assert.deepEqual(context, { a: 100 });
				},
				{ a: 100 }
			);
	});

	it("Middleware should handle next function error", (done) => {
		new Middleware()
			.use((context, next) => next("ERROR!!"))
			.process(
				(err, context) =>
					err ? assert.equal(err, "ERROR!!") : console.log(context),
				{}
			);
		done();
	});

	it("Middleware should handle any error in the function", (done) => {
		new Middleware()
			.use((context, next) => {
				throw "ERROR!!";
			})
			.process((err, context) => {
				if (err) {
					assert.equal(err, "ERROR!!");
					done();
				} else {
					console.log(context);
				}
			}, {});
	});

	it("Middleware should not process next if there are any errors", (done) => {
		new Middleware()
			.use((context, next) => {
				throw "ERROR!!";
			})
			.use((context, next) => {
				console.log("I never get executed");
				next();
			})
			.process(
				(err, context) =>
					err ? assert.equal(err, "ERROR!!") : console.log(context),
				{}
			);
		done();
	});

	it("Middleware should use async await", (done) => {
		new Middleware()
			.use(async (context, next) => {
				await sleep(2000);
				next();
			})
			.use(async (context, next) => {
				await sleep(1000);
				next();
			})
			.process(
				(err, context) => (err ? assert.equal(err, "ERROR!!") : done()),
				{}
			);
	}).timeout(4000);

	it("Middleware should not execute next middleware without next function", (done) => {
		new Middleware()
			.use((context, next) => {
				done();
			})
			.use(async (context, next) => {
				console.log("I never get executed!!");
				next();
			})
			.process((err, context) => (err ? console.log(err) : done()), {});
	});

	it("Use should accept multiple values", (done) => {
		new Middleware()
			.use((a, b, c, next) => {
				assert.equal(a, 1);
				assert.equal(b, 2);
				assert.equal(c, 3);
				next();
			})
			.use(async (a, b, c, next) => {
				assert.equal(a, 1);
				assert.equal(b, 2);
				assert.equal(c, 3);
				next();
			})
			.process(
				(err, context) => (err ? console.log(err) : done()),
				1,
				2,
				3
			);
	});

	it("Middlware can change the context object", (done) => {
		new Middleware()
			.use((context, next) => {
				assert.equal(context.a, 1);
				assert.equal(context.b, 2);
				assert.equal(context.c, 3);
				context.a = 10;
				context.b = 20;
				context.c = 30;
				next();
			})
			.use((context, next) => {
				assert.equal(context.a, 10);
				assert.equal(context.b, 20);
				assert.equal(context.c, 30);
				next();
			})
			.process((err, context) => (err ? console.log(err) : done()), {
				a: 1,
				b: 2,
				c: 3,
			});
	});

	it("Use should accept comma seperated middlwares", (done) => {
		let m1 = (context, next) => next();
		let m2 = (context, next) => next();
		new Middleware()
			.use(m1, m2)
			.process((err, context) => (err ? console.log(err) : done()), null);
	});

	it("Use should accept array of middlwares", (done) => {
		let m1 = (context, next) => next();
		let m2 = (context, next) => next();
		new Middleware()
			.use([m1, m2])
			.process((err, context) => (err ? console.log(err) : done()), null);
	});

	it("Use should mix of comma seperated, array and single middlwares", (done) => {
		let m1 = (context, next) => next();
		let m2 = (context, next) => next();
		new Middleware()
			.use(m1, [m1, m2], [m1], m2)
			.process((err, context) => (err ? console.log(err) : done()), null);
	});
});
