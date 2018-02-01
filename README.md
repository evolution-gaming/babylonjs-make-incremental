# Babylonjs make incremental

## About

This is a tool that generates incremental files from a babylon file.

It is meant to work with [Babylon.js](https://github.com/BabylonJS/Babylon.js). The tool is a port of [make incremental](https://github.com/BabylonJS/Babylon.js/tree/master/Tools/MakeIncremental).

## Build

In order to use the tool, run `npm install && npm run build` in terminal.

## Usage

Import/require the exposed function `makeIncremental` to your script. It accepts two arguments:

* `src` - *string*: The path from the project root to folder where the tool should search for `.babylon` files.
* `options` - *object (optional)*: An object that accepts two optional attributes:
    * `excludedMeshes` - *RegExp[] (optional)*: Regular expressions, that match mesh names that should not be extracted from the babylon file.

Example usage:
```javascript
import makeIncremental from "babylonjs-make-incremental";
// Alternatively
// const makeIncremental = require("babylonjs-make-incremental");

makeIncremental(
    "src/scenes/mainScene",
    {
        excludedMeshes: [/^car-/, /^box-/, /^building/],
    }
);
```