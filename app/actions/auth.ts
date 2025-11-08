'use server';

// Server-side credential validation
const VALID_EMAIL = process.env.AUTH_EMAIL || 'harshavichal08@gmail.com';
const VALID_PASSWORD = process.env.AUTH_PASSWORD || 'Harsh123@';

export async function validateCredentialsServer(email: string, password: string): Promise<boolean> {
  // Server-side validation - credentials are not exposed to client
  return email === VALID_EMAIL && password === VALID_PASSWORD;
}

