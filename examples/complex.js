const Middleware = require("../src");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let m = new Middleware();

m.use((a, b, next) => {
	console.log("m1", a, b);
	a.a = 89;
	next();
})
	.use(async (a, b, next) => {
		await sleep(2000);
		console.log("m2", a, b);
		next();
	})
	.use((a, b, next) => {
		setTimeout(() => {
			a.a = 10;
			console.log("m3", a, b);
			next();
		}, 1000);
	});

m.use([
	(a, b, next) => {
		console.log("m4");
		next();
	},
	(a, b, next) => {
		console.log("m5");
		next();
	},
]);
m.use(
	(a, b, next) => {
		console.log("m6");
		next();
	},
	(a, b, next) => {
		console.log("m7");
		next();
	}
);
m.use(
	[
		(a, b, next) => {
			a.a = 10;
			console.log("m8", a, b);
			next();
		},
		(a, b, next) => {
			a.a = 10;
			console.log("m9", a, b);
			next();
		},
	],
	[
		(a, b, next) => {
			a.a = 10;
			console.log("m10", a, b);
			next();
		},
		(a, b, next) => {
			a.a = 10;
			console.log("m10", a, b);
			next();
		},
	]
);

m.use(
	(a, b, next) => {
		a.a = 10;
		console.log("m12", a, b);
		next();
	},
	[
		(a, b, next) => {
			a.a = 10;
			console.log("m13", a, b);
			next();
		},
		(a, b, next) => {
			a.a = 10;
			console.log("m14", a, b);
			next("eRR!");
		},
	],
	(a, b, next) => {
		console.log("m15");
		next();
	}
);

m.process(
	(e, req, res) => {
		if (e) console.log("Error found!!", e, req, res);
		else console.log("Complete");
	},
	{ a: 1 },
	{ b: 2 }
);
