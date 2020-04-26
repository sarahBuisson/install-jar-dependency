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
  
  

optional: add custom maven Repositories
(default repositories are "https://repo.maven.apache.org/maven2/", "https://repo1.maven.org/maven2/", "https://jcenter.bintray.com/")
```
  "mavenRepositories": [
    "https://kotlin.bintray.com/kotlinx/",
    "https://kotlin.bintray.com/kotlinx/",
    "https://dl.bintray.com/kotlin/kotlinx/"
  ]
```
  
  
  Example project here: https://github.com/sarahBuisson/install-jar-dependency/tree/master/example