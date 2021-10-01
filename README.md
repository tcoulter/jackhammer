# Jackhammer

Run a Hardhat Network node from the command line! 

<br/>
<br/>

<p align="center">
  <img width="200" height="200" src="jackhammer.png">
</p>

<br/>
<br/>

### Install

```
$ npm install jackhammer -g
```

### Example

```
$ jackhammer --port 7777 --accounts.count 1 --mining.interval 1000
```

<p align="center">
  <img  src="output.png">
</p>

### Features

* All the features of the `hardhat node` command
* Packaged as a helpful CLI
* No need to create extra configuration! 
* Can have multiple instances in parallel

### Parameters

All parameters are derived from the configuration values in the [Hardhat Network Reference](https://hardhat.org/hardhat-network/reference/#config). To turn a configuration option into a parameter, simply use the format `--<configuration name> value`. For nested parameters, like an account mnemonic, use the `.` separator to signal nesting. e.g., `--accounts.mnemonic "essay portion ... churn service"`. 

Jackhammer also accepts two parameters not in the Hardhat Network Reference: `--port` and `--hostname`. These work exactly the same way as they do when running `hardhat node`. 

### But read this! 

You'll get the best results if you run `jackhammer` within a project directory that already has hardhat installed! `jackhammer` can take advantage of the already-installed version and use that, much like npx! 

When you run `jackhammer` in a project without harthat installed, `jackhammer` will install hardhat to a persistent temporary directory (`path.join(os.tmpdir(), "__jackhammer_hardhat__")`). This is a one-time install, and future runs will use this installation when it can't be found in the current working directory. 

Why do all this? Well, hardhat doesn't like to be installed globally, and will error if you run a global install. So we circumvent this a bit to have a speedy CLI version. 

**Wanna help?** Add a `--clean` flag that'll get rid of the persistent temporary directory so that `jackhammer` can always use the latest version.

### Bonus! 

Jackhammer provides a handy `jh` shortcut command along with `jackhammer` for those of you that like shortcuts. Happy day! 

```
$ jh --port 7777
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:7777/
// ...
```

### Contributions

Sure! 

### FAQ

**Why did you build Jackhammer?**

I have a project that needs two test networks in the dev environment and I didn't want to manage two separate hardhat configurations in order to do so. 

**Would you transfer Jackhammer over to the Hardhat team if they wanted to officially support it?**

Of course! 