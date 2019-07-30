# install-jar-dependency
Allow to use jar (who contains js) as dependency .
Will create a package.json if not already exist.
Allow use of maven dependency

Typical useCase is js lib build by kotlin-multiplatform or maven

## Installation

Get the library installed in global

```
npm install install-jar-dependency -g
```

configure the plugin

```
  "scripts": {
     "postinstall": "install-maven-dependency"
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
  
  
