# PayLog - Pay Period Tracker

A Next.js 15 web application for tracking pay periods, shifts, and earnings. Built with Next.js 15, Tailwind CSS, Supabase, and server actions.

## Features

- 📄 **PDF Upload & Parsing**: Upload pay stub PDFs and automatically extract pay periods and shifts
- 📊 **Dashboard**: View earnings statistics, monthly trends, and pay period history
- ✏️ **Manual Entry**: Create pay periods manually with custom shifts
- 📈 **Charts & Analytics**: Visualize earnings with Recharts
- 💾 **Backup & Restore**: Export and import your data as JSON
- 🔒 **Access Control**: Protected by secret route key (no user accounts needed)

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

# Access Control - Choose a long random string
ACCESS_KEY=superlongrandomstring
```

**Important**: 
- Never commit `.env.local` to version control
- The `ACCESS_KEY` should be a long, random string (e.g., use `openssl rand -hex 32`)
- Keep your `SUPABASE_SERVICE_ROLE_KEY` secret - it has admin access

### 4. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 5. Access the App

Since the app uses secret route key protection, you must access it via:

```
http://localhost:3000/[ACCESS_KEY]/dashboard
```

Replace `[ACCESS_KEY]` with the value you set in `.env.local`.

For example, if your `ACCESS_KEY` is `abc123xyz`, visit:
```
http://localhost:3000/abc123xyz/dashboard
```

Any other route will redirect to 404.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub/GitLab/Bitbucket
2. Import your repository in Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ACCESS_KEY`
4. Deploy!

After deployment, access your app at:
```
https://your-domain.vercel.app/[ACCESS_KEY]/dashboard
```

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

1. Navigate to `/[ACCESS_KEY]/upload`
2. Select a PDF pay stub file
3. Click "Parse PDF" to extract pay period and shifts
4. Review the extracted data (you can edit dates if needed)
5. Enter actual pay received (optional)
6. Add notes (optional)
7. Click "Save Pay Period"

### Creating a Manual Pay Period

1. Navigate to `/[ACCESS_KEY]/manual`
2. Enter start and end dates
3. Add shifts (date, time in, time out, hours)
4. The app will auto-calculate hours if you provide times
5. Enter actual pay and notes (optional)
6. Click "Save Pay Period"

### Viewing Pay Periods

- **Dashboard**: `/[ACCESS_KEY]/dashboard` - Overview with stats and charts
- **Pay Period Detail**: Click "View" on any pay period to see details
- **Edit/Delete**: Available on the pay period detail page

### Settings

Navigate to `/[ACCESS_KEY]/settings` to:
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
- **Access Key**: The `ACCESS_KEY` is the only protection for your app. Use a long, random string.
- **RLS Disabled**: Row Level Security is disabled in the schema. The app relies on the secret route key for access control.
- **No User Accounts**: This app has no authentication system. Anyone with the access key can access your data.

## Troubleshooting

### PDF Parsing Fails

- Ensure your PDF contains text (not just images)
- Check that the date format matches expected patterns
- Try a different PDF or create the pay period manually

### Database Connection Errors

- Verify your Supabase URL and service role key are correct
- Check that you've run the schema SQL in Supabase
- Ensure your Supabase project is active

### Access Denied (404)

- Verify your `ACCESS_KEY` environment variable is set
- Ensure you're using the correct access key in the URL
- Check that the route matches exactly: `/[ACCESS_KEY]/dashboard`

## Project Structure

```
Paylog pro/
├── app/
│   ├── [accessKey]/          # Protected routes
│   │   ├── dashboard/        # Main dashboard
│   │   ├── upload/          # PDF upload page
│   │   ├── manual/          # Manual pay period entry
│   │   ├── settings/        # Settings & backup
│   │   └── pay-period/[id]/ # Pay period detail
│   ├── actions/              # Server actions
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Root page (redirects)
├── lib/
│   ├── supabase/            # Supabase client
│   └── utils/               # Utilities (PDF parser, etc.)
├── supabase/
│   └── schema.sql           # Database schema
└── package.json
```

## License

Private project for personal use.

## Support

For issues or questions, check the code comments or modify the PDF parser patterns to match your pay stub format.

