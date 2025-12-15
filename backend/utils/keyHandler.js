const crypto = require('crypto');

// Configuration for encryption
const ALGORITHM = 'aes-256-ctr';
const SALT_LENGTH = 16;
const KEY_LENGTH = 32; // for AES-256

// Encrypts the private key using the user's password [cite: 38]
// Returns a format that the Frontend can interpret (e.g., salt + IV + ciphertext)
exports.encryptPrivateKey = (privateKey, password) => {
    // 1. Generate a random salt
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    // 2. Derive a strong key from password + salt using PBKDF2
    const key = crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha512');
    
    // 3. Generate initialization vector
    const iv = crypto.randomBytes(16);
    
    // 4. Encrypt
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Return everything needed for decryption: Salt, IV, and Encrypted Data
    return {
        salt: salt.toString('hex'),
        iv: iv.toString('hex'),
        encryptedData: encrypted
    };
};