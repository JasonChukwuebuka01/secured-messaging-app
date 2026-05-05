/**
 * Decrypts a message using the "Double-Lock" mental model.
 * 
 * @param ciphertext - The scrambled message text (Base64)
 * @param iv - The initialization vector (Base64)
 * @param encryptedAESKey - The "Secret Code" locked in the gold/silver envelope (Base64)
 * @param privateKey - Your RSA Private Key (the "Physical Key" you kept safe)
 */
export async function decryptMessage(
    ciphertext: string,
    iv: string,
    encryptedAESKey: string,
    privateKey: CryptoKey
): Promise<string> {
    // Convert Base64 strings back into raw bytes (Uint8Array)
    const toUint8Array = (base64: string) => Uint8Array.from(atob(base64), c => c.charCodeAt(0));

    const ciphertextBytes = toUint8Array(ciphertext);
    const ivBytes = toUint8Array(iv);
    const encryptedKeyBytes = toUint8Array(encryptedAESKey);

    //  UNWRAP: Use your RSA Private Key to unlock the "Secret Code" (AES Key)
    // This is like Jason using his physical key to open the silver envelope.
    const aesKeyBuffer = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKey,
        encryptedKeyBytes
    );

    //  IMPORT: Tell the browser to treat those unlocked bytes as a new AES key
    const aesKey = await window.crypto.subtle.importKey(
        "raw",
        aesKeyBuffer,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
    );

    // DECRYPT: Use the unlocked AES key to unscramble the actual message
    // This turns "XyZ#123" back into "How are you?"
    const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: ivBytes },
        aesKey,
        ciphertextBytes
    );

    //  DECODE: Convert the final bytes back into a human-readable string
    return new TextDecoder().decode(decryptedBuffer);
}