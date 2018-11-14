# Tsougrana

A utility tool that assists in moving a js project or extract dependency information.

## move [configPath]

Moves files from one directory to another according to a configuration file called 'resolver.config.js'.
During the moving process, all the `import/require` statements are updated
according to the new destination of the required file.

In order to proceed with the move of the files, we have to specify:

* The absolute path to the source files
* The absolute path to the destination files
* A list of mapping rules between the source and the destination.
* ignoreFiles is a regular expression with the source files that will not be move to the destination (optionally)
* The source path alias (optionally)
* The destination path alias (optionally)

|Option|Description|
|---|---|
|`[configPath]`|The path for the configuration file|
|`--fromBase`|Set your local base project path (old|from)|
|`--toBase`|Set your local base project path (new|to)|
|`--verbose [verbose]`|The log detail level light|heavy (default: "light")|
|`--dryrun`|Logs the file moves and the missing dependencies without applying any action|

**example**

```
> npx tsougrana move /Users/user/Documents/tsougrana/resolver.config.js
```

### resolver.config.js

**example**

```
module.exports = {
  rules: [
    {
      from: 'src/**',
      to: 'lib/src'
    },
    {
      from: 'src/myFile.js',
      to: 'foo/bar'
    },
  ],
  ignoreFiles: /regex expression,
  aliasFrom: {
    'shared': 'src/shared'
  },
  aliasTo: {
    'shared': 'lib/helpers',
  }
}
```

## dependencies [pathPattern] --printFormat [printFormat] --ignoreEmpty --onlyExternal

Get information about the dependencies for each file in a specific path (included sub-folders).
You can see all the dependencies for each file, or select only the external dependencies.
Feel free to play with the options.

|Option|Description|
|---|---|
|`[pathPattern]`|The path to the files that will be analyzed. Only absolute paths allowed|
|`--printFormat [printFormat]`| The print format of the result json|raw|onlyDependencies (default: "json")|
|`--ignoreEmpty`| Strip off the files with no dependencies|
|`--onlyExternal`| Add only the external dependencies|

**example**

```
> npx tsougrana dependencies "/Users/user/Documents/tsougrana/**/*.js"
> npx tsougrana dependencies "/Users/user/Documents/tsougrana/**/*.js" --printFormat onlyDependencies --onlyExternal
```
