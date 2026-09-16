/**
 * Utility functions for normalizing, transforming, and validating image URLs
 * across GramSeva, including auto-converting Google Drive share links into
 * direct image CDN URLs.
 */

/**
 * Checks if a given string is a Google Drive URL.
 */
export function isGoogleDriveUrl(url: string): boolean {
  if (!url) return false;
  return /drive\.google\.com\/(?:file\/d\/|(?:open|uc)\?(?:.*&)?id=)/i.test(url.trim());
}

/**
 * Extracts Google Drive file ID if present in the URL.
 */
export function extractGoogleDriveFileId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // Pattern 1: https://drive.google.com/file/d/FILE_ID/view...
  const matchFileD = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (matchFileD && matchFileD[1]) return matchFileD[1];

  // Pattern 2: https://drive.google.com/open?id=FILE_ID or uc?id=FILE_ID
  const matchIdParam = trimmed.match(/drive\.google\.com\/(?:open|uc)\?(?:.*&)?id=([a-zA-Z0-9_-]+)/i);
  if (matchIdParam && matchIdParam[1]) return matchIdParam[1];

  return null;
}

/**
 * Normalizes any image URL.
 * Automatically transforms Google Drive share links into Google's direct CDN endpoint
 * (https://lh3.googleusercontent.com/d/FILE_ID) which renders reliably in <img> tags.
 * Also handles Dropbox share links (?dl=0 -> ?raw=1).
 */
export function normalizeImageUrl(rawUrl: string): string {
  if (!rawUrl) return "";
  const trimmed = rawUrl.trim();

  // 1. Google Drive URL transform
  const driveFileId = extractGoogleDriveFileId(trimmed);
  if (driveFileId) {
    // lh3.googleusercontent.com/d/{id} is Google's direct image CDN
    return `https://lh3.googleusercontent.com/d/${driveFileId}`;
  }

  // 2. Dropbox URL transform
  if (trimmed.includes("dropbox.com") && trimmed.includes("dl=0")) {
    return trimmed.replace("dl=0", "raw=1");
  }

  return trimmed;
}

/**
 * Simple format validator for HTTP/HTTPS image URLs or local API file URLs.
 */
export function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/api/files/")
  );
}
