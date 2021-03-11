// // We require the Hardhat Runtime Environment explicitly here. This is optional 
// // but useful for running the script in a standalone fashion through `node <script>`.
// //
// // When running the script with `hardhat run <script>` you'll find the Hardhat
// // Runtime Environment's members available in the global scope.
// const hre = require("hardhat");

import { run, ethers } from "hardhat";

async function main() {
  await run("compile");

  const accounts = await ethers.getSigners();

  console.log("Accounts:", accounts.map(a => a.address));
}


main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
