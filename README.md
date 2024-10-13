# Meteor Packages by Quave

## Types

We configure our packages to expose types using `zodern:types` package.

According to `zodern:types` documentation, we need to create a `package-types.json` file in the package directory with the following structure:

```json
{
    "typesEntry": "collections.js"
}
```

Also add a `tsconfig.json` file like this:

```json
{
  "compilerOptions": {
    "allowJs": true,
    "declaration": true,
    "emitDeclarationOnly": true,
    "outDir": "."
  },
  "include": ["collections.js"],
  "exclude": ["node_modules", "**/*.d.ts"],
}
```

And then we need to depend on it (api.use).

See [collections package](https://github.com/quavedev/meteor-packages/tree/main/collections) as an example.
