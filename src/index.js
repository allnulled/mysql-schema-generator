const path = require("path");
const fs = require("fs-extra");
const ejs = require("ejs");
const glob = require("glob");
const Debug = require("debug");
const debug = Debug("mysql-schema-generator");
const MySQLSchema = require("mysql-schema");

class MySQLSchemaGenerator {

	static get DEFAULT_OPTIONS() {
		return {
			schema: {},
			generator: {}
		};
	}

	static get DEFAULT_SCHEMA_OPTIONS() {
		return {};
	}

	static get DEFAULT_GENERATOR_OPTIONS() {
		return {};
	}

	static generateProject(mixedOptions = {}) {
		return new Promise((ok, fail) => {
			const options = Object.assign({}, this.DEFAULT_OPTIONS, mixedOptions);
			Object.assign(options.schema, this.DEFAULT_SCHEMA_OPTIONS, options.schema);
			Object.assign(options.generator, this.DEFAULT_GENERATOR_OPTIONS, options.generator);
			if(options.schema.debug || options.generator.debug) {
				Debug.enable("mysql-schema-generator");
			}
			if(options.schema.generation) {
				debug("⛁ Generating schema. Please, wait...");
				MySQLSchema.getSchema(options.schema).then(() => {
					debug("✔ Successfully generated schema!");
					debug("⛁ Generating project. Please, wait...");
					this.$generateProject(options.generator, mixedOptions).then(() => {
						debug("✔ Successfully generated project!");
						ok();
						return;
					}).catch(fail);
				}).catch(fail);
			} else {
				debug("⛁ Not generating any schema.");
				debug("⛁ Generating project. Please, wait...");
				this.$generateProject(options.generator, mixedOptions).then(() => {
					debug("✔ Successfully generated project!");
					ok();
					return;
				}).catch(fail);
			}
		});
	}

	static $createParameters(options = {}) {
		const parameters = {
			ejs: ejs,
			require: require,
			process: process,
			createParameters: this.$createParameters.bind(this),
			...options
		};
		parameters.parameters = { ...parameters,
			parameters: undefined
		};
		return parameters;
	}

	static $generateProject(generatorOptions = {}, mixedOptions = {}) {
		return new Promise((ok, fail) => {
			const {
				schema,
				directories,
				output
			} = generatorOptions;
			const allSchemas = schema;
			const schemaData = {};
			allSchemas.forEach(oneSchema => {
				const importedSchema = path.resolve(oneSchema);
				const namespaceSchema = path.basename(oneSchema);
				debug("  ⛁ Importing schema from " + importedSchema)
				schemaData[namespaceSchema] = require(importedSchema);
				debug("  ✔ Successfully imported <" + namespaceSchema + "> schema");
			});
			const parameters = this.$createParameters({
				input: {
					schema: mixedOptions.schema,
					generator: mixedOptions.generator,
				},
				data: schemaData,
			});
			let directoriesIndex = 0;
			const next = async () => {
				try {
					for (const directory of directories) {
						await this.$generateDirectory(directory, parameters);
					}
					return ok();
				} catch (error) {
					return fail(error);
				}
			};
			next();
		});
	}

	static async $generateDirectory(directory, parameters) {
		try {
			debug("⛁ Starting directory @ " + directory);
			await new Promise((ok, fail) => {
				fs.ensureDir(parameters.input.generator.output, error => {
					if(error) {
						return fail(error);
					}
					return ok();
				});
			});
			debug("⛁ Generating files in directory");
			const commonCallback = (ok, fail, title) => {
				return (error, files) => {
					if (error) {
						return fail(error);
					}
					debug("   ✔ " + files.length + " " + title);
					ok(files);
				}
			};
			const commonPromise = (directoryPath) => new Promise((ok, fail) => {
				const pattern = path.resolve(directory, directoryPath + "/**");
				debug("  ◎ Looking for pattern: " + pattern);
				glob(pattern, {
					nodir: true
				}, commonCallback(ok, fail, directoryPath.replace(/\-/g, " ")));
			});
			const files = await Promise.all([
				commonPromise("callbacks-before", parameters),
				commonPromise("files-to-create", parameters),
				commonPromise("files-to-override", parameters),
				commonPromise("templates-to-create", parameters),
				commonPromise("templates-to-override", parameters),
				commonPromise("callbacks-after", parameters),
			]);
			const [callbacksBefore, filesToCreate, filesToOverride, templatesToCreate, templatesToOverride, callbacksAfter] = files;
			debug("  ⛁ Implementing callbacks before...");
			for (let index = 0; index < callbacksBefore.length; index++) {
				const item = callbacksBefore[index];
				const itemPath = item.replace(path.resolve(directory), "").replace("callbacks-before", "").replace(/^\/+/g, "");
				debug("   ✔ " + itemPath);
				await this.$generateFromCallbackFile(item, index, "callbacks-before", files, parameters, directory, itemPath);
			}
			debug("  ⛁ Implementing files to override...");
			for (let index = 0; index < filesToOverride.length; index++) {
				const item = filesToOverride[index];
				const itemPath = item.replace(path.resolve(directory), "").replace("files-to-override", "").replace(/^\/+/g, "");
				debug("   ✔ " + itemPath);
				await this.$generateFromOverrideFile(item, index, "files-to-override", files, parameters, directory, itemPath);
			}
			debug("  ⛁ Implementing files to create...");
			for (let index = 0; index < filesToCreate.length; index++) {
				const item = filesToCreate[index];
				const itemPath = item.replace(path.resolve(directory), "").replace("files-to-create", "").replace(/^\/+/g, "");
				debug("   ✔ " + itemPath);
				await this.$generateFromCreateFile(item, index, "files-to-create", files, parameters, directory, itemPath);
			}
			debug("  ⛁ Implementing templates to override...");
			for (let index = 0; index < templatesToOverride.length; index++) {
				const item = templatesToOverride[index];
				const itemPath = item.replace(path.resolve(directory), "").replace("templates-to-override", "").replace(/^\/+/g, "");
				debug("   ✔ " + itemPath);
				await this.$generateFromOverrideTemplate(item, index, "templates-to-override", files, parameters, directory, itemPath);
			}
			debug("  ⛁ Implementing templates to create...");
			for (let index = 0; index < templatesToCreate.length; index++) {
				const item = templatesToCreate[index];
				const itemPath = item.replace(path.resolve(directory), "").replace("templates-to-create", "").replace(/^\/+/g, "");
				debug("   ✔ " + itemPath);
				await this.$generateFromCreateTemplate(item, index, "templates-to-create", files, parameters, directory, itemPath);
			}
			debug("  ⛁ Implementing callbacks after...");
			for (let index = 0; index < callbacksAfter.length; index++) {
				const item = callbacksAfter[index];
				const itemPath = item.replace(path.resolve(directory), "").replace("callbacks-before", "").replace(/^\/+/g, "");
				debug("   ✔ " + itemPath);
				await this.$generateFromCallbackFile(item, index, "callbacks-before", files, parameters, directory, itemPath);
			}
		} catch (error) {
			debug("[Error]:", error);
			throw error;
		}
	}

	static async $generateFromCallbackFile(item, index, typeOfGeneration, matchedGroup, parameters, directory, itemPath) {
		try {
			const mod = require(item);
			if(mod instanceof Promise) {
				await mod;
			} else if(typeof mod === "function") {
				const result = mod({ ...parameters, item, index, typeOfGeneration, matchedGroup, directory });
				if(result instanceof Promise) {
					await result;
				}
			}
		} catch (error) {
			debug("[Error]:", error);
			throw error;
		}
	}

	static $generateFromCreateFile(item, index, typeOfGeneration, matchedGroup, parameters, directory, itemPath) {
		const dest = path.resolve(parameters.input.generator.output, itemPath);
		if (!fs.existsSync(dest)) {
			fs.ensureFileSync(dest);
			fs.copySync(item, dest);
		}
	}

	static $generateFromOverrideFile(item, index, typeOfGeneration, matchedGroup, parameters, directory, itemPath) {
		const dest = path.resolve(parameters.input.generator.output, itemPath);
		fs.ensureFileSync(dest);
		fs.copySync(item, dest);
	}

	static $generateFromCreateTemplate(item, index, typeOfGeneration, matchedGroup, parameters, directory, itemPath) {
		const dest = path.resolve(parameters.input.generator.output, itemPath);
		if (!fs.existsSync(dest)) {
			const srcContents = fs.readFileSync(item).toString();
			const templateParameters = this.$createParameters({
				sourceFile: item,
				destinationFile: dest,
				directory,
				...parameters,
			});
			const destContents = ejs.render(srcContents, templateParameters);
			fs.ensureFileSync(dest);
			fs.writeFileSync(dest, destContents, "utf8");
		}
	}

	static $generateFromOverrideTemplate(item, index, typeOfGeneration, matchedGroup, parameters, directory, itemPath) {
		const dest = path.resolve(parameters.input.generator.output, itemPath);
		const srcContents = fs.readFileSync(item).toString();
		const templateParameters = this.$createParameters({
			sourceFile: item,
			destinationFile: dest,
			directory,
			...parameters,
		});
		const destContents = ejs.render(srcContents, templateParameters);
		fs.ensureFileSync(dest);
		fs.writeFileSync(dest, destContents, "utf8");
	}


}

module.exports = MySQLSchemaGenerator;