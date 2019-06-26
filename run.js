let conf = require(process.cwd() + "/package.json")
let fs = require("fs")
let extractZip = require("extract-zip")

var exec = require('child_process').exec;


let writePackageJson = function (dependencyNodeDirectory, dependencyName) {
    let files = fs.readdirSync(dependencyNodeDirectory);
    let main = files.filter((f) => f.endsWith(".js") && !f.endsWith("meta.js"))
    if (main.length == 0) {
        console.error( `Error : no usable js file for ${dependencyName}`)
        process.exit()
    }
    fs.writeFileSync(dependencyNodeDirectory + "package.json", JSON.stringify({name: dependencyName, "main": main[0]}))
    return files;
};
if (conf.mavenDependencies != null) {

    console.log("manage mavenDependencies")
    Object.keys(conf.mavenDependencies).map(async function (dependencyName, index) {
        console.log(`loading ${dependencyName}`)
        var artifact = conf.mavenDependencies[dependencyName];
        let cmd = `mvn org.apache.maven.plugins:maven-dependency-plugin:3.1.1:copy -Dartifact=${artifact} -DoutputDirectory=${process.cwd()}/node_modules/${dependencyName}`

        exec(cmd, function (error, stdout, stderr) {
            if (stderr) {
                console.error(stderr);
                process.exit()
            } else {
                let dependencyNodeDirectory = `${process.cwd()}/node_modules/${dependencyName}/`;
                let jarFile = fs.readdirSync(dependencyNodeDirectory)[0]
                extractZip(dependencyNodeDirectory + jarFile, {dir: dependencyNodeDirectory}, (err) => {
                    if (err) {
                        console.error(err);
                        process.exit()
                    } else {
                        console.log(`unzipped ${dependencyName}`)
                        if (!fs.existsSync(dependencyNodeDirectory + "package.json")) {
                            writePackageJson(dependencyNodeDirectory, dependencyName);
                        }
                    }
                })
            }
            // command output is in stdout
        })
    });
}


if (conf.jarDependencies != null) {
    console.log("manage jarDependencies")
    Object.keys(conf.jarDependencies).map(async function (dependencyName, index) {
        var dependencyJarPath = conf.jarDependencies[dependencyName];
        console.log(`loading ${dependencyName} : ${dependencyJarPath}`)
        var dependencyNodeDirectory = `${process.cwd()}/node_modules/${dependencyName}`
        if (!fs.existsSync(dependencyNodeDirectory)) {
            fs.mkdirSync(dependencyNodeDirectory);
        }
        fs.copyFileSync(`${process.cwd()}/${dependencyJarPath}`, `${dependencyNodeDirectory}/${dependencyName}.jar`)


        extractZip(`${dependencyNodeDirectory}/${dependencyName}.jar`, {dir: dependencyNodeDirectory}, function (err) {
            if (err) {
                console.error(err);
                process.exit()
            } else {
                console.log(dependencyNodeDirectory + "/package.json")
                if (!fs.existsSync(dependencyNodeDirectory + "/package.json")) {
                    console.log("generating package.json")
                    writePackageJson(dependencyNodeDirectory, dependencyName);
                }
            }
        })

        // command output is in stdout

    });
}
console.log("end of the jar/maven dependency install")
