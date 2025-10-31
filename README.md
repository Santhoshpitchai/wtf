# Witness The Fitness (WTF) - Fitness Management System

A complete gym and personal training management system built with Next.js 14, TypeScript, TailwindCSS, and Supabase.

## Features

- **Authentication**: Secure login with role-based access (Admin/PT) using Supabase Auth
- **Client Management**: Track clients with detailed information, payments, and session history
- **Personal Trainer Management**: Manage trainers, their clients, and performance metrics
- **Payment Tracking**: Monitor payments collected and pending amounts
- **Session Management**: Schedule and track training sessions with status updates
- **PT Sales Dashboard**: View sales metrics and performance analytics
- **Responsive Design**: Modern UI with TailwindCSS

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: TailwindCSS
- **Backend**: Supabase (PostgreSQL database, Authentication, Row Level Security)
- **Icons**: Lucide React
- **State Management**: React Hooks

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   cd /Users/santhoshpitchai/Desktop/WTF
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   
   a. Create a new project at [supabase.com](https://supabase.com)
   
   b. Go to your project's SQL Editor and run the schema from `supabase-schema.sql`
   
   c. Copy your project URL and anon key from Settings > API

4. **Configure environment variables**
   
   Copy `.env.example` to `.env.local` and add your Supabase credentials:
   ```bash
   cp .env.example .env.local
   ```
   
   Update the `.env.local` file with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database**
   
   The database schema has already been applied via Supabase MCP. The schema includes:
   - Users table with role-based access
   - Trainers table
   - Clients table
   - Payments table
   - Sessions table
   - PT Sales table
   - Automatic triggers for user creation on signup

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Authentication

### Sign Up
- Navigate to `/signup`
- Choose your role (Admin or PT)
- Fill in your details
- Create your account

### Sign In
- Navigate to `/` (home page)
- Select your role
- Enter your credentials
- Access the dashboard

## Database Schema

The application uses the following main tables:
- `users`: User authentication and profile data
- `trainers`: Personal trainer information
- `clients`: Client management
- `payments`: Payment tracking
- `sessions`: Training session scheduling
- `pt_sales`: Sales tracking

All tables have Row Level Security (RLS) enabled for secure data access.

## Project Structure

```
WTF/
├── app/
│   ├── dashboard/            # Dashboard pages
│   │   ├── clients/         # Client management
│   │   ├── payments/        # Payment tracking
│   │   └── ...              # Other dashboard pages
│   ├── signup/              # Signup page
│   ├── page.tsx             # Login page
│   └── layout.tsx           # Root layout
├── components/
│   └── Sidebar.tsx          # Navigation sidebar
├── lib/
│   ├── supabase.ts          # Supabase client
│   └── utils.ts             # Utility functions
├── types/
│   └── index.ts             # TypeScript types
└── supabase-schema.sql      # Database schema
```

## Authentication

The system supports two user roles:

- **Admin**: Full access to all features
- **PT (Personal Trainer)**: Access to client and session management

Authentication is handled entirely through Supabase Auth (email/password). Google and Apple sign-in are not implemented.

## Key Features by Page

### Login Page
- Role selection (Admin/PT)
- Email/password authentication
- Remember me functionality

### Client Details
- View all clients with pagination
- Search and filter functionality
- Client information including age, email, payments

### Payments
- Track payment status (Active/Inactive)
- View collected and pending amounts
- Client payment history

### Sessions
- Manage training sessions
- Session status tracking (Pending, Confirmed, Booked, Completed)
- Duration and remaining days

### Personal Trainers
- View all trainers
- Client count per trainer
- Payment metrics
- Status management

### PT Sales
- Sales dashboard with metrics
- Order tracking
- Payment status
- Performance analytics

### Create PT
- Add new personal trainers
- Complete address information
- Form validation

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Security

- All database functions use `SECURITY DEFINER` with proper `search_path` set
- Row Level Security (RLS) enabled on all tables
- Role-based access control
- Secure authentication with Supabase
- Environment variables for sensitive data
- Passwords securely hashed by Supabase Auth

## Troubleshooting

### Can't sign up or sign in?
1. Verify your Supabase credentials in `.env.local`
2. Check that the database schema is properly set up
3. Ensure email confirmation is disabled in Supabase Auth settings (for development)
4. Check browser console for any error messages

### Database connection issues?
1. Verify your Supabase URL and anon key
2. Check that your Supabase project is active
3. Ensure RLS policies are properly configured
4. Verify the trigger for user creation is active

## Contributing

This is a private project. For any questions or issues, please contact the development team.

## License

Proprietary - All rights reserved

## Support

For support, please contact the WTF Fitness development team.
