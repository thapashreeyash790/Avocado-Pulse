
const { webcrypto } = require('node:crypto');

// Polyfill global environment for the wrapped service if needed
global.window = { crypto: webcrypto };
global.crypto = webcrypto;
global.atob = (str) => Buffer.from(str, 'base64').toString('binary');
global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const cryptoService = require("./crypto_wrapped.js");

async function testCrypto() {
    console.log("--- Starting Crypto Service Test (Native WebCrypto) ---");
    try {
        // 1. Generate Key Pair
        console.log("Generating key pair...");
        const keyPair = await cryptoService.generateKeyPair();
        console.log("✅ Key pair generated.");

        // 2. Export/Import Public Key
        console.log("Testing Public Key Export/Import...");
        const pubKeyStr = await cryptoService.exportPublicKey(keyPair.publicKey);
        const importedPubKey = await cryptoService.importPublicKey(pubKeyStr);
        console.log("✅ Public Key Export/Import successful.");

        // 3. Encrypt/Decrypt
        console.log("Testing Encryption/Decryption...");
        const originalText = "Hello, this is a secret message!";
        const publicKeys = { "user-1": pubKeyStr };

        const encrypted = await cryptoService.encryptForRecipients(originalText, publicKeys);
        console.log("✅ Encryption successful.");

        const decrypted = await cryptoService.decryptForMe(encrypted, keyPair.privateKey, "user-1");
        console.log("Decrypted text:", decrypted);

        if (decrypted === originalText) {
            console.log("✅ Decryption successful. Matches original!");
        } else {
            console.error("❌ Decryption failed. Content mismatch.");
        }

    } catch (err) {
        console.error("❌ Test failed with error:", err);
    }
}

testCrypto();
