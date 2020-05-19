# install-jar-dependency
Warning: this project is a beta. 
Allow to use jar (who contains js) as dependency .
Will create a package.json if not already exist.
Allow use of maven dependency

Typical useCase is js lib build by kotlin-multiplatform or maven

## Installation

install the library 

```
 "devDependencies": {
    "install-jar-dependency": "0.0.8"
  }
```

configure the plugin

```
  "scripts": {
     "postinstall": "npx install-maven-dependency"
  },
  
```
  define your dependency
  ```
  "mavenDependencies": {
    "yourMavenDependenciesName": "groupId:artifactId:version"
  },
    "jarDependencies": {
      "yourJarDependenciesName": "/path/someJar.jar"
    },

```

  Install the maven/jar library: (to redo each time you update mavenDependencies/jarDependencies )
   
  ```
  npm install
  ```
  
## advanced configuration  

### add custom maven Repositories
```
installJarConfig:{
  "additionalMavenRepositories": [
    "https://kotlin.bintray.com/kotlinx/",
    "https://kotlin.bintray.com/kotlinx/",
    "https://dl.bintray.com/kotlin/kotlinx/"
  ]
}
```

###override defaultMavenRepositories
(default repositories are "https://repo.maven.apache.org/maven2/", "https://repo1.maven.org/maven2/", "https://jcenter.bintray.com/")
```  
    installJarConfig:{
        defaultMavenRepositories:
            [ "https://kotlin.bintray.com/kotlinx/"]
    }
```
  
###don't use maven local repository: (default:true)
```
installJarConfig : {
    useMavenLocalRepository:false  
}
```

###use a specific timeout in ms: (default= system timeout)
  ```
installJarConfig : {
    timeout:10000  
}
```
  
  Example project here: https://github.com/sarahBuisson/install-jar-dependency/tree/master/example