const conf = require(process.cwd() + "/package.json");
const fs = require("fs");
const installJar = require('./install').installJar;
const mvnDownload = require('mvn-artifact-download').default;
const mvnParser = require('mvn-artifact-name-parser').default;
const shell = require("shelljs");

let downloadArtifactLocal = (localRepo, artifact, dependencyName) => {

    let parse = mvnParser(artifact);
    let groupPath = parse.groupId.replace(new RegExp("\\.", 'g'), "/");
    let arPath = parse.artifactId.replace(new RegExp("\\.", 'g'), "/");
    let version = parse.version + (parse.isSnapShot ? "-SNAPSHOT" : "");

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

const downloadArtifactOnAllRepo = async function (remoteRepositories, artifact, dependencyName) {
    let errors = []
    for (let i = 0; i < remoteRepositories.length; i++) {
        let repo = remoteRepositories[i];
        try {
            console.log("try repo " + i + " " + repo);
            let ret = await mvnDownload(artifact, `${process.cwd()}/node_modules/${dependencyName}`, repo, undefined, {timeout: conf.installJarConfig.timeout});

            console.log(ret);
            return ret;
        } catch (e) {
            errors.push(e)
            console.log(`${artifact} not find in ${repo}, continue`)
        }
    }
    console.error(`cannot download ${artifact} for ${dependencyName} in any repository`)
    for (let i = 0; i < errors.length; i++) {
        console.error(errors[i])

    }
};

const manageMavenDependencies = async function () {
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
            await downloadArtifactOnAllRepo(remoteRepositories, artifact, dependencyName)
                .then(async () => {
                    console.log(`unzipping ${dependencyName}`);
                    console.log(fs.readdirSync(dependencyNodeDirectory));
                    let jarFile = fs.readdirSync(dependencyNodeDirectory).filter((fileName) => fileName.endsWith(".jar"))[0]
                   await installJar(dependencyNodeDirectory, jarFile, dependencyName);
                })
                .catch((err) => console.log(err));
        }


    });
};


module.exports = {manageMavenDependencies};
