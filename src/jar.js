const conf = require(process.cwd() + "/package.json");
const extractZip = require("extract-zip");
const fs = require("fs");
const installJar = require('./install').installJar;
const request = require('request');
const writePackageJson = require('./install').writePackageJson;

async function manageJarDependency(dependencyName) {
    let dependencyJarPath = conf.jarDependencies[dependencyName];
    console.log(`loading ${dependencyName} : ${dependencyJarPath}`);
    let dependencyNodeDirectory = `${process.cwd()}/node_modules/${dependencyName}`;
    if (!fs.existsSync(dependencyNodeDirectory)) {
        console.debug(`making dir ${dependencyNodeDirectory}`);
        fs.mkdirSync(dependencyNodeDirectory);
    }

    console.debug(`coping ${dependencyJarPath} to ${dependencyNodeDirectory} ${dependencyName}`)
    if (dependencyJarPath.startsWith("http")) {
        request(dependencyJarPath)
            .pipe(fs.createWriteStream(`${dependencyNodeDirectory}/${dependencyName}.jar`))
            .on('close', async function () {
                console.debug("copied");
                installJar(dependencyNodeDirectory, `${dependencyName}.jar`, dependencyName)

            });
    } else {
        fs.copyFileSync(`${dependencyJarPath}`, `${dependencyNodeDirectory}/${dependencyName}.jar`)
        console.debug("copied");

        installJar(dependencyNodeDirectory, `${dependencyName}.jar`, dependencyName)
    }


    // command output is in stdout
}

module.exports = {manageJarDependency};
