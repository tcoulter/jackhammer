#!/usr/bin/env node
const yargs = require('yargs/yargs');
const temp = require("temp");
const {spawn} = require("child_process");
const path = require("path");
const fs = require("fs").promises;

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

temp.mkdir('sawsall', async function(err, dirPath) {
  var configPath = path.join(dirPath, 'hardhat.config.js')
  await fs.writeFile(configPath, `
    module.exports = ${JSON.stringify(mainConfigObject, null, 2)}
  `)

  let args = [
    "./node_modules/hardhat/internal/cli/cli.js",
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
    stdio: "inherit"
  })
});