#! /usr/bin/env node

const path = require('path');
const {makeIncremental} = require("./index");

const argv = require('minimist')(process.argv.slice(2));

if (!argv.src) {
  throw new Error('you must provide a --src flag');
}

const src = argv.src[0] === path.sep
  ? argv.src // absolute path
  : path.join(process.cwd(), argv.src); // relative path

const options = {};

if (argv.excludedMeshes) {
  options.excludedMeshes = argv.excludedMeshes.split(',').map((str) => {
    return new RegExp(str.trim());
  });
}

console.log('Making BabylonJS export incremental:')
console.log('  src:', src);
console.log('  options:', options);

makeIncremental(src, options);
