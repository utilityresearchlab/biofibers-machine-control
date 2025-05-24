const fs = require('fs-extra');
const path = require('path');
const spawn = require('child_process').spawn;
const process = require('process');
const buildID = new Date().toISOString().replace(/T.*/,'').split('-').join('-');

// https://www.electronforge.io/config/hooks
module.exports = {
    prePack: async (config, makeResults) => {
        console.info(makeResults);
    },
    postPackage: async (forgeConfig, options) => {
        console.info('Packages built at:', options.outputPaths);
        console.info(options);
        const packageDir = options.outputPaths[0]; // The output directory
        const files = fs.readdirSync(packageDir);
        // YYYY-MM-DD format
        const dateSuffix = buildID; // new Date().toISOString().split('T')[0]

        for (const file of files) {
            const oldPath = path.join(packageDir, file);
            const ext = path.extname(file);
            if (ext.includes("app") || ext.includes("exe") || ext.includes("zip")) {
                const baseName = path.basename(file, ext);
                const newFileName = `${baseName}-${dateSuffix}${ext}`;
                const newPath = path.join(packageDir, newFileName);
                fs.renameSync(oldPath, newPath);
                // console.info(`** Renamed ${file} to ${newFileName}`);
                console.info(`** Renamed app ${file} to ${newFileName}`);
            }
        }
        console.info(`** Packaged app at directory: ${packageDir}`)
    },

    readPackageJson: async (forgeConfig, packageJson) => {
        // only copy deps if there isn't any
        if (Object.keys(packageJson.dependencies).length === 0) {
            const originalPackageJson = await fs.readJson(path.resolve("./", 'package.json'));
            const webpackConfigJs = require('./webpack.renderer.config.js');
            Object.keys(webpackConfigJs.externals).forEach(package => {
            packageJson.dependencies[package] = originalPackageJson.dependencies[package];
        });
    }
    return packageJson;
    },
    packageAfterPrune: async (forgeConfig, buildPath) => {
        console.log(buildPath);
        return new Promise((resolve, reject) => {
            // See both answers for https://stackoverflow.com/questions/71930401/webpack-not-including-module-with-electron-forge-and-serialport
            const npmInstall = spawn('npm', ['install', '--omit=dev'], {
            cwd: buildPath,
            stdio: 'inherit',
            shell: true
            });

            npmInstall.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error('process finished with error code ' + code));
            }
            });

            npmInstall.on('error', (error) => {
                reject(error);
            });
    });
    }
};