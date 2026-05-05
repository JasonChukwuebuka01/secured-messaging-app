import { openDB } from 'idb';

const DB_NAME = 'whisper-box-vault';
const STORE_NAME = 'keys';

/**
 * OPENS THE SAFE
 * Creates the database if it doesn't exist.
 */
export async function initVault() {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        },
    });
}

/**
 * SAVE_PRIVATE_KEY
 * Bolting the physical key into the floor of the browser.
 */
export async function saveVault(wrappedKey: ArrayBuffer, salt: Uint8Array) {
    const db = await initVault();
    // Save the wrapped key and salt separately so we can retrieve them at login
    await db.put(STORE_NAME, wrappedKey, 'wrapped-private-key');
    await db.put(STORE_NAME, salt, 'registration-salt');
}

/**
 * GET_PRIVATE_KEY
 * Reaching into the safe to grab the key when we need to unlock a message.
 */
export async function getVaultData() {
    const db = await initVault();
    const wrappedKey = await db.get(STORE_NAME, 'wrapped-private-key');
    const salt = await db.get(STORE_NAME, 'registration-salt');
    return { wrappedKey, salt };
}