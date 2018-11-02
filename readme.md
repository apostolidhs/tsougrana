# Tsougrana

A utility tool that assists in moving a js project or extracting dependency information.

## dependencies [pathPattern] --printFormat [printFormat] --ignoreEmpty --onlyExternal

`[pathPattern]`, the path to the files that will be analized. Only absolute paths allowed.

`--printFormat [printFormat]`, The print format of the result json|raw|onlyDependencies (default: "json")
`--ignoreEmpty`, Strip off the files with no dependencies
`--onlyExternal`, Add only the external dependencies

**example**

```
> npx tsougrana dependencies "/Users/user/Documents/tsougrana/**/*.js"
> npx tsougrana dependencies "/Users/user/Documents/tsougrana/**/*.js" --printFormat onlyDependencies --onlyExternal
```

## move [configPath]

`[configPath]`, the path for the configuration file

**example**

```
> npx tsougrana move /Users/user/Documents/tsougrana/resolver.config.js
```

### resolver.config.js

**example**

```
module.exports = {
  fromBase: '/Users/user/Documents/fromProject/',
  toBase: '/Users/user/Documents/toProject',
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
  aliasFrom: {
    'shared': 'src/shared'
  },
  aliasTo: {
    'shared': 'lib/helpers',
  }
}
```
