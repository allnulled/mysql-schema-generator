# mysql-schema-generator

Generate projects from `mysql-schema` JSON files. 

## Installation

`$ npm i -g mysql-schema-generator`

## Usage

### CLI

This is an example that uses a configurations file for `mysql-schema` setup, from CLI:

```sh
mysql-schema-generator
  --schema-generation
  --schema-configurations database.configurations.js
  --schema-extensions database.extensions.js
  --schema-output database.schema.js
  --generator-schema database.schema.js
  --generator-directories ./templates
  --generator-output .
```

### API

This is an example that uses programmatic variables for `mysql-schema` setup instead, from API:

```js
require("mysql-schema-generator").generateProject({
	schemaGeneration: true,
	schemaUser: process.env.DB_USER,
	schemaPassword: process.env.DB_PASSWORD,
	schemaHost: process.env.DB_HOST,
	schemaPort: process.env.DB_PORT,
	schemaDatabase: process.env.DB_NAME,
	schemaExtensions: process.env.DB_EXTENSIONS,
	schemaOutput: __dirname + "/db1.schema.js",
	generatorSchema: __dirname + "/db1.schema.js",
	generatorDirectories: [],
	generatorOutput: __dirname + "/db1"
}).then(() => {
	console.log("[*] Project successfully generated!");
}).catch(console.log);
```

## Documentation

This project is about some **parameters** (input) and some **process**, that generate some files that compose a **project** (output).

### The parameters

The parameters started with `schema` are inherited from [`mysql-schema` project](#).

The parameters started with `generator` are from this project.

  - `generatorSchema`: file where the schema is taken from.
  - `generatorDirectories`: paths to directories used as template.
  - `generatorOutput`: path to the directory where we will dump the generated files.

### The process

For each `generatorDirectories` value, `mysql-schema-generator` will look for the next folders:

 - `${generatorDirectory}/callbacks-before`
    - Functional `sync/async` modules called at the begining.
 - `${generatorDirectory}/files-to-override`
    - Files that will be copied, overriding any prexistent file.
 - `${generatorDirectory}/files-to-create`
    - Files that will be copied only if there was no previous file.
 - `${generatorDirectory}/templates-to-override`
    - Templates that will be rendered, overriding any prexistent file.
 - `${generatorDirectory}/templates-to-create`
    - Templates that will be rendered only if there was no previous file.
 - `${generatorDirectory}/callbacks-after`
    - Functional `sync/async` modules called at the end.

This is the exact order in which these files are generated.





## License

This project is under [WTFPL or 'What The Fuck Public License'](https://es.wikipedia.org/wiki/WTFPL), which means 'do whatever you want'.

## Issues 

Please, report issues or suggestions [here](https://github.com/allnulled/mysql-schema-generator/issues/new).

