let conf = require(process.cwd() + "/package.json")
let fs = require("fs")
let extractZip = require("extract-zip")
var shell = require("shelljs");


let writePackageJson = function (dependencyNodeDirectory, dependencyName) {
    let files = fs.readdirSync(dependencyNodeDirectory);
    let main = files.filter((f) => f.endsWith(".js") && !f.endsWith("meta.js"))
    if (main.length == 0) {
        console.error(`Error : no usable js file for ${dependencyName}`)
        process.exit()
    }
    fs.writeFileSync(dependencyNodeDirectory + "package.json", JSON.stringify({name: dependencyName, "main": main[0]}))
    return files;
};

let runInstall = function (dependencyNodeDirectory) {
    console.log("runInstall");
    let cmd = `npm install --prefix ${dependencyNodeDirectory}`;
    let exec = shell.exec(cmd)

    if (exec.code !== 0) {
        console.error(exec);
        process.exit()
    }
    console.log("runInstall end");

    console.log("runInstall end");

};
let run = function () {

    try {
        if (!fs.existsSync(`${process.cwd()}/node_modules/`)) {
            fs.mkdirSync(`${process.cwd()}/node_modules/`);
        }
        if (conf.mavenDependencies != null) {

            console.log("manage mavenDependencies")
            Object.keys(conf.mavenDependencies).map(async function (dependencyName, index) {
                console.log(`loading ${dependencyName}`)
                var artifact = conf.mavenDependencies[dependencyName];
                let dependencyNodeDirectory = `${process.cwd()}/node_modules/${dependencyName}/`;

                if (!fs.existsSync(dependencyNodeDirectory)) {
                    fs.mkdirSync(dependencyNodeDirectory);
                }
                let cmd = `mvn org.apache.maven.plugins:maven-dependency-plugin:3.1.1:copy -Dartifact=${artifact} -DoutputDirectory=${process.cwd()}/node_modules/${dependencyName}`

                let exec = shell.exec(cmd);
                if (exec.code !== 0) {
                    console.error("error in maven load of " + dependencyName);
                    console.error(exec);
                    process.exit()
                } else {

                    console.log(`unzipping ${dependencyName}`)
                    console.log(fs.readdirSync(dependencyNodeDirectory))
                    let jarFile = fs.readdirSync(dependencyNodeDirectory).filter((s)=>s.endsWith(".jar"))[0]
                    extractZip(dependencyNodeDirectory + jarFile, {dir: dependencyNodeDirectory}, (err) => {
                        if (err) {
                            console.error("error in extractZip of " + dependencyNodeDirectory+" "+jarFile);
                            console.error(err);
                            process.exit()
                        } else {
                            console.log(`unzipped ${dependencyName}`)
                            if (!fs.existsSync(dependencyNodeDirectory + "package.json")) {
                                writePackageJson(dependencyNodeDirectory, dependencyName);
                                runInstall(dependencyNodeDirectory)
                            }
                        }
                    })
                }
                // command output is in stdout

            });
        }


        if (conf.jarDependencies != null) {
            console.log("manage jarDependencies")
            Object.keys(conf.jarDependencies).map(async function (dependencyName, index) {
                let dependencyJarPath = conf.jarDependencies[dependencyName];
                console.log(`loading ${dependencyName} : ${dependencyJarPath}`)
                let dependencyNodeDirectory = `${process.cwd()}/node_modules/${dependencyName}/`
                if (!fs.existsSync(dependencyNodeDirectory)) {
                    console.debug(`making dir ${dependencyNodeDirectory}`)
                    fs.mkdirSync(dependencyNodeDirectory);
                    console.debug(`maked ${dependencyNodeDirectory}`)
                }

                console.debug("coping " + dependencyJarPath + " to " + dependencyNodeDirectory+" "+dependencyName)
                fs.copyFileSync(`${process.cwd()}/${dependencyJarPath}`, `${dependencyNodeDirectory}/${dependencyName}.jar`)
                console.debug("copied");

                extractZip(`${dependencyNodeDirectory}/${dependencyName}.jar`, {dir: dependencyNodeDirectory}, function (err) {
                    if (err) {
                        console.log("error in unzip of " + dependencyName)
                        console.error(err);
                        process.exit()
                    } else {
                        console.log(dependencyNodeDirectory + "package.json")
                        if (!fs.existsSync(dependencyNodeDirectory + "package.json")) {
                            console.log("generating package.json")
                            writePackageJson(dependencyNodeDirectory, dependencyName);
                            runInstall(dependencyNodeDirectory)
                        }
                    }
                })

                // command output is in stdout

            });
        }
    } catch (e) {
        console.error(e)
    }
    console.log("end of the jar/maven dependency install.");
};
run();


module.exports = {run};
