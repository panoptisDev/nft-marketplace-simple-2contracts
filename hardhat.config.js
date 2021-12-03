require("@nomiclabs/hardhat-waffle");

const fs =require("fs");
const privateKey = fs.readFileSync('.secret').toString();

const projectID = "f0dd844e54f24b2482c46e7977bdb98d";


module.exports = {
  networks: {
    hardhat: {
      chainId: 1337,
    },
    mumbai: {
      url: `https://polygon-mumbai.infura.io/v3/${projectID}`,
      accounts: [privateKey],
    },
    mainnet: {
      url: `https://polygon-mainnet.infura.io/v3/${projectID}`,
      accounts: [privateKey],
    },
  },
  solidity: "0.8.4",
};
