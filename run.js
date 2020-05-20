let conf = require(process.cwd() + "/package.json")
let fs = require("fs")
let extractZip = require("extract-zip")
var shell = require("shelljs");
const request = require('request');

let mvnDownload = require('mvn-artifact-download').default;
let mvnParser = require('mvn-artifact-name-parser').default;
let writePackageJson = function (dependencyNodeDirectory, dependencyName) {
    console.log(`generate package.json for ${dependencyNodeDirectory}`)
    let files = fs.readdirSync(dependencyNodeDirectory);
    let main = files.filter((f) => f.endsWith(".js") && !f.endsWith("meta.js"));
    if (main.length == 0) {
        console.error(`Error : no usable js file for ${dependencyName}`);
        process.exit(1)
    }
    fs.writeFileSync(dependencyNodeDirectory + "package.json", JSON.stringify({name: dependencyName, "main": main[0]}));
    return files;
};


let runInstall = function (dependencyNodeDirectory) {
    console.log("runInstall");
    let cmd = `npm install --prefix ${dependencyNodeDirectory}`;
    let exec = shell.exec(cmd)

    if (exec.code !== 0) {
        console.error(exec.stdout);
        process.exit(1)
    }
    console.log("runInstall end");
};

let downloadArtifactLocal = (localRepo, artifact, dependencyName) => {

    let parse = mvnParser(artifact);
    let groupPath = parse.groupId.replace(new RegExp("\\.", 'g'), "/");
    let arPath = parse.artifactId.replace(new RegExp("\\.", 'g'), "/");
    console.log(groupPath)
    console.log(arPath)
    let version = parse.version + (parse.isSnapShot ? "-SNAPSHOT" : "");
    console.log(localRepo)

    let fileName = parse.artifactId + "-" + version + "." + (parse.classifier ? parse.classifier : "jar");
    let artifactPath = "/" + localRepo + "/" + groupPath + "/" + arPath + "/" + version + "/" + fileName;
    console.log(artifactPath);
    if (fs.existsSync(artifactPath)) {
        console.log(`find ${artifact} in local`)
        fs.copyFileSync(artifactPath, `${process.cwd()}/node_modules/${dependencyName}/${dependencyName}.jar`)

        return true;
    }

    console.log(`not find ${artifact} in local: ${artifactPath}`)
    console.log("----")
    return false;

}

let downloadArtifactOnAllRepo = async function (remoteRepositories, artifact, dependencyName) {
    for (let i = 0; i < remoteRepositories.length; i++) {
        let repo = remoteRepositories[i];
        try {
            console.log("try repo " + i + " " + repo);
            let ret = await mvnDownload(artifact, `${process.cwd()}/node_modules/${dependencyName}`, repo, undefined, {timeout: conf.installJarConfig.timeout});

            console.log(ret);
            return ret;
        } catch (e) {
            console.log(e);
            console.error(`${artifact} not find in ${repo}, continue`)
        }
    }
};
let manageMavenDependencies = async function () {
    let cmdGetMavenRepo = " mvn help:evaluate -Dexpression=settings.localRepository | grep -v '\\[INFO\\]'"
    let getMavenRepoExec = shell.exec(cmdGetMavenRepo);
    if (getMavenRepoExec.code !== 0) {
        console.error("error in maven load of " + dependencyName);
        console.error(exec.stdout);
        process.exit(1)
    }
    let localMavenRepo = getMavenRepoExec.stdout.replace("\n", "");
    console.log("local maven repo:" + localMavenRepo + " use: " + (conf.installJarConfig.useMavenLocalRepository === true));
    let defaultMavenRepositories;
    if (conf.installJarConfig.defaultMavenRepositories) {
        console.log("override defaultMavenRepositories")
        defaultMavenRepositories = conf.installJarConfig.defaultMavenRepositories;
    } else {
        console.log("use defaultMavenRepositories")
        defaultMavenRepositories = ["https://repo.maven.apache.org/maven2/", "https://repo1.maven.org/maven2/", "https://jcenter.bintray.com/"];
    }
    let remoteRepositories;

    if (conf.installJarConfig.additionalMavenRepositories && Array.isArray(conf.installJarConfig.additionalMavenRepositories)) {
        console.log("use additional additionalMavenRepositories")
        remoteRepositories = defaultMavenRepositories.concat(conf.installJarConfig.additionalMavenRepositories);
    } else {
        remoteRepositories = defaultMavenRepositories;
    }
    console.log("maven distant repo:" + remoteRepositories)

    Object.keys(conf.mavenDependencies).map(async function (dependencyName, index) {


        console.log(`loading ${dependencyName}`);
        var artifact = conf.mavenDependencies[dependencyName];
        let dependencyNodeDirectory = `${process.cwd()}/node_modules/${dependencyName}/`;

        if (!fs.existsSync(dependencyNodeDirectory)) {
            fs.mkdirSync(dependencyNodeDirectory);
        }


        if (conf.installJarConfig.useMavenLocalRepository === false || !downloadArtifactLocal(localMavenRepo, artifact, dependencyName)) {
            await downloadArtifactOnAllRepo(remoteRepositories, artifact, dependencyName).catch((err) => console.log(err));

        }


        console.log(`unzipping ${dependencyName}`);
        console.log(fs.readdirSync(dependencyNodeDirectory));
        let jarFile = fs.readdirSync(dependencyNodeDirectory).filter((s) => s.endsWith(".jar"))[0]
        try {
            await extractZip(dependencyNodeDirectory + jarFile, {dir: dependencyNodeDirectory})
            console.log(`unzipped ${dependencyName}`);
            if (!fs.existsSync(dependencyNodeDirectory + "package.json")) {
                writePackageJson(dependencyNodeDirectory, dependencyName);
            }
            runInstall(dependencyNodeDirectory)

        } catch (err) {
            console.error("error in extractZip of " + dependencyNodeDirectory + " " + jarFile);
            console.error(err);
            process.exit()
        }
    });
};


async function manageJarDependency(dependencyName) {
    let dependencyJarPath = conf.jarDependencies[dependencyName];
    console.log(`loading ${dependencyName} : ${dependencyJarPath}`);
    let dependencyNodeDirectory = `${process.cwd()}/node_modules/${dependencyName}`;
    if (!fs.existsSync(dependencyNodeDirectory)) {
        console.debug(`making dir ${dependencyNodeDirectory}`);
        fs.mkdirSync(dependencyNodeDirectory);
        console.debug(`maked ${dependencyNodeDirectory}`)
    }

    console.debug("coping " + dependencyJarPath + " to " + dependencyNodeDirectory + " " + dependencyName)
    if(dependencyJarPath.startsWith("http")){
         request(dependencyJarPath)
            .pipe(fs.createWriteStream(`${dependencyNodeDirectory}/${dependencyName}.jar`))
            .on('close', async function () {
                console.log('File written!');
                console.debug("copied");
                try {
                    await extractZip(`${dependencyNodeDirectory}/${dependencyName}.jar`, {dir: dependencyNodeDirectory})
                    console.log(dependencyNodeDirectory + "package.json");
                    if (!fs.existsSync(dependencyNodeDirectory + "package.json")) {
                        console.log("generating package.json");
                        writePackageJson(dependencyNodeDirectory, dependencyName);
                    }
                    runInstall(dependencyNodeDirectory)
                } catch (err) {
                    console.log("error in unzip of " + dependencyName);
                    console.error(err);
                    process.exit()

                }

        });
    }else {
        fs.copyFileSync(`${dependencyJarPath}`, `${dependencyNodeDirectory}/${dependencyName}.jar`)
        console.debug("copied");
        try {
            await extractZip(`${dependencyNodeDirectory}/${dependencyName}.jar`, {dir: dependencyNodeDirectory})
            console.log(dependencyNodeDirectory + "package.json");
            if (!fs.existsSync(dependencyNodeDirectory + "package.json")) {
                console.log("generating package.json");
                writePackageJson(dependencyNodeDirectory, dependencyName);
            }
            runInstall(dependencyNodeDirectory)
        } catch (err) {
            console.log("error in unzip of " + dependencyName);
            console.error(err);
            process.exit()

        }
    }


    // command output is in stdout
}

let run = async function () {

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
