const Middleware = require("../src");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let m = new Middleware();

m.use((context, next) => {
	console.log("M1 context", context);
	context.exec = "M1 executed";
	next();
}).use(async (context, next) => {
	await sleep(2000);
	console.log("M2 context", context);
	context.exec = "M2 executed in 2 seconds";
	next();
});

let m3 = async (context, next) => {
	await sleep(1000);
	console.log("M3 context", context);
	context.exec = "M3 executed in 1 second";
	next();
};

let m4 = (context, next) => {
	setTimeout(() => {
		console.log("M4 context", context);
		context.exec = "M4 executed in 2 second";
		next();
	}, 2000);
};

let m5 = async (context, next) => {
	Promise.resolve().then(() => {
		console.log("M5 context", context);
		context.exec = "M5 executed";
		next();
	});
};

let errorMiddleware = async (context, next) => {
	throw "got error!!";
	next();
};

m.use(m3, [m4, m5]);

// m.use(errorMiddleware)

let context = {};

m.process((err, context) => {
	if (err) console.log("error!", err, context);
	else console.log("Complete!", context);
}, context);
