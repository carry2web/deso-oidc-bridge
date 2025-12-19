import { generateKeyPair, exportJWK } from 'jose';

let keyPair = null;

/**
 * Generate or retrieve RSA key pair for JWT signing
 */
export async function getKeyPair() {
  if (!keyPair) {
    const { publicKey, privateKey } = await generateKeyPair('RS256');
    const publicJWK = await exportJWK(publicKey);
    const privateJWK = await exportJWK(privateKey);
    
    publicJWK.kid = 'default';
    publicJWK.use = 'sig';
    publicJWK.alg = 'RS256';
    
    keyPair = { publicKey: publicJWK, privateKey: privateJWK };
    console.log('✓ Generated RSA key pair');
  }
  
  return keyPair;
}
