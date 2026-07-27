import { generateUUID } from './utils';

const ANONYMOUS_USER_ID_KEY = 'anonymous_user_id';

// Get or create anonymous user ID from localStorage
export function getOrCreateAnonymousUserId(): string {
  if (typeof window === 'undefined') return '';
  
  let userId = localStorage.getItem(ANONYMOUS_USER_ID_KEY);
  
  if (!userId) {
    userId = generateUUID();
    localStorage.setItem(ANONYMOUS_USER_ID_KEY, userId);
  }
  
  return userId;
}

// Get existing anonymous user ID (returns null if not exists)
export function getAnonymousUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ANONYMOUS_USER_ID_KEY);
}

// Clear anonymous user ID (for testing or privacy)
export function clearAnonymousUserId(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ANONYMOUS_USER_ID_KEY);
}
