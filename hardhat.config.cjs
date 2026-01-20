require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

const accounts = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [];

module.exports = {
    solidity: "0.8.27",
    networks: {
        worldchain: {
            url: 'https://worldchain-mainnet.g.alchemy.com/v2/' + (process.env.ALCHEMY_API_KEY || ""),
            accounts: accounts,
            gasPrice: "auto",
        },
        worldchaintest: {
            url: 'https://worldchain-sepolia.g.alchemy.com/v2/' + (process.env.ALCHEMY_API_KEY || ""),
            accounts: accounts,
            gasPrice: "auto",
        },
    }
};
