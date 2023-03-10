// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled

  try {

    await hre.run('deployer');
    await hre.run('compile');
    const address = await hre.run('deploy', { contract: "Token", args: "5000000000" })
    
    if (address) {

       await hre.run('deploy', {
				contract: 'ProjectFunder',
				args: `${address}`,
			});
    }
    
  } catch (error) {

    console.log(error)
  }


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });