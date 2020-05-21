const shell = require("shelljs");
const fs = require("fs");
const extractZip = require("extract-zip")

const writePackageJson = function (dependencyNodeDirectory, dependencyName) {
    console.log(`generate package.json for ${dependencyNodeDirectory}`)
    let files = fs.readdirSync(dependencyNodeDirectory);
    let main = files.filter((f) => f.endsWith(".js") && !f.endsWith("meta.js"));
    if (main.length == 0) {
        console.error(`Error : no usable js file for ${dependencyName}`);
        process.exit(1)
    }
    fs.writeFileSync(dependencyNodeDirectory + "/package.json", JSON.stringify({
        name: dependencyName,
        "main": main[0]
    }));
    return files;
};

const runInstall = function (dependencyNodeDirectory) {
    console.log("runInstall");
    let cmd = `npm install --prefix ${dependencyNodeDirectory}`;
    let exec = shell.exec(cmd)

    if (exec.code !== 0) {
        console.error(exec.stdout);
        process.exit(1)
    }
    console.log("runInstall end");
};

async function installJar(dependencyNodeDirectory, jarFile, dependencyName) {
    try {
        await extractZip(dependencyNodeDirectory +"/"+ jarFile, {dir: dependencyNodeDirectory})
        console.log(`unzipped ${dependencyName}`);
        if (!fs.existsSync(dependencyNodeDirectory + "/package.json")) {
            writePackageJson(dependencyNodeDirectory, dependencyName);
        }
        runInstall(dependencyNodeDirectory)

    } catch (err) {
        console.error("error in extractZip of " + dependencyNodeDirectory + " " + jarFile);
        console.error(err);
        process.exit()
    }
}


module.exports = {writePackageJson, runInstall, installJar}