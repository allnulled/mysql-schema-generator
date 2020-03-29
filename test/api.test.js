const MySQLSchemaGenerator = require(__dirname + "/../src/index.js");
const { expect } = require("chai");
const fs = require("fs");
const exec = require("execute-command-sync");

describe("mysql-schema-generator", function() {

	before(function(done) {
		require("rimraf").sync(__dirname + "/test/db1");
		require("rimraf").sync(__dirname + "/test/db2");
		done();
	});

	it("generates projects by API", function(done) {

		MySQLSchemaGenerator.generateProject({
			schema: {
				user: process.env.DB_USER || "test",
				password: process.env.DB_PASSWORD || "test",
				database: process.env.DB_NAME || "database2",
				host: process.env.DB_HOST || "127.0.0.1",
				port: process.env.DB_PORT || 3306,
				extensions: process.env.DB_EXTENSIONS,
				output: __dirname + "/test/db1.schema.js",
			},
			generator: {
				schema: [__dirname + "/test/db1.schema.js"],
				directories: [
					__dirname + "/templates/group1",
					__dirname + "/templates/group2",
					__dirname + "/templates/group3",
				],
				output: __dirname + "/test/db1"
			}
		}).then(() => {
			expect(fs.existsSync(__dirname + "/test/db1.schema.js")).to.equal(true);
			expect(fs.existsSync(__dirname + "/test/db1/hi.txt")).to.equal(true);
			expect(fs.existsSync(__dirname + "/test/db1/bye.txt")).to.equal(true);
			expect(fs.existsSync(__dirname + "/test/db1/readme.md")).to.equal(true);
			expect(fs.existsSync(__dirname + "/test/db1/comment.md")).to.equal(true);
			expect(fs.existsSync(__dirname + "/test/db1/comment-2.md")).to.equal(true);
			done();
		}).catch(console.log);

	});

	it("generates projects by CLI", function(done) {

		const parameters = [
			"--schema-user test",
			"--schema-password test",
			"--schema-database database2",
			"--schema-host 127.0.0.1",
			"--schema-port 3306",
			"--schema-output test/test/db2.schema.js",
			"--schema-debug", 
			"--generator-schema test/test/db2.schema.js test/test/db1.schema.js",
			"--generator-directories test/templates/group2 test/templates/group1",
			"--generator-output test/test/db2",
		];
		const command="./bin/mysql-schema-generator " + parameters.join(" ");
		//console.log(command);
		exec(command, {
			cwd: __dirname + "/.."
		})
		expect(fs.existsSync(__dirname + "/test/db2.schema.js")).to.equal(true);
		expect(fs.existsSync(__dirname + "/test/db2/hi.txt")).to.equal(true);
		expect(fs.existsSync(__dirname + "/test/db2/bye.txt")).to.equal(true);
		expect(fs.existsSync(__dirname + "/test/db2/readme.md")).to.equal(true);
		expect(fs.existsSync(__dirname + "/test/db2/comment.md")).to.equal(true);
		expect(fs.existsSync(__dirname + "/test/db2/comment-2.md")).to.equal(true);
		expect(fs.existsSync(__dirname + "/test/db2/sample.md")).to.equal(true);
		done();

	});

});