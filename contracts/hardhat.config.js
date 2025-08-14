require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
const path = require("path");

// Use absolute path resolution
const envPath = path.resolve(__dirname, "../.env");
console.log("Looking for .env at:", envPath);
console.log(".env file exists:", require("fs").existsSync(envPath));

require("dotenv").config({ path: envPath });

console.log('=== ENVIRONMENT DEBUG ===');
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('Resolved .env path:', envPath);
console.log('PRIVATE_KEY loaded:', !!process.env.PRIVATE_KEY);
console.log('PRIVATE_KEY length:', process.env.PRIVATE_KEY?.length);
console.log('PRIVATE_KEY first 10 chars:', process.env.PRIVATE_KEY?.substring(0, 10));
console.log('========================');

if (!process.env.PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY not found in environment variables");
}

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: { 
      optimizer: { enabled: true, runs: 200 }, 
      viaIR: true 
    }
  },
  defaultNetwork: "hardhat",
  networks: {
    "sonic-testnet": {
      url: "https://rpc.blaze.soniclabs.com",
      chainId: 57054,
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 10000000000,
      timeout: 60000
    },
    "hardhat": { 
      chainId: 31337 
    }
  },
  paths: {
    sources: "./src",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  }
};
