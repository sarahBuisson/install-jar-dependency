
let log = require("kotlin-logging")

console.log(log.mu)
console.log(log.mu.internal.KLoggerJS)
console.log(log.mu.internal.KLoggerJS.$metadata$.interfaces)
log.mu.internal.KLoggerJS("eee").log("z")
