import { KioskUser, AdminUser } from '@/types/auth';

/**
 * Hardcoded kiosk users for each geographic cluster
 * Passwords are hashed using SHA-256 for security
 * 
 * Default passwords for development:
 * - vja_user1: "vijayawada1"
 * - vja_user2: "vijayawada2" 
 * - vja_user3: "vijayawada3"
 * - vja_user4: "vijayawada4"
 * - nel_user1: "nellore1"
 * - nel_user2: "nellore2"
 * - nel_user3: "nellore3"
 * - nel_user4: "nellore4"
 * - vsk_user1: "visakhapatnam1"
 * - vsk_user2: "visakhapatnam2"
 * - vsk_user3: "visakhapatnam3"
 * - vsk_user4: "visakhapatnam4"
 */
export const KIOSK_USERS: KioskUser[] = [
  // Vijayawada Users
  { 
    username: 'vja1', 
    passwordHash: '44db661ae10d2519b8fb3bf962d878b8cecd84b1252f1c60f480f9fa2d9d7282', // Act@VJA1
    cluster: 'Vijayawada', 
    displayName: 'Vijayawada Kiosk 1' 
  },
  { 
    username: 'vja2', 
    passwordHash: '90ed518163fb18dc9a2c949d1cfb06243124e51419e1bf9acc353f596d0434ff', // Act@VJA2
    cluster: 'Vijayawada', 
    displayName: 'Vijayawada Kiosk 2' 
  },
  { 
    username: 'vja3', 
    passwordHash: 'd652aa6e0473e98d25720fb1cce363bf6077bc655541e22bad76a03c23b7967a', // Act@VJA3
    cluster: 'Vijayawada', 
    displayName: 'Vijayawada Kiosk 3' 
  },
  { 
    username: 'vja4', 
    passwordHash: 'd548c7c6739bca9e03c752bae98e4677e200eb9f1f51968ab2f9015c5ea4a67a', // Act@VJA4
    cluster: 'Vijayawada', 
    displayName: 'Vijayawada Kiosk 4' 
  },
  
  // Nellore Users
  { 
    username: 'nel1', 
    passwordHash: '465a06e57fd69b460e7026f90fe95bd2d3cdda85c84cd2e33ea1163c42f0bf6e', // Act@NEL1
    cluster: 'Nellore', 
    displayName: 'Nellore Kiosk 1' 
  },
  { 
    username: 'nel2', 
    passwordHash: '36c931fe65d9b168f9430b5931655e6b61b8e7fb092e3e14a2d333adf2f8b8d6', // Act@NEL2
    cluster: 'Nellore', 
    displayName: 'Nellore Kiosk 2' 
  },
  { 
    username: 'nel3', 
    passwordHash: 'fd802781dae5c5a9bb295d52631aab0d29a60d3bd20a26df99188207f531603c', // Act@NEL3
    cluster: 'Nellore', 
    displayName: 'Nellore Kiosk 3' 
  },
  { 
    username: 'nel4', 
    passwordHash: 'e35c983f3f2cfe51f03e625d35897a2745c7a4f923ae957ce896372371e9bbc3', // Act@NEL4
    cluster: 'Nellore', 
    displayName: 'Nellore Kiosk 4' 
  },
  
  // Visakhapatnam Users
  { 
    username: 'vsk1', 
    passwordHash: '4b3093bac182c6ec81335a9d44a862762645eeafccb61cbe8dc8569ec5b5b8ea', // Act@VSK1
    cluster: 'Visakhapatnam', 
    displayName: 'Visakhapatnam Kiosk 1' 
  },
  { 
    username: 'vsk2', 
    passwordHash: 'e890128d65de124713281c78b159b7b862637f12522623e751792b2e53a7b999', // visakhapatnam2
    cluster: 'Visakhapatnam', 
    displayName: 'Visakhapatnam Kiosk 2' 
  },
  { 
    username: 'vsk3', 
    passwordHash: 'eb884e581916fef586c436a137b6b0984c2ff670532f767450480d08c64258ab', // Act@VSK3
    cluster: 'Visakhapatnam', 
    displayName: 'Visakhapatnam Kiosk 3' 
  },
  { 
    username: 'vsk4', 
    passwordHash: 'd8fe96399342531acdb30b5c156d5ddfd4974c91f5b25accda1b585b978fafe5', // Act@VSK4
    cluster: 'Visakhapatnam', 
    displayName: 'Visakhapatnam Kiosk 4' 
  }
];

/**
 * Hardcoded admin user
 * Default password for development: "admin123"
 */
export const ADMIN_USER: AdminUser = {
  username: 'Rafeeq',
  passwordHash: '5301ca59de4828834d97bc542b738f7a7f160bed61e81858f5371ac440181803', // Source@826459
  role: 'admin'
};

/**
 * Find a kiosk user by username
 */
export function findKioskUser(username: string): KioskUser | undefined {
  return KIOSK_USERS.find(user => user.username === username);
}

/**
 * Find admin user by username
 */
export function findAdminUser(username: string): AdminUser | undefined {
  return username === ADMIN_USER.username ? ADMIN_USER : undefined;
}

/**
 * Get all users for a specific cluster
 */
export function getUsersByCluster(cluster: string): KioskUser[] {
  return KIOSK_USERS.filter(user => user.cluster === cluster);
}