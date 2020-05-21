const conf = require(process.cwd() + "/package.json");
const fs = require("fs");
const manageJarDependency = require('./jar').manageJarDependency;
const manageMavenDependencies = require('./maven').manageMavenDependencies;



const run = async function () {

    try {
        if (!fs.existsSync(`${process.cwd()}/node_modules/`)) {
            fs.mkdirSync(`${process.cwd()}/node_modules/`);
        }
        if (conf.mavenDependencies != null) {

            console.log("manage mavenDependencies")
            manageMavenDependencies();
        }


        if (conf.jarDependencies != null) {
            console.log("manage jarDependencies")
            Object.keys(conf.jarDependencies).map(async function (dependencyName, index) {
                await manageJarDependency(dependencyName);

            });
        }
    } catch (e) {
        console.error(e)
    }
    console.log("end of the jar/maven dependency install.");
};
run();


module.exports = {run};
