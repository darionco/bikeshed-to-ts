# bikeshed-to-ts

Creates a type definition file by parsing a lib specification in bikeshed format.
Includes TypeDoc comments where available.

### Getting started
Add the module to your project:
```shell script
$ yarn add bikeshed-to-ts --dev
```

Run from the command line:
```shell script
$ yarn bikeshed-to-ts --in <bikeshed_file> -- out <typedef_file>
```

Run from a script in your `package.json`:
```json
{
  ...
  "scripts": {
    "peer": "bikeshed-to-ts --in <bikeshed_file> -- out <typedef_file>"
  },
  ...
}
```

Usage and available options can be found at:
```shell script
$ yarn bikeshed-to-ts --help
```

It can be installed globally:
```shell script
$ yarn global add bikeshed-to-ts
```

### Usage

```
  Usage: bikeshed-to-ts --in <file-path> --out <file-path> [flags]

  Options:
    --in, -i		 Path to a bikeshed file to parse.
    --out, -o		 Path to a TypeScript definitions file to write.
    --forceGlobal, -f	 When present, all declarations will be added to the global context
    --nominal, -n	 When present, types declarations will be made nominal when possible
    --version, -v	 Print version and exit
```
