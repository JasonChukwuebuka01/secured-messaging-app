/**
 * 1. GENERATE RSA KEYS
 * RSA-OAEP 2048-bit as per backend requirements.
 */
export async function generateUserKeyPair() {
    return await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
    );
}

/**
 * 2. EXPORT PUBLIC KEY
 * Converts the RSA padlock to a Base64 string for the server.
 */
export async function exportPublicKey(key: CryptoKey) {
    const exported = await window.crypto.subtle.exportKey("spki", key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

/**
 * 3. DERIVE WRAPPING KEY (AES-KW)
 * Turns password + 128-bit salt into a 256-bit AES-KW wrapping key.
 */
export async function deriveWrappingKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const baseKey = await window.crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    return await window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256",
        } as Pbkdf2Params,
        baseKey,
        { name: "AES-KW", length: 256 },
        false,
        ["wrapKey", "unwrapKey"]
    );
}

/**
 * 4. WRAP PRIVATE KEY
 * Encrypts the private key using AES-KW before sending to the server.
 */
export async function wrapPrivateKey(
    privateKey: CryptoKey,
    wrappingKey: CryptoKey
): Promise<ArrayBuffer> {
    return await window.crypto.subtle.wrapKey(
        "pkcs8",
        privateKey,
        wrappingKey,
        "AES-KW"
    );
}