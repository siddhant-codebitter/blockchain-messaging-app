// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Identity {
    // Mapping: Username -> Ethereum Address
    mapping(string => address) private usernameToAddress;
    mapping(string => bool) private usernameExists;

    // --- NEW: Message Storage ---
    struct Message {
        string encryptedContent; // Stores the "Date... Sender... Text" string
        uint256 timestamp;
        address otherParty; // The person you were talking to
    }

    // Stores messages for each user (Address => List of Messages)
    mapping(address => Message[]) private userMessages;

    event UserRegistered(string username, address indexed userAddress);
    event MessageStored(address indexed sender, address indexed receiver);

    function register(string memory _username) public {
        require(!usernameExists[_username], "Username already exists");
        require(bytes(_username).length > 0, "Username cannot be empty");

        usernameToAddress[_username] = msg.sender;
        usernameExists[_username] = true;

        emit UserRegistered(_username, msg.sender);
    }

    function getAddressByUsername(string memory _username) public view returns (address) {
        return usernameToAddress[_username];
    }

    // --- NEW: Store Message Function ---
    // Stores the encrypted string for BOTH the sender and the receiver
    function sendMessage(address _receiver, string memory _encryptedContent) public {
        
        // 1. Save for Sender (so they can see what they sent)
        userMessages[msg.sender].push(Message({
            encryptedContent: _encryptedContent,
            timestamp: block.timestamp,
            otherParty: _receiver
        }));

        // 2. Save for Receiver (so they can see what they received)
        userMessages[_receiver].push(Message({
            encryptedContent: _encryptedContent,
            timestamp: block.timestamp,
            otherParty: msg.sender
        }));

        emit MessageStored(msg.sender, _receiver);
    }

    // --- NEW: Retrieve Messages ---
    function getMyMessages() public view returns (Message[] memory) {
        return userMessages[msg.sender];
    }
}