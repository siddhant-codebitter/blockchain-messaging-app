const API_URL = 'http://localhost:3000/api';

/**
 * Handles User Registration
 * Note: The actual wallet generation happens on the backend in this hybrid model
 * to ensure the key is encrypted before storage.
 */
async function registerUser(username, password) {
    try {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok) {
            return { success: true, data };
        } else {
            return { success: false, message: data.message || "Signup failed" };
        }
    } catch (error) {
        return { success: false, message: error.message };
    }
}

/**
 * Handles User Login and Client-Side Decryption
 * 1. Fetches encrypted key from backend
 * 2. Decrypts it using the plain-text password locally
 */
async function loginUser(username, password) {
    try {
        // 1. Get Encrypted Data from Backend
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (!response.ok) {
            return { success: false, message: data.message || "Login failed" };
        }

        // 2. Local Decryption (Replacing MetaMask)
        // We use the password + salt to derive the key, then decrypt the private key
        try {
            const privateKey = decryptPrivateKey(data.encrypted_key, password);
            return {
                success: true,
                username: data.username,
                ethAddress: data.eth_address,
                privateKey: privateKey
            };
        } catch (decryptError) {
            console.error(decryptError);
            return { success: false, message: "Decryption failed. Wrong password?" };
        }

    } catch (error) {
        return { success: false, message: error.message };
    }
}

/**
 * Decrypts the backend-provided JSON object using the user's password.
 * Replicates the Node.js 'crypto' logic using 'crypto-js' library.
 */
function decryptPrivateKey(encryptedObj, password) {
    // encryptedObj contains: { salt, iv, encryptedData } all in hex
    
    const salt = CryptoJS.enc.Hex.parse(encryptedObj.salt);
    const iv = CryptoJS.enc.Hex.parse(encryptedObj.iv);
    const encryptedData = CryptoJS.enc.Hex.parse(encryptedObj.encryptedData);

    // 1. Derive Key (Must match backend parameters: 100k iterations, 32 key size, sha512)
    const key = CryptoJS.PBKDF2(password, salt, {
        keySize: 256 / 32, // 256 bits
        iterations: 100000,
        hasher: CryptoJS.algo.SHA512
    });

    // 2. Decrypt
    const cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: encryptedData
    });

    const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
        iv: iv,
        mode: CryptoJS.mode.CTR,
        padding: CryptoJS.pad.NoPadding
    });

    // 3. Convert to UTF-8 String (The original Private Key)
    return decrypted.toString(CryptoJS.enc.Utf8);
}