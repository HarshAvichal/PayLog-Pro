import { redirect } from 'next/navigation';

/**
 * Validate access key from route segment
 */
export function validateAccessKey(accessKey: string | string[] | undefined): string {
  const expectedKey = process.env.ACCESS_KEY;
  
  if (!expectedKey) {
    throw new Error('ACCESS_KEY environment variable is not set');
  }

  const key = Array.isArray(accessKey) ? accessKey[0] : accessKey;

  if (!key || key !== expectedKey) {
    redirect('/not-found');
  }

  return key;
}

/**
 * Get access key from pathname
 */
export function getAccessKeyFromPath(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean);
  const expectedKey = process.env.ACCESS_KEY;
  
  if (!expectedKey || parts.length === 0) {
    return null;
  }

  // First segment should be the access key
  if (parts[0] === expectedKey) {
    return expectedKey;
  }

  return null;
}

