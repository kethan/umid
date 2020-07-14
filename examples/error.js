const Middleware = require("../src");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
	})

	.process((err, context) => {
		if (err) console.log(err, context);
		else console.log("Complete!", context);
	}, {});
