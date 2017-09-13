// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

"use strict";
var childProcess = require('child_process');
var os = require("os");
var path = require("path");

exports.build = function (buildType) {
    var napaRoot = path.join(__dirname, "..");
    var nodeVersion = "v6.10.3"; // Stable node version that can build as a dll.
    var nodeCloneRoot = path.join(napaRoot, "build/node-" + nodeVersion);
    
    console.log("\x1b[1m\x1b[32m", `Building napa in embed mode (${buildType}) based on Node.JS ${nodeVersion}`,'\x1b[0m');

    // Refer to https://github.com/nodejs/node/blob/master/BUILDING.md#windows-1 for prerequisites.
    childProcess.execSync(`git clone --branch ${nodeVersion} https://github.com/nodejs/node.git ${nodeCloneRoot}.`, {
        stdio: 'inherit'
    });

    if (os.platform() === "win32") {
        console.log("\x1b[1m\x1b[32m", "Building Node.JS as dll.",'\x1b[0m');

        // Build node shared library to extract intermediate v8 static libraries to build napa.dll.
        childProcess.execSync(`vcbuild.bat x64 ${buildType} nosign dll`, {
            cwd: nodeCloneRoot,
            stdio: 'inherit'
        });
    }
    // TODO (asib): support other platforms

    // Create platform specific build files using cmake.
    console.log("\x1b[1m\x1b[32m", "Running cmake to generate build files.",'\x1b[0m');
    childProcess.execSync(`cmake -A x64 -DNODE_ROOT=${nodeCloneRoot} -DCMAKE_BUILD_TYPE=${buildType} ..`, {
        cwd: path.join(napaRoot, "build"),
        stdio: 'inherit'
    });

    // Build.
    console.log("\x1b[1m\x1b[32m", "Building napa.",'\x1b[0m');
    childProcess.execSync(`cmake --build . --config ${buildType}`, {
        cwd: path.join(napaRoot, "build"),
        stdio: 'inherit'
    });

    // Install napa dependencies and compile typescript files..
    console.log("\x1b[1m\x1b[32m", "Running npm install to compile typescript files.",'\x1b[0m');
    childProcess.execSync("npm install --no-fetch --no-build", {
        cwd: napaRoot,
        stdio: 'inherit'
    });
}
