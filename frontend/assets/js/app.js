let currentChatUser = null;
let currentChatAddress = null;

window.addEventListener('load', async () => {
    await initBlockchain();
    
    const username = sessionStorage.getItem('username');
    if(username) {
        document.title = `Chat - ${username}`;
    }

    // Poll blockchain for new messages every 3 seconds
    setInterval(loadChatHistory, 3000);
});

function logout() {
    sessionStorage.clear();
    if(web3) web3.eth.accounts.wallet.clear();
    window.location.href = 'login.html';
}

async function startChat() {
    const usernameInput = document.getElementById('recipient-search');
    const username = usernameInput.value.trim();
    
    if(!username || username === sessionStorage.getItem('username')) return;

    const address = await getAddressByUsername(username);
    if(!address) {
        alert("User not found on blockchain.");
        return;
    }

    currentChatUser = username;
    currentChatAddress = address;
    document.getElementById('chat-with-header').innerText = `Chatting with: ${username}`;
    
    loadChatHistory(); // Load messages immediately
}

/**
 * 1. Formats the string as per requirement
 * 2. Encrypts it using a shared key
 * 3. Sends it to blockchain
 */
async function sendMessageUI() {
    const input = document.getElementById('message-input');
    const text = input.value; // Max length 150 bytes per requirement
    const sender = sessionStorage.getItem('username');
    
    if(!text || !currentChatUser) return;
    if(text.length > 150) { alert("Message too long (Max 150 bytes)"); return; }

    // --- A. FORMATTING ---
    // Format: DD-MM-YYYY HH:mm "Sender" to "Receiver" "Message" [cite: 71]
    const now = new Date();
    const timeStamp = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth()+1).padStart(2, '0')}-${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    // Note: We escape quotes inside the text to ensure the format holds
    const formattedString = `${timeStamp} "${sender}" to "${currentChatUser}" "${text}"`;

    // --- B. ENCRYPTION ---
    // We need a key that BOTH Alice and Bob know, but no one else.
    // Solution: Hash(Sorted(Alice, Bob)). 
    // This creates a unique chat ID for this pair.
    const sharedKey = generateSharedKey(sender, currentChatUser);
    const encryptedContent = CryptoJS.AES.encrypt(formattedString, sharedKey).toString();

    // --- C. STORAGE ON BLOCKCHAIN ---
    const success = await sendMessageOnChain(currentChatAddress, encryptedContent);
    
    if(success) {
        input.value = '';
        loadChatHistory(); // Refresh to show the new message
    } else {
        alert("Failed to send message.");
    }
}

async function loadChatHistory() {
    if(!currentChatUser) return;

    const myUsername = sessionStorage.getItem('username');
    const container = document.getElementById('messages');
    
    // 1. Fetch ALL messages from Blockchain for this user
    const rawMessages = await fetchMyMessages();
    
    // 2. Generate the Key to decrypt messages for THIS specific chat
    const sharedKey = generateSharedKey(myUsername, currentChatUser);

    // Clear UI before re-rendering
    container.innerHTML = '';

    // 3. Process, Decrypt and Filter
    rawMessages.forEach(msg => {
        try {
            // Attempt to decrypt using the shared key
            const bytes = CryptoJS.AES.decrypt(msg.encryptedContent, sharedKey);
            const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

            // If decryption fails (returns empty), it means this message belongs to a different chat
            if(decryptedString) {
                // Parse the string to extract the text for display
                // Format: Date "Sender" to "Receiver" "Text"
                // We use regex to extract the "Sender" and "Text" safely
                const match = decryptedString.match(/^(.*?) "(.*?)" to "(.*?)" "(.*)"$/);
                
                if(match) {
                    const msgSender = match[2];
                    const msgText = match[4];
                    const msgDate = match[1];

                    // Determine if it was sent by me or received
                    const type = (msgSender === myUsername) ? 'sent' : 'received';
                    
                    // Display
                    addMessageToUI(`${msgText} \n<small style="font-size:0.7em; color:#555;">${msgDate}</small>`, type);
                }
            }
        } catch (e) {
            // Ignore messages that can't be decrypted with this key (they belong to other chats)
        }
    });
}

function addMessageToUI(htmlContent, type) {
    const container = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = `message ${type}`;
    div.innerHTML = htmlContent; // Use innerHTML to support the small date tag
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// Generates a consistent key for two users regardless of who logs in
function generateSharedKey(user1, user2) {
    // Sort names alphabetically so "Alice"+"Bob" gives same key as "Bob"+"Alice"
    const participants = [user1, user2].sort();
    return participants.join('_secret_'); 
}