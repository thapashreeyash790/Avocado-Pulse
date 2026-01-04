
// Wrapper to expose crypto.ts functions as CommonJS for Node.js testing
// This is a simplified version for testing purposes

const RSA_PARAMS = {
    name: "RSA-OAEP",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256",
};

async function generateKeyPair() {
    return await window.crypto.subtle.generateKey(RSA_PARAMS, true, ["encrypt", "decrypt"]);
}

async function exportPublicKey(key) {
    const exported = await window.crypto.subtle.exportKey("spki", key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

async function importPublicKey(keyData) {
    const binaryDer = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));
    return await window.crypto.subtle.importKey("spki", binaryDer, RSA_PARAMS, true, ["encrypt"]);
}

async function encryptForRecipients(text, publicKeys) {
    const encoder = new TextEncoder();
    const aesKey = await window.crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, encoder.encode(text));
    const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
    const eks = {};

    for (const [userId, pubKeyData] of Object.entries(publicKeys)) {
        try {
            const pubKey = await importPublicKey(pubKeyData);
            const encryptedKey = await window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, pubKey, exportedAesKey);
            eks[userId] = btoa(String.fromCharCode(...new Uint8Array(encryptedKey)));
        } catch (err) {
            console.error(`Failed to encrypt for user ${userId}:`, err);
        }
    }

    return JSON.stringify({
        eks,
        iv: btoa(String.fromCharCode(...new Uint8Array(iv))),
        ct: btoa(String.fromCharCode(...new Uint8Array(ciphertext)))
    });
}

async function decryptForMe(payloadStr, myPrivKey, myId) {
    try {
        const payload = JSON.parse(payloadStr);
        const ekData = payload.eks?.[myId] || payload.ek;
        if (!ekData) return payloadStr;

        const encryptedKey = Uint8Array.from(atob(ekData), c => c.charCodeAt(0));
        const iv = Uint8Array.from(atob(payload.iv), c => c.charCodeAt(0));
        const ciphertext = Uint8Array.from(atob(payload.ct), c => c.charCodeAt(0));

        const exportedAesKey = await window.crypto.subtle.decrypt({ name: "RSA-OAEP" }, myPrivKey, encryptedKey);
        const aesKey = await window.crypto.subtle.importKey("raw", exportedAesKey, "AES-GCM", true, ["decrypt"]);

        const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, ciphertext);
        return new TextDecoder().decode(decrypted);
    } catch (e) {
        return payloadStr;
    }
}

module.exports = {
    generateKeyPair,
    exportPublicKey,
    importPublicKey,
    encryptForRecipients,
    decryptForMe
};
