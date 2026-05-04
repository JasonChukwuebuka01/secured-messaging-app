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
export async function savePrivateKey(key: CryptoKey) {
    const db = await initVault();
    // We store it under the name 'user-private-key'
    await db.put(STORE_NAME, key, 'user-private-key');
}

/**
 * GET_PRIVATE_KEY
 * Reaching into the safe to grab the key when we need to unlock a message.
 */
export async function getPrivateKey(): Promise<CryptoKey | undefined> {
    const db = await initVault();
    return db.get(STORE_NAME, 'user-private-key');
}