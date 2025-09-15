/**
 * URL utility functions
 */

/**
 * Check if the input is a URL
 * 
 * @param input - String to check
 * @returns true if input appears to be a URL
 */
export function isURL(input: string): boolean {
  // Check for common URL patterns
  if (input.startsWith('http://') || input.startsWith('https://') || input.startsWith('ftp://')) {
    return true;
  }
  
  // Check if it looks like a URL (contains protocol)
  if (input.includes('://')) {
    try {
      new URL(input);
      return true;
    } catch {
      return false;
    }
  }
  
  return false;
}

/**
 * Check if a URL is accessible (makes a HEAD request)
 * 
 * @param url - URL to check
 * @returns Promise<boolean> - true if accessible, false otherwise
 */
export async function isURLAccessible(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get the file extension from a URL
 * 
 * @param url - URL to extract extension from
 * @returns file extension (without dot) or null if not found
 */
export function getURLExtension(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const lastDot = pathname.lastIndexOf('.');
    
    if (lastDot === -1 || lastDot === pathname.length - 1) {
      return null;
    }
    
    return pathname.substring(lastDot + 1).toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Check if a URL points to a compressed file
 * 
 * @param url - URL to check
 * @returns true if URL points to a compressed file
 */
export function isCompressedURL(url: string): boolean {
  const extension = getURLExtension(url);
  return extension !== null && ['gz', 'tar', 'tar.gz', 'tar.xz', 'zip', 'bz2'].includes(extension);
}

/**
 * Normalize a URL by removing trailing slashes and query parameters
 * 
 * @param url - URL to normalize
 * @returns normalized URL
 */
export function normalizeURL(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove trailing slash from pathname
    if (urlObj.pathname.endsWith('/') && urlObj.pathname.length > 1) {
      urlObj.pathname = urlObj.pathname.slice(0, -1);
    }
    return urlObj.toString();
  } catch {
    return url;
  }
}
