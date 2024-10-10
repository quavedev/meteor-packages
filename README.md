# Meteor Packages by Quave

## Types

We configure our packages to expose types using `zodern:types` package.

According to `zodern:types` documentation, we need to create a `package-types.json` file in the package directory with the following structure:

```json
{
    "typesEntry": "collections.d.ts"
}
```

And then we need to depend on it (api.use).

We also generate the types files (.d.ts) using a script in the package.json that will convert the JSDoc to .d.ts file.

We configure the tsconfig.json to convert the .js files to .d.ts files like this:

```json
{
  "compilerOptions": {
    "allowJs": true,
    "declaration": true,
    "emitDeclarationOnly": true,
    "outDir": "."
  },
  "include": ["collections.js"],
  "exclude": ["node_modules", "**/*.d.ts"]
}
```

To run the script, we need to install typescript in the package:

```sh
nvm use
npm i -D typescript
```

And then we can run the script:

```sh
nvm use
npm run generate-dts
```

> We set .nvmrc to 20 to make sure we are at the same major version as Meteor.

This will generate the `collections.d.ts` file in the package directory.

See [collections package](https://github.com/quavedev/meteor-packages/tree/main/collections) as an example.
