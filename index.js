#!/usr/bin/env node
const yargs = require('yargs/yargs');
const temp = require("temp");
const spawn = require('cross-spawn')
const path = require("path");
const fs = require("fs").promises;
const findParentDir = require('find-parent-dir');
const os = require("os");

temp.track();

const argv = yargs(process.argv.slice(2)).options({
  // Server config
  port: { 
    type: 'number'
  },
  hostname: {
    type: 'string'
  },

  // Provider config
  // In order from here: https://hardhat.org/hardhat-network/reference/#config
  chainId: {
    type: "number"
  },
  from: {
    type: "string"
  },
  gas: {
    type: "number"
  },
  gasPrice: {
    type: "number"
  },
  gasMultiplier: {
    type: "number"
  },
  accounts: {
    type: "array"
  },
  "accounts.mnemonic": { 
    type: 'string'
  },
  "accounts.initialIndex": {
    type: 'number'
  },
  "accounts.path": {
    type: 'string'
  },
  "accounts.count": {
    type: 'number'
  },
  "accounts.accountsBalance": {
    type: 'string'
  },
  blockGasLimit: {
    type: "number"
  },
  minGasPrice: {
    type: "number"
  },
  hardfork: {
    type: "string"
  },
  throwOnTransactionFailures: {
    type: "boolean"
  },
  throwOnCallFailures: {
    type: "boolean"
  },
  loggingEnabled: {
    type: "boolean"
  },
  initialDate: {
    type: "string"
  },
  allowUnlimitedContractSize: {
    type: "boolean"
  },
  "forking.url": {
    type: 'string'
  },
  "forking.blockNumber": {
    type: 'string'
  },
  "forking.enabled": {
    type: 'boolean'
  },
  initialBaseFeePerGas: {
    type: "string"
  },
  "mining.auto": {
    type: "boolean"
  },
  "mining.interval": {
    type: "array"
  }
}).argv;

let keys = Object.keys(argv);
let hasDeepAccountKeys = keys.filter((key) => key.indexOf("accounts.") >= 0).length > 0;

if (keys.indexOf("accounts") >= 0 && hasDeepAccountKeys) {
  throw new Error("Please specify either `accounts` or `accounts.<...>` options.");
}

const networkConfigObject = {};

Object.keys(argv).forEach((key) => {
  let obj = networkConfigObject;
  let currentKey = key;

  while (currentKey.indexOf(".") >= 0) {
    let prefix = currentKey.substring(0, currentKey.indexOf("."));

    if (typeof obj[prefix] == "undefined") {
      obj[prefix] = {};
    }

    currentKey = currentKey.substring(currentKey.indexOf("."));
    obj = obj[prefix];
  }

  obj[currentKey] = argv[key];
})

// Special cases due to yargs parsing

if (typeof networkConfigObject["mining"] != "undefined" 
  && typeof networkConfigObject.mining["interval"] != "undefined") {

  if (networkConfigObject.mining.interval.length == 1) {
    networkConfigObject.mining.interval = networkConfigObject.mining.interval[0];
  }
}

let mainConfigObject = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: networkConfigObject
  }
}

temp.mkdir('jackhammer', async function(err, dirPath) {
  var configPath = path.join(dirPath, 'hardhat.config.js')
  await fs.writeFile(configPath, `
    module.exports = ${JSON.stringify(mainConfigObject, null, 2)}
  `)

  let currentWorkingDirectory = process.cwd();
  let hardhatCLIPath = null;
  let spawnWorkingDirectory = currentWorkingDirectory;

  // Try looking for hardhat in the current working directory 
  // (or any parent folder with a node_modules folder).
  // If found, we'll use that one. 
  try {
    let dir = findParentDir.sync(currentWorkingDirectory, "node_modules")
    let potentialPath = path.join(dir, "node_modules", "hardhat", "internal", "cli", "cli.js");
    await fs.stat(potentialPath);
    hardhatCLIPath = potentialPath;
  } catch (e) {}

  let persistentTempDir = path.join(os.tmpdir(), "__jackhammer_hardhat__");

  // If it's not found in the current working directory, let's see if
  // it's in the persistent temporary directory. We do this so that 
  // we don't have to install it each time it's not found locally. 
  if (hardhatCLIPath == null) {
    try {
      let potentialPath = path.join(persistentTempDir, "node_modules", "hardhat", "internal", "cli", "cli.js");
      await fs.stat(potentialPath);
      hardhatCLIPath = potentialPath;
      spawnWorkingDirectory = persistentTempDir;
    } catch (e) {}
  }

  // Still nothing? Alright, let's install it. 
  if (hardhatCLIPath == null) {
    await fs.mkdir(persistentTempDir, {recursive: true})

    console.log("Hang tight, installing hardhat! (one-time, cached)");
    console.log("TIP: Jackhammer can skip this step if you run it within a project with hardhat installed.");
    console.log("")

    let interval = setInterval(() => {
      process.stdout.write(".")
    }, 1000)

    await new Promise((resolve, reject) => {
      let child = spawn("npm", [
        "install",
        "hardhat"
      ], {
        stdio: "ignore",
        cwd: persistentTempDir
      })

      child.on('exit', function() {
        resolve();
      })
    })
    
    clearInterval(interval);

    console.log("")
    console.log("")

    hardhatCLIPath = path.join(persistentTempDir, "node_modules", "hardhat", "internal", "cli", "cli.js");
    spawnWorkingDirectory = persistentTempDir;
  }

  let args = [
    hardhatCLIPath,
    "--config",
    path.join(configPath),
    "node"
  ];

  if (typeof argv["port"] != "undefined") {
    args.push("--port", argv["port"])
  }

  if (typeof argv["hostname"] != "undefined") {
    args.push("--hostname", argv["hostname"])
  }

  spawn("node", args, {
    stdio: "inherit",
    cwd: spawnWorkingDirectory
  })
});