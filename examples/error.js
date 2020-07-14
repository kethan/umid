const Middleware = require("../src");

let m = new Middleware();

// Pass string in next to create an error
m.use((context, next) => {
	next("Try again");
})

	// Throw an error

	.use((context, next) => {
		throw new Error("Try again");
	})

	// Throw error string

	.use((context, next) => {
		throw "Try again";
	})

	// throw error in next function

	.use((context, next) => {
		next(new Error("Try again"));
	})

	.use((context, next) => {
		console.log("I never get executed :(");
	});

(async () => {
	let context = {};
	try {
		let result = await m.process(context);
		console.log(result);
	} catch (error) {
		console.error(error);
	}
})();
