module.exports = parameters => {
	return new Promise((ok, fail) => {
		const outputPath = require("path").resolve(parameters.input.generator.output, "hi.txt");
		console.log("Hi dumped at", outputPath);
		require("fs").writeFile(outputPath, "Hi!", "utf-8", function(error) {
			if(error) {
				return fail(error);
			}
			return ok();
		});
	});
};