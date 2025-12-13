/**
 * Utility script to generate SHA-256 hashes for user passwords
 * Run this script to generate proper hashes for the hardcoded users
 */

const crypto = require('crypto');

function generateHash(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Generate hashes for all users
const passwords = {
  // Vijayawada users
  'vja1': 'Act@VJA1',
  'vja2': 'Act@VJA2',
  'vja3': 'Act@VJA3',
  'vja4': 'Act@VJA4',
  
  // Nellore users
  'nel1': 'Act@NEL1',
  'nel2': 'Act@NEL2',
  'nel3': 'Act@NEL3',
  'nel4': 'Act@NEL4',
  
  // Visakhapatnam users
  'vsk1': 'Act@VSK1',
  'vsk2': 'Act@VSK2',
  'vsk3': 'Act@VSK3',
  'vsk4': 'Act@VSK4',
  
  // Admin user
  'Rafeeq': 'Source@826459'
};

console.log('Generated SHA-256 hashes:');
console.log('========================');

for (const [username, password] of Object.entries(passwords)) {
  const hash = generateHash(password);
  console.log(`${username}: ${hash} // ${password}`);
}