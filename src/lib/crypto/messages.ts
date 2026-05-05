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








/**
 * Encrypts a message using the "Double-Lock" mental model.
 * 
 * @param plaintext - The "How are you?" message from Jason
 * @param recipientPublicKey - Ebuka's Public Padlock (RSA)
 * @param senderPublicKey - Jason's own Public Padlock (RSA)
 */
export async function encryptMessage(
    plaintext: string,
    recipientPublicKey: CryptoKey,
    senderPublicKey: CryptoKey
) {
    //  GENERATE the "Secret Code" (AES Key)
    // This is a one-time-use key just for this specific box.
    const aesKey = await window.crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );

    //  CREATE the "Randomizer" (IV)
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    //  SCRAMBLE the text
    const encoder = new TextEncoder();
    const ciphertextBuffer = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        aesKey,
        encoder.encode(plaintext)
    );

    // EXPORT the "Secret Code" bytes so we can lock them in envelopes
    const rawAesKey = await window.crypto.subtle.exportKey("raw", aesKey);

    //  THE GOLD ENVELOPE (For Ebuka)
    // Lock the Secret Code with Ebuka's Public Padlock
    const encryptedKey = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        recipientPublicKey,
        rawAesKey
    );

    // . THE SILVER ENVELOPE (For Jason/Self)
    // Lock the SAME Secret Code with your own Public Padlock
    const encryptedKeyForSelf = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        senderPublicKey,
        rawAesKey
    );



    // Update the helper at the bottom of encryptMessage
    const fromBuffer = (buf: ArrayBuffer | Uint8Array) => {
        const uint8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
        return btoa(String.fromCharCode(...uint8));
    };

    return {
        ciphertext: fromBuffer(ciphertextBuffer),
        iv: fromBuffer(iv), // Now this will accept the Uint8Array perfectly
        encryptedKey: fromBuffer(encryptedKey),
        encryptedKeyForSelf: fromBuffer(encryptedKeyForSelf)
    };


}