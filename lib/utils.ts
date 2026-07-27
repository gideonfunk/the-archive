// Simple UUID v4 generator for anonymous user IDs
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Normalize tag: trim, lowercase, remove leading #, convert to hyphenated slug
export function normalizeTag(tag: string): string {
  return tag
    .trim()
    .replace(/^#/, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/\s+/g, '-') // Convert spaces to hyphens
    .replace(/-+/g, '-') // Collapse repeated hyphens
    .substring(0, 32); // Max 32 chars
}

// Validate tag: check length, word count, reject URLs/emails
export function validateTag(tag: string): { valid: boolean; error?: string } {
  const raw = tag.trim().toLowerCase();
  if (/https?:\/\/|www\.|[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(raw)) {
    return { valid: false, error: 'Tag cannot contain a URL or email address' };
  }
  const normalized = normalizeTag(tag);
  
  if (!normalized) {
    return { valid: false, error: 'Tag cannot be empty' };
  }
  
  if (normalized.length === 0) {
    return { valid: false, error: 'Tag cannot be empty after normalization' };
  }
  
  const wordCount = normalized.split('-').filter(w => w.length > 0).length;
  if (wordCount > 4) {
    return { valid: false, error: 'Tag cannot exceed 4 words' };
  }
  
  return { valid: true };
}

export function isValidAnonymousUserId(value: unknown): value is string {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function toPositiveInteger(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

// Format seconds to MM:SS
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

// Format date for display
export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
