
// End-to-End Encryption Service using Web Crypto API (Hybrid RSA + AES)

const RSA_PARAMS = {
    name: "RSA-OAEP",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256",
};

export async function generateKeyPair() {
    return await window.crypto.subtle.generateKey(RSA_PARAMS, true, ["encrypt", "decrypt"]);
}

export async function exportPublicKey(key: CryptoKey) {
    const exported = await window.crypto.subtle.exportKey("spki", key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

export async function importPublicKey(keyData: string) {
    const binaryDer = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));
    return await window.crypto.subtle.importKey("spki", binaryDer, RSA_PARAMS, true, ["encrypt"]);
}

export async function exportPrivateKey(key: CryptoKey) {
    const exported = await window.crypto.subtle.exportKey("pkcs8", key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

export async function importPrivateKey(keyData: string) {
    const binaryDer = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));
    return await window.crypto.subtle.importKey("pkcs8", binaryDer, RSA_PARAMS, true, ["decrypt"]);
}

// Full Encrypted Payload: { encryptedKey: RSA(AES_KEY), iv: IV, ciphertext: AES(MESSAGE) }
export async function encryptForRecipient(text: string, recipientPubKeyData: string) {
    const pubKey = await importPublicKey(recipientPubKeyData);
    const encoder = new TextEncoder();

    // 1. Generate AES Key and IV
    const aesKey = await window.crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // 2. Encrypt Text with AES
    const ciphertext = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, encoder.encode(text));

    // 3. Encrypt AES Key with Recipient's RSA Public Key
    const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
    const encryptedKey = await window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, pubKey, exportedAesKey);

    return JSON.stringify({
        ek: btoa(String.fromCharCode(...new Uint8Array(encryptedKey))),
        iv: btoa(String.fromCharCode(...new Uint8Array(iv))),
        ct: btoa(String.fromCharCode(...new Uint8Array(ciphertext)))
    });
}

export async function decryptForMe(payloadStr: string, myPrivKey: CryptoKey) {
    try {
        const payload = JSON.parse(payloadStr);
        const encryptedKey = Uint8Array.from(atob(payload.ek), c => c.charCodeAt(0));
        const iv = Uint8Array.from(atob(payload.iv), c => c.charCodeAt(0));
        const ciphertext = Uint8Array.from(atob(payload.ct), c => c.charCodeAt(0));

        // 1. Decrypt AES Key using my Private Key
        const exportedAesKey = await window.crypto.subtle.decrypt({ name: "RSA-OAEP" }, myPrivKey, encryptedKey);
        const aesKey = await window.crypto.subtle.importKey("raw", exportedAesKey, "AES-GCM", true, ["decrypt"]);

        // 2. Decrypt Content using AES Key
        const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, ciphertext);
        return new TextDecoder().decode(decrypted);
    } catch (e) {
        console.error("Decryption failed", e);
        return payloadStr; // Return raw if failed (might be an old unencrypted message)
    }
}
