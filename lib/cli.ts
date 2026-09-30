#! /usr/bin/env node

import { join, sep } from "path";
import minimist from "minimist";
import { makeIncremental, OptionProps } from "./index";

const argv = minimist(process.argv.slice(2));

if (!argv.src) {
    throw new Error("you must provide a --src flag");
}

const src = argv.src[0] === sep
    ? argv.src // absolute path
    : join(process.cwd(), argv.src); // relative path

const options: OptionProps = {};

if (argv.excludedMeshes) {
    options.excludedMeshes = argv.excludedMeshes.split(",").map((str: string) => {
        return new RegExp(str.trim());
    });
}

console.log("Making BabylonJS export incremental:");
console.log("  src:", src);
console.log("  options:", options);

makeIncremental(src, options);
