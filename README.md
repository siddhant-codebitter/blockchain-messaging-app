# Blockchain-Based Decentralized Messaging App

A hybrid messaging application that combines the security of a **local Blockchain (Ganache)** for identity management and message logging with the usability of a **centralized Backend (Node.js/MySQL)** for authentication and key storage.

## 🚀 Features

* **Hybrid Decentralization:** User identity and message metadata are stored on the blockchain, while encrypted private keys are stored in a traditional database.
* **No MetaMask Required:** In-browser key decryption allows users to interact with the blockchain using a standard username/password login.
* **Immutable Chat History:** Messages are encrypted and stored permanently on the blockchain.
* **End-to-End Encryption:** Messages are encrypted using a shared key derived from the sender and receiver's identities.
* **Format Compliance:** Messages follow the strict format: `DD-MM-YYYY HH:mm "Sender" to "Receiver" "Message Text"`.

---

## 🛠️ Prerequisites

Ensure you have the following installed on your machine:
1.  **Node.js** (v14 or higher)
2.  **MySQL Server** (running locally)
3.  **Ganache** (Personal Blockchain for Ethereum development)
4.  **A Code Editor** (VS Code recommended)

---

## ⚙️ Installation & Setup

### 1. Database Setup (MySQL)
1.  Open your MySQL Client (Workbench or Command Line).
2.  Create the database:
    ```sql
    CREATE DATABASE messaging_app_db;
    ```
    *(The `users` table will be created automatically by the backend upon start.)*

### 2. Blockchain Setup (Ganache)
1.  Open **Ganache**.
2.  Create a "Quick Start" workspace.
3.  Ensure the **RPC Server** is running on `http://127.0.0.1:7545`.
4.  Leave this window open.

### 3. Smart Contract Deployment
1.  Open [Remix IDE](https://remix.ethereum.org/) in your browser.
2.  Copy the code from `backend/contracts/Identity.sol` into Remix.
3.  **Compile:** Use Compiler version **0.8.19** (to avoid "PUSH0" errors with Ganache).
4.  **Deploy:**
    * Set Environment to **Dev - Ganache Provider** (`http://127.0.0.1:7545`).
    * Deploy the `Identity` contract.
5.  **Copy Data:**
    * Copy the **Contract Address** (e.g., `0x123...`).
    * Copy the **ABI** (from the Compiler tab).

### 4. Backend Configuration
1.  Navigate to the `backend` folder:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  **Update Contract ABI:**
    * Open `backend/build/Identity.json`.
    * Paste the ABI copied from Remix:
        ```json
        {
          "abi": [ ... PASTE ABI HERE ... ]
        }
        ```
4.  **Configure Environment:**
    * Create a `.env` file in the `backend/` folder:
        ```env
        PORT=3000
        DB_HOST=localhost
        DB_USER=root
        DB_PASSWORD=your_mysql_password
        DB_NAME=messaging_app_db
        GANACHE_URL=[http://127.0.0.1:7545](http://127.0.0.1:7545)
        CONTRACT_ADDRESS=0x... (Paste Deployed Contract Address)
        SENDER_ADDRESS=0x... (Paste Account 0 Address from Ganache for funding)
        ```
5.  Start the Backend:
    ```bash
    npm start
    ```
    *You should see: "Server is running...", "Connected to MySQL", "Users table verified".*

### 5. Frontend Configuration
1.  Open a new terminal and navigate to `frontend`:
    ```bash
    cd frontend
    ```
2.  **Update Contract Address:**
    * Open `frontend/assets/js/blockchain-client.js`.
    * Update `const CONTRACT_ADDRESS = '0x...';` with your deployed address.
3.  Install the server tool:
    ```bash
    npm install
    ```
4.  Start the Frontend:
    ```bash
    npx serve .
    ```
    *Access the app at the URL provided (usually `http://localhost:3000`).*

---

## 📖 How to Run & Test

1.  **Register User A (Alice):**
    * Go to `/signup.html`.
    * Enter Username: `Alice`, Password: `password123`.
    * Click **Sign Up**. (Wait for wallet generation & blockchain registration).
2.  **Login User A:**
    * Go to `/login.html`.
    * Login with `Alice`.
3.  **Register User B (Bob):**
    * Open a **New Incognito Window** (to simulate a second user).
    * Go to `/signup.html`.
    * Enter Username: `Bob`, Password: `password456`.
    * Login.
4.  **Chat:**
    * In Alice's window, search for `Bob` and click **Add/Chat**.
    * Type a message and click **Send**.
    * Check Bob's window (messages auto-refresh every 3 seconds).
5.  **Verify Blockchain:**
    * Open Ganache -> **Transactions** tab to see the `sendMessage` transaction.
    * The message data is stored on-chain in the format: `DD-MM-YYYY HH:mm "Alice" to "Bob" "Hello"`.

---

## 📂 Project Structure

```text
blockchain-messaging-app/
│
├── backend/                  # Node.js Server
│   ├── config/               # DB & Blockchain connections
│   ├── controllers/          # Auth Logic (Signup/Login)
│   ├── contracts/            # Solidity Smart Contracts
│   ├── build/                # Contract ABIs
│   └── server.js             # Entry Point
│
└── frontend/                 # Client-Side Interface
    ├── assets/
    │   ├── js/               # Logic Scripts
    │   │   ├── auth-client.js       # Login/Decryption
    │   │   ├── blockchain-client.js # Web3 Interaction
    │   │   └── app.js               # Chat UI & Formatting
    │   └── css/              # Styling
    └── *.html                # UI Pages