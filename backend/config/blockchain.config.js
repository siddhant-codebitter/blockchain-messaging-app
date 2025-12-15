const { Web3 } = require('web3');
require('dotenv').config();

const web3 = new Web3(process.env.GANACHE_URL); // Default: http://127.0.0.1:7545

// Load the compiled Contract ABI (You must compile Identity.sol first and save the JSON here)
// For now, ensure you place the ABI json in backend/build/Identity.json
const contractABI = require('../build/Identity.json').abi; 
const contractAddress = process.env.CONTRACT_ADDRESS;

let identityContract;
if (contractAddress) {
    identityContract = new web3.eth.Contract(contractABI, contractAddress);
}

module.exports = { web3, identityContract };