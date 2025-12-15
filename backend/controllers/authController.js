const bcrypt = require('bcrypt');
const { web3, identityContract } = require('../config/blockchain.config');
const db = require('../config/db.config');
const { encryptPrivateKey } = require('../utils/keyHandler');

// 4.2 Sign-up Logic
exports.signup = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send({ message: "Username and password are required." });
    }

    try {
        // 1. Validation: Check if username exists in DB
        const [rows] = await db.promise().query('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length > 0) {
            return res.status(400).send({ message: "Username already exists." });
        }

        // 2. Wallet Generation
        const newAccount = web3.eth.accounts.create();
        const { address, privateKey } = newAccount;

        // 3. Fund the New Wallet FIRST
        const fundingSender = process.env.SENDER_ADDRESS;
        if (!fundingSender) {
            throw new Error("SENDER_ADDRESS is missing in .env file");
        }

        console.log(`Funding new wallet ${address} from ${fundingSender}...`);
        
        // Fund the new user so they can pay for their registration
        await web3.eth.sendTransaction({
            from: fundingSender,
            to: address,
            value: web3.utils.toWei('1', 'ether') // 1 ETH
        });
        console.log("Funding successful.");

        // --- FIX: Add account to local wallet so Web3 can calculate nonce ---
        web3.eth.accounts.wallet.add(privateKey);

        // 4. Blockchain Registration
        console.log("Registering on Blockchain...");
        
        // Direct send() because the account is now in the wallet
        await identityContract.methods.register(username).send({
            from: address,
            gas: 500000 // Hardcoded gas limit is safer here
        });

        console.log("Blockchain registration successful.");

        // Remove private key from wallet memory for security
        web3.eth.accounts.wallet.remove(address);

        // 5. Database Storage & Encryption
        const encryptedKeyObj = encryptPrivateKey(privateKey, password);
        const encryptedKeyString = JSON.stringify(encryptedKeyObj); 

        const passwordHash = await bcrypt.hash(password, 10);
        
        const sql = `INSERT INTO users (username, password_hash, eth_address, encrypted_key) VALUES (?, ?, ?, ?)`;
        await db.promise().query(sql, [username, passwordHash, address, encryptedKeyString]);

        res.status(201).send({ message: "User registered successfully!", eth_address: address });

    } catch (error) {
        console.error("Signup Error:", error);
        
        // Ensure key is removed even if error occurs
        if(req.body.address) web3.eth.accounts.wallet.remove(req.body.address);
        
        res.status(500).send({ message: "Error registering user.", error: error.message });
    }
};

// 4.3 Login Logic
exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        // 1. Verification
        const [rows] = await db.promise().query('SELECT * FROM users WHERE username = ?', [username]);
        
        if (rows.length === 0) {
            return res.status(404).send({ message: "User not found." });
        }

        const user = rows[0];
        const passwordIsValid = await bcrypt.compare(password, user.password_hash);

        if (!passwordIsValid) {
            return res.status(401).send({ message: "Invalid Password." });
        }

        // 2. Response: Return eth_address and encrypted_key
        res.status(200).send({
            username: user.username,
            eth_address: user.eth_address,
            encrypted_key: JSON.parse(user.encrypted_key)
        });
        
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).send({ message: "Error logging in.", error: error.message });
    }
};