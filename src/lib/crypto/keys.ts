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
 * Helper to add PKCS#7-style padding for AES-KW (8-byte alignment)
 */
function pad(data: Uint8Array): Uint8Array {
    const padLen = 8 - (data.length % 8);
    const padded = new Uint8Array(data.length + padLen);
    padded.set(data);
    for (let i = data.length; i < padded.length; i++) {
        padded[i] = padLen;
    }
    return padded;
}


/**
 * 4. WRAP PRIVATE KEY (Requirement: AES-KW)
 * Fixed to satisfy both Browser and Backend requirements.
 */
export async function wrapPrivateKey(
    privateKey: CryptoKey,
    wrappingKey: CryptoKey
): Promise<ArrayBuffer> {
    // 1. Export the RSA key to pkcs8 bytes
    const exported = await window.crypto.subtle.exportKey("pkcs8", privateKey);

    // 2. Pad to 8-byte alignment (Required for AES-KW)
    const paddedBytes = pad(new Uint8Array(exported));

    // 3. THE FIX: Import as 'hmac' so the browser allows any length 
    // and treats it as a "SecretKey" suitable for wrapping.
    const genericKey = await window.crypto.subtle.importKey(
        "raw",
        paddedBytes.buffer as ArrayBuffer,
        { name: "HMAC", hash: "SHA-256" },
        true,
        ["verify"] // Dummy usage
    );

    // 4. WRAP with AES-KW
    // This produces the EXACT blob your backend expects.
    return await window.crypto.subtle.wrapKey(
        "raw",
        genericKey,
        wrappingKey,
        "AES-KW"
    );
}






/**
 * Unwraps (decrypts) an RSA private key using a derived AES wrapping key.
 * @param wrappedKeyBuffer The encrypted private key bytes from the server.
 * @param wrappingKey The AES-GCM key derived from the user's password.
 * @returns The decrypted CryptoKey (RSA-OAEP).
 */
/**
 * 5. UNWRAP PRIVATE KEY
 * Mirrored to match the wrapPrivateKey logic (AES-KW).
 */
/**
 * 5. UNWRAP PRIVATE KEY
 * Mirrored to match the wrapPrivateKey logic (AES-KW).
 */
export async function unwrapPrivateKey(
    wrappedKeyBuffer: Uint8Array,
    wrappingKey: CryptoKey
): Promise<CryptoKey> {
    // 1. Unwrap the "Generic" key first
    // Use .buffer to satisfy 'BufferSource' requirement
    const unwrappedGenericKey = await window.crypto.subtle.unwrapKey(
        "raw",
        wrappedKeyBuffer.buffer as ArrayBuffer,
        wrappingKey,
        "AES-KW",
        { name: "HMAC", hash: "SHA-256" },
        true,
        ["verify"]
    );

    // 2. Export the raw bytes (which are the padded PKCS8 bytes)
    const paddedBytes = await window.crypto.subtle.exportKey("raw", unwrappedGenericKey);

    // 3. Remove PKCS7 padding to get the original PKCS8
    const bytes = new Uint8Array(paddedBytes);
    const padLen = bytes[bytes.length - 1];
    const originalPkcs8 = bytes.slice(0, bytes.length - padLen);

    // 4. Final Import as the actual RSA Private Key
    return await window.crypto.subtle.importKey(
        "pkcs8",
        originalPkcs8.buffer as ArrayBuffer,
        {
            name: "RSA-OAEP",
            hash: "SHA-256"
        },
        true,
        ["decrypt"]
    );
}