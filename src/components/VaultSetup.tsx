'use client';

import { useState } from 'react';
import { generateUserKeyPair, exportPublicKey } from '@/lib/crypto/keys';
import { savePrivateKey } from '@/lib/crypto/storage';

export default function VaultSetup() {

  const [status, setStatus] = useState<'idle' | 'generating' | 'success'>('idle');

  
  const handleSetup = async () => {
    setStatus('generating');
    
    // 1. Generate the Metal Lock & Key
    const keyPair = await generateUserKeyPair();
    
    // 2. Bolt the Private Key into the browser's safe
    await savePrivateKey(keyPair.privateKey);
    
    // 3. Turn the Public Key into a string (for the server later)
    const publicKeyString = await exportPublicKey(keyPair.publicKey);
    
    console.log("Public Key for Server:", publicKeyString);
    setStatus('success');
  };

  return (
    <div className="bg-vault-card p-8 rounded-2xl border border-white/10 shadow-2xl max-w-md w-full">
      <h2 className="text-2xl font-bold mb-4">Initialize Your Vault</h2>
      <p className="text-gray-400 text-sm mb-6">
        This will generate your unique encryption keys. Your private key never leaves this device.
      </p>

      {status === 'success' ? (
        <div className="text-security-ok flex items-center gap-2 font-medium">
          <span className="w-2 h-2 rounded-full bg-security-ok" />
          Vault Secured & Keys Stored
        </div>
      ) : (
        <button
          onClick={handleSetup}
          disabled={status === 'generating'}
          className="w-full bg-brand hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50"
        >
          {status === 'generating' ? 'Generating Magic...' : 'Generate Secure Keys'}
        </button>
      )}
    </div>
  );
}