const { NFT_CONTRACT_ADDRESS } = require("../constants");

const main = async () => {
  const nftContractAddress = NFT_CONTRACT_ADDRESS;

  const tokenContractFactory = await hre.ethers.getContractFactory("CDToken");
  const tokenContract = await tokenContractFactory.deploy(nftContractAddress);
  await tokenContract.deployed();

  console.log("Contract deployed at: ", tokenContract.address);
};

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};

runMain();
