// Configuration
const GANACHE_URL = 'http://127.0.0.1:8545';
const CONTRACT_ADDRESS = '0x52056dd0568479aFD9612249d1a16a5230825E66'; // <--- PASTE NEW ADDRESS HERE !!!

let web3;
let contract;
let userAccount;

async function initBlockchain() {
    web3 = new Web3(GANACHE_URL);

    // Updated ABI for the NEW Contract
    const abi = [
        {
            "anonymous": false,
            "inputs": [
                { "indexed": true, "internalType": "address", "name": "sender", "type": "address" },
                { "indexed": true, "internalType": "address", "name": "receiver", "type": "address" }
            ],
            "name": "MessageStored",
            "type": "event"
        },
        {
            "inputs": [{ "internalType": "string", "name": "_username", "type": "string" }],
            "name": "getAddressByUsername",
            "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                { "internalType": "address", "name": "_receiver", "type": "address" },
                { "internalType": "string", "name": "_encryptedContent", "type": "string" }
            ],
            "name": "sendMessage",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "getMyMessages",
            "outputs": [{
                "components": [
                    { "internalType": "string", "name": "encryptedContent", "type": "string" },
                    { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
                    { "internalType": "address", "name": "otherParty", "type": "address" }
                ],
                "internalType": "struct Identity.Message[]",
                "name": "",
                "type": "tuple[]"
            }],
            "stateMutability": "view",
            "type": "function"
        }
    ];

    contract = new web3.eth.Contract(abi, CONTRACT_ADDRESS);

    const privateKey = sessionStorage.getItem('privateKey');
    if (privateKey) {
        const account = web3.eth.accounts.privateKeyToAccount(privateKey);
        web3.eth.accounts.wallet.add(account);
        userAccount = account;
        console.log("Wallet initialized:", account.address);
    }
}

async function getAddressByUsername(username) {
    try {
        const address = await contract.methods.getAddressByUsername(username).call();
        if (address === '0x0000000000000000000000000000000000000000') return null;
        return address;
    } catch (error) {
        console.error("Lookup failed:", error);
        return null;
    }
}

// Stores the encrypted string on the blockchain
async function sendMessageOnChain(receiverAddress, encryptedString) {
    try {
        const gas = await contract.methods.sendMessage(receiverAddress, encryptedString)
            .estimateGas({ from: userAccount.address });
        
        await contract.methods.sendMessage(receiverAddress, encryptedString).send({
            from: userAccount.address,
            gas: gas
        });
        return true;
    } catch (error) {
        console.error("Blockchain send failed:", error);
        return false;
    }
}

// Fetches ALL messages stored for the current user
async function fetchMyMessages() {
    try {
        const messages = await contract.methods.getMyMessages().call({ from: userAccount.address });
        return messages;
    } catch (error) {
        console.error("Fetch failed:", error);
        return [];
    }
}