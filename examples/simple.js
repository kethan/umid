const Middleware = require("../src");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let m = new Middleware();

// Plain middleware
m.use((context, next) => {
	console.log("M1 context", context);
	context.exec = "M1 executed";
	next();
})

	// Async await middleware
	.use(async (context, next) => {
		await sleep(2000);
		console.log("M2 context", context);
		context.exec = "M2 executed in 2 seconds";
		next();
	});

// Async await middleware
let m3 = async (context, next) => {
	await sleep(500);
	await sleep(500);
	console.log("M3 context", context);
	context.exec = "M3 executed in 1 second";
	next();
};

// settimeout middleware
let m4 = (context, next) => {
	setTimeout(() => {
		console.log("M4 context", context);
		context.exec = "M4 executed in 2 second";
		next();
	}, 2000);
};

// Promise middleware
let m5 = async (context, next) => {
	Promise.resolve().then(() => {
		console.log("M5 context", context);
		context.exec = "M5 executed";
		next();
	});
};

// Error middleware
let errorMiddleware = async (context, next) => {
	throw "got error!!";
	next();
};

m.use(m3, [m4, m5]);

// m.use(errorMiddleware)

(async () => {
	let context = {};
	let result = await m.process(context);
	console.log(result);
})();