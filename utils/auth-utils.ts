/**
 * SHA-256 password hashing utility functions for authentication
 */

/**
 * Pure JavaScript SHA-256 implementation for non-secure contexts
 * This produces the same output as crypto.subtle.digest('SHA-256', ...)
 */
function sha256JS(message: string): string {
  // SHA-256 constants
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  // Initial hash values
  let H = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  // Helper functions
  const ROTR = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  const Ch = (x: number, y: number, z: number) => (x & y) ^ (~x & z);
  const Maj = (x: number, y: number, z: number) => (x & y) ^ (x & z) ^ (y & z);
  const Sigma0 = (x: number) => ROTR(x, 2) ^ ROTR(x, 13) ^ ROTR(x, 22);
  const Sigma1 = (x: number) => ROTR(x, 6) ^ ROTR(x, 11) ^ ROTR(x, 25);
  const sigma0 = (x: number) => ROTR(x, 7) ^ ROTR(x, 18) ^ (x >>> 3);
  const sigma1 = (x: number) => ROTR(x, 17) ^ ROTR(x, 19) ^ (x >>> 10);

  // Convert string to bytes
  const bytes: number[] = [];
  for (let i = 0; i < message.length; i++) {
    const code = message.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0x10000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      bytes.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    }
  }

  // Padding
  const bitLength = bytes.length * 8;
  bytes.push(0x80);
  while ((bytes.length % 64) !== 56) {
    bytes.push(0);
  }
  
  // Append length as 64-bit big-endian
  for (let i = 7; i >= 0; i--) {
    bytes.push((bitLength / Math.pow(2, i * 8)) & 0xff);
  }

  // Process each 512-bit block
  for (let blockStart = 0; blockStart < bytes.length; blockStart += 64) {
    const W: number[] = new Array(64);
    
    // Prepare message schedule
    for (let t = 0; t < 16; t++) {
      W[t] = (bytes[blockStart + t * 4] << 24) |
             (bytes[blockStart + t * 4 + 1] << 16) |
             (bytes[blockStart + t * 4 + 2] << 8) |
             (bytes[blockStart + t * 4 + 3]);
    }
    for (let t = 16; t < 64; t++) {
      W[t] = (sigma1(W[t - 2]) + W[t - 7] + sigma0(W[t - 15]) + W[t - 16]) >>> 0;
    }

    // Initialize working variables
    let [a, b, c, d, e, f, g, h] = H;

    // Main loop
    for (let t = 0; t < 64; t++) {
      const T1 = (h + Sigma1(e) + Ch(e, f, g) + K[t] + W[t]) >>> 0;
      const T2 = (Sigma0(a) + Maj(a, b, c)) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + T1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (T1 + T2) >>> 0;
    }

    // Update hash values
    H = [
      (H[0] + a) >>> 0,
      (H[1] + b) >>> 0,
      (H[2] + c) >>> 0,
      (H[3] + d) >>> 0,
      (H[4] + e) >>> 0,
      (H[5] + f) >>> 0,
      (H[6] + g) >>> 0,
      (H[7] + h) >>> 0
    ];
  }

  // Convert to hex string
  return H.map(h => h.toString(16).padStart(8, '0')).join('');
}

/**
 * Check if crypto.subtle is available
 */
function isCryptoAvailable(): boolean {
  return typeof crypto !== 'undefined' && 
         crypto.subtle !== undefined && 
         typeof crypto.subtle.digest === 'function';
}

/**
 * Generates SHA-256 hash of a password string
 * Uses crypto.subtle when available, falls back to pure JS implementation
 * @param password - Plain text password
 * @returns Promise<string> - SHA-256 hash in hexadecimal format
 */
export async function hashPassword(password: string): Promise<string> {
  // Check if we're in a secure context with crypto.subtle available
  if (isCryptoAvailable()) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    } catch (error) {
      console.warn('crypto.subtle failed, using pure JS SHA-256:', error);
      return sha256JS(password);
    }
  }
  
  // Fallback to pure JavaScript SHA-256 implementation
  console.warn('crypto.subtle not available, using pure JS SHA-256');
  return sha256JS(password);
}

/**
 * Verifies a password against a stored hash
 * @param password - Plain text password to verify
 * @param storedHash - Stored SHA-256 hash to compare against
 * @returns Promise<boolean> - True if password matches hash
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === storedHash;
}

/**
 * Generates a SHA-256 hash for development/setup purposes
 * This function can be used to generate hashes for hardcoded users
 * @param password - Plain text password
 * @returns Promise<string> - SHA-256 hash
 */
export async function generateHashForPassword(password: string): Promise<string> {
  return await hashPassword(password);
}