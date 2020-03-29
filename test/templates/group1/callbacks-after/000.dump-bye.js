module.exports = parameters => {
	return new Promise((ok, fail) => {
		const outputPath = require("path").resolve(parameters.input.generator.output, "bye.txt");
		console.log("Bye dumped at", outputPath);
		require("fs").writeFile(outputPath, "Bye!", "utf-8", function(error) {
			if(error) {
				return fail(error);
			}
			return ok();
		});
	});
};