const { ethers } = require("ethers");
const { task } = require("hardhat/config");
const fs = require('fs');
const NETWORKS = require("./deploymentUtils/networks");
const { exit } = require("process");
require("@nomiclabs/hardhat-waffle");
require("dotenv").config()

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html

task("network", "Fetches Detailed data about current network")
  .addParam("chainid", "The chain ID of currently connected network").setAction(async (taskArgs, hre) => {

    try {
      if (!taskArgs.chainid) throw new Error('ID not provided.');

      if (!Array.isArray(NETWORKS.arr)) throw new Error('Network data error');

      const a = NETWORKS.arr.filter(
        (net) => net.chainId && net.networkId == taskArgs.chainid,
      )[0];


      if (a && a.name)
        return {
          name: a.name,
          currency: a.nativeCurrency.symbol || '??',
          decimals: a.nativeCurrency.decimals || 18,
        };
      else return false;
    } catch (error) {
      console.log(error);
      return false;
    }

  })

task('deployer', "Shows all information about the account tied to the private key in the .env file in addition to network information")
  .setAction(async (taskArgs, hre) => {
    try {
      if (!process.env.PRIVATE_KEY)
        throw new Error('Please provide a private key in the .env file');

      const account = await new ethers.Wallet(
        process.env.PRIVATE_KEY,
      ).getAddress();
      let chainId = (await hre.ethers.provider.getNetwork()).chainId;
      const chainData = await hre.run(`network`, {
        chainid: chainId.toString(),
      }); //defined above
      const balance = await hre.ethers.provider.getBalance(account);

      console.log(
        '\x1b[36m',
        '\n\t\t>_ Deployer account : ',
        '\x1b[35m',
        `\n\n\t\t\tAccount : ${account}`,
        '\x1b[32m',
        `\n\t\t\tNetwork : ${chainData.name} (${chainId})`,
        '\x1b[31m',
        `\n\t\t\tBalance : ${parseFloat(
          ethers.utils.formatEther(balance),
        ).toFixed(2)} ${chainData.currency}`,
      );
    } catch (error) {

      console.log('\x1b[31m', error.message || error);

    }

  });

task(
  'deploy',
  'Deploys specified contract and writes Prepared ABI to dedicated file',
)
  .addParam('contract', 'Name of the Contract you want to deploy')
  .addOptionalParam(
    'args',
    'array of args to pass into contract constructor',
  )
  .setAction(async (taskArgs, hre) => {
    try {

      const CONTRACT = await hre.ethers.getContractFactory(
        taskArgs.contract,
      );

      //console.log(CONTRACT)
      let contract;
      let deployTx;

      if (taskArgs.args) {

        let args = taskArgs.args.split(',');
        console.log(...args);
        contract = await CONTRACT.deploy(...args);
        deployTx = CONTRACT.getDeployTransaction(...args);

      } else {

        contract = await CONTRACT.deploy();
        deployTx = CONTRACT.getDeployTransaction();

      }


      
      const estimatedGas = await CONTRACT.signer.estimateGas(deployTx);
      const gasPrice = await CONTRACT.signer.getGasPrice();
      const deploymentPriceWei = gasPrice.mul(estimatedGas);
      const deploymentPriceRBTC =
        ethers.utils.formatEther(deploymentPriceWei);

      let chainId = (await hre.ethers.provider.getNetwork()).chainId;
      const chainData = await hre.run(`network`, {
        chainid: chainId.toString(),
      }); //defined above
      console.log(
        '\x1b[36m',
        `\n\t\t>_ Estimated gas cost :`,
        '\x1b[35m',
        Math.round(
          (parseFloat(deploymentPriceRBTC) + Number.EPSILON) * 100,
        ) / 100,
        chainData.currency,
      );

      console.log(
        '\x1b[36m',
        `\n\t\t>_ ${taskArgs.contract} Contract is deploying...`,
      );


      const contractDeployed = await contract.deployed();
      const contractAddress = contractDeployed.address;

      console.log(
        '\x1b[36m',
        `\n\t\t>_ ${taskArgs.contract} contract deployed to:`,
        '\x1b[35m',
        contractAddress,
      );

      const ABI =
        require(`./artifacts/contracts/${taskArgs.contract}.sol/${taskArgs.contract}.json`).abi;

      let data = `{
      
    "${taskArgs.contract}" : { 
      
      "Address" :"${contractAddress}",  
      "Abi"     : ${JSON.stringify(ABI)}
    
    }
    
  }`;
      var dir = './abis';

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }

      //we'll use this file on the front end to call this contract via a wallet provider
      fs.writeFileSync(`${dir}/${taskArgs.contract}.json`, data, {
        encoding: 'utf8',
        flag: 'w',
        mode: 0o666,
      });
      console.log(
        '\x1b[36m',
        `\n\t\t>_ Final Gas price paid :`,
        '\x1b[35m',
        `${ethers.utils.formatEther(
          contractDeployed.deployTransaction.gasPrice.mul(estimatedGas),
        )}`,
        '\x1b[36m',
        `${chainData.currency}`,
      );

      console.log(
        '\x1b[36m',
        `\n\t\t>_ ${taskArgs.contract} contract ABI written to:`,
        '\x1b[35m',
        `${dir}/${taskArgs.contract}.json`,
        '\x1b[36m',
        '(ctrl + click to view)',
      );

      return contractAddress;
    } catch (error) {
      console.error(error);
    }
  });


// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.0",
  networks: {
    mumbai: {
      url: process.env.POLYGON_MUMBAI,
      accounts: [process.env.PRIVATE_KEY]
    },
    polygon_mainnet: {
      url: process.env.POLYGON_MAINNET,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};