# PayLog - Pay Period Tracker

A Next.js 15 web application for tracking pay periods, shifts, and earnings. Built with Next.js 15, Tailwind CSS, Supabase, and server actions.

## Features

- 📄 **PDF Upload & Parsing**: Upload pay stub PDFs and automatically extract pay periods and shifts
- 📊 **Dashboard**: View earnings statistics, monthly trends, and pay period history
- ✏️ **Manual Entry**: Create pay periods manually with custom shifts
- 📈 **Charts & Analytics**: Visualize earnings with Recharts
- 💾 **Backup & Restore**: Export and import your data as JSON
- 🔒 **Authentication**: Email/password login system

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **PDF Parsing**: pdf-parse

## Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account and project
- Environment variables configured

## Setup Instructions

### 1. Clone and Install

```bash
cd "Paylog pro"
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `supabase/schema.sql`
   - If you already have the database set up, run `supabase/migration.sql` to add new columns
3. Get your project URL and service role key:
   - Project URL: Settings → API → Project URL
   - Service Role Key: Settings → API → service_role key (keep this secret!)

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Authentication Credentials
NEXT_PUBLIC_AUTH_EMAIL=your_email@example.com
NEXT_PUBLIC_AUTH_PASSWORD=your_password
AUTH_EMAIL=your_email@example.com
AUTH_PASSWORD=your_password
```

**Important**: 
- Never commit `.env.local` to version control
- Keep your `SUPABASE_SERVICE_ROLE_KEY` secret - it has admin access
- Use strong passwords for production deployments

### 4. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 5. Access the App

You'll be redirected to the login page. Use the email and password you configured in your environment variables.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub/GitLab/Bitbucket
2. Import your repository in Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_AUTH_EMAIL`
   - `NEXT_PUBLIC_AUTH_PASSWORD`
   - `AUTH_EMAIL`
   - `AUTH_PASSWORD`
4. Deploy!

After deployment, access your app at your Vercel URL and log in with your credentials.

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- Render
- AWS Amplify
- Self-hosted (Docker, etc.)

Make sure to set all environment variables in your hosting platform.

## Usage

### Uploading a PDF

1. Navigate to `/upload` (after logging in)
2. Select a PDF pay stub file
3. Click "Parse PDF" to extract pay period and shifts
4. Review the extracted data (you can edit dates if needed)
5. Enter actual pay received (optional)
6. Add notes (optional)
7. Click "Save Pay Period"

### Creating a Manual Pay Period

1. Navigate to `/manual` (after logging in)
2. Enter start and end dates
3. Add shifts (date, time in, time out, hours)
4. The app will auto-calculate hours if you provide times
5. Enter actual pay and notes (optional)
6. Click "Save Pay Period"

### Viewing Pay Periods

- **Dashboard**: `/dashboard` - Overview with stats and charts
- **Pay Period Detail**: Click "View" on any pay period to see details
- **Edit/Delete**: Available on the pay period detail page

### Settings

Navigate to `/settings` to:
- Update default hourly rate
- Export data as JSON backup
- Import data from JSON backup

## PDF Format Support

The PDF parser is designed for "Individual Employee Timecard Report - Time Clock" format with:

- **Date Range**: `From: MM/DD/YY Thru: MM/DD/YY`
- **Table Format**: DATE | PER | HOL | TOTAL | TIME IN | DEPT | TIME OUT | LCH | ADJ | REG | OT1 | ...

Example row:
```
10/29/25 ... 12.38 Wed 07:29p Management Thu 07:52a ... 12.38 10.00
```

The parser extracts:
- Date (from DATE column)
- Total hours (from TOTAL column)
- Time in with day of week (e.g., "Wed 07:29p")
- Department name
- Time out with day of week (e.g., "Thu 07:52a")
- Regular hours (from REG column)
- Overtime hours (from OT1 column)

**Overnight Shifts**: The parser correctly handles shifts that span midnight (e.g., 7:29 PM to 7:52 AM next day).

If your PDF format differs, you may need to adjust the regex patterns in `lib/utils/pdf-parser.ts`.

## Security Notes

- **Service Role Key**: This key has admin access to your Supabase database. Never expose it to the client.
- **Authentication**: The app uses email/password authentication. Use strong passwords for production.
- **RLS Disabled**: Row Level Security is disabled in the schema. The app relies on authentication for access control.
- **Credentials**: Store authentication credentials securely in environment variables, never in code.

## Troubleshooting

### PDF Parsing Fails

- Ensure your PDF contains text (not just images)
- Check that the date format matches expected patterns
- Try a different PDF or create the pay period manually

### Database Connection Errors

- Verify your Supabase URL and service role key are correct
- Check that you've run the schema SQL in Supabase
- Ensure your Supabase project is active

### Login Issues

- Verify your `AUTH_EMAIL` and `AUTH_PASSWORD` environment variables are set
- Ensure both client-side (`NEXT_PUBLIC_*`) and server-side (`AUTH_*`) credentials match
- Check that you're using the correct email and password

## Project Structure

```
Paylog pro/
├── app/
│   ├── (protected)/         # Protected routes (require authentication)
│   │   ├── dashboard/       # Main dashboard
│   │   ├── upload/          # PDF upload page
│   │   ├── manual/          # Manual pay period entry
│   │   ├── settings/        # Settings & backup
│   │   └── pay-period/[id]/ # Pay period detail
│   ├── login/               # Login page
│   ├── actions/             # Server actions
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Root page (redirects to login)
├── lib/
│   ├── supabase/            # Supabase client
│   └── utils/               # Utilities (PDF parser, auth, etc.)
├── supabase/
│   └── schema.sql           # Database schema
└── package.json
```

## License

Private project for personal use.

## Support

For issues or questions, check the code comments or modify the PDF parser patterns to match your pay stub format.

