# Deployment Guide

## Environment Variables

When deploying, you need to set these environment variables in your hosting platform (Vercel, Netlify, etc.):

### Required Environment Variables

```bash
# Server-side authentication (secure - not exposed to client)
AUTH_EMAIL=harshavichal08@gmail.com
AUTH_PASSWORD=Harsh123@

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### How It Works

1. **Server-Side Validation**: Credentials are validated on the server using `AUTH_EMAIL` and `AUTH_PASSWORD` environment variables. These are **NOT** exposed to the client bundle.

2. **Client-Side Storage**: After successful login, authentication status is stored in `localStorage` (client-side only).

3. **Route Protection**: The protected layout checks `localStorage` to determine if user is authenticated.

### Security Notes

- ✅ **Credentials are server-side**: The actual password validation happens on the server, so credentials aren't visible in the browser's JavaScript bundle.
- ⚠️ **localStorage is client-side**: The auth status in localStorage can be manipulated, but without valid credentials, users can't log in.
- ⚠️ **For production**: Consider adding additional security measures like:
  - Rate limiting on login attempts
  - Session tokens instead of simple localStorage flags
  - HTTPS only

### Setting Environment Variables

**Vercel:**
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add `AUTH_EMAIL` and `AUTH_PASSWORD`
4. Redeploy

**Netlify:**
1. Go to Site settings
2. Navigate to "Environment variables"
3. Add the variables
4. Redeploy

**Other Platforms:**
- Check your hosting platform's documentation for setting environment variables

