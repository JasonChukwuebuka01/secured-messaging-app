
## WhisperBox: End-to-End Encrypted Messaging
WhisperBox is a high-security, real-time messaging platform designed to provide privacy through robust End-to-End Encryption (E2EE). By leveraging the Web Crypto API, WhisperBox ensures that only the sender and intended recipient can read the contents of a message, making it impossible for the server or any third party to intercept communications.



## Architecture Overview
The application is built on a modern full-stack architecture focusing on scalability and security:

Front-end: Developed with Next.js, React, and TypeScript.

Back-end: WhisperBox Powered API handling authentication, user discovery, and message routing.

Real-time: Powered by WebSockets for instantaneous message delivery.

Security: Native browser Web Crypto API (AES-GCM, RSA-OAEP, AES-KW).


## Encryption Flow
WhisperBox follows a rigorous process to ensure every "whisper" stays private:

- Key Generation: Upon registration, a unique RSA-2048 key pair is generated in the user's browser.

- Encryption: When a message is sent, the sender fetches the recipient’s Public Key. A random AES-256 symmetric key is generated to encrypt the message body.

- Encapsulation: The symmetric key is then encrypted using the recipient's Public Key.

- Transport: The server receives the encrypted message and the encrypted key. The server cannot decrypt either.

- Decryption: The recipient uses their Private Key (unwrapped in the session) to decrypt the symmetric key, which in turn decrypts the message.


## Key Management

Security at rest is just as important as security in transit. WhisperBox uses a tiered key management strategy:

Public Keys : Stored on the Koyeb-hosted database for user discovery.

Wrapped Private Keys: To allow multi-device access (future) or session restoration, the Private Key is wrapped (encrypted) using an AES-KW "Wrapping Key" derived from a temporary secret and stored on the server.

The Vault: During a session, the private key is unwrapped and held in memory. This is indicated in the UI as the Vault Secured status.



## Security Trade-offs

Performance vs. Security: We chose RSA-2048 for compatibility and security. While ECC (Elliptic Curve) is faster, RSA remains a battle-tested standard for E2EE implementations.

Client-Side Weight: All encryption happens on the client. This increases CPU usage slightly but removes the server as a point of failure for privacy.

Session-Based Unwrapping: We use sessionStorage for the wrapping key rather than localStorage to ensure the "Vault" is cleared as soon as the tab is closed, mitigating risk if a physical device is stolen.

Known Limitations
No Forward Secrecy (Currently): The current version uses a static RSA key pair. If a private key is ever compromised, past messages could theoretically be decrypted.

Group Chats: Currently optimized for 1:1 messaging. Group encryption requires a more complex "Group Key" management system.

Metadata: While message content is encrypted, the server still knows who is talking to whom and at what time.

## Getting Started
1. Clone the repository
git clone [https://github.com/your-repo/whisperbox.git](https://github.com/your-repo/whisperbox.git)

2. Install dependencies

npm install


3. Run the development server
npm run dev

4. Build for production
npm run build