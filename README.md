# MissingCrew

Welcome to MissingCrew, a platform designed to connect employers with skilled crew members. This README provides an overview of the project, setup instructions, and deployment guidelines.

## Table of Contents

- [MissingCrew](#missingcrew)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Usage](#usage)
  - [Deployment](#deployment)
    - [Vercel Deployment](#vercel-deployment)
    - [Customization](#customization)
  - [Contributing](#contributing)
  - [License](#license)

## Features

- **User Authentication**: Secure login and signup for both employers and crew members.
- **Profile Management**: Detailed profile setup for crew members.
- **Job Postings**: Employers can post job requirements.
- **Search and Filter**: Advanced search and filtering options for crew members.
- **Dashboard**: Personalized dashboards for both employers and crew members.
- **Subscription Plans**: Various subscription plans for employers.

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/khadim123/missingcrew.git
   cd missingcrew
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**:
   Create a `.env.local` file in the root directory and add the necessary environment variables. Refer to the `.env.local.example` file for the required variables.

4. **Set Up Database (Supabase)**:
   - Create a Supabase project (either locally or at [supabase.com](https://supabase.com))
   - Set the following in your `.env.local`:
     ```
     SUPABASE_URL=https://<project-ref>.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
     NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
     ```
   - Apply the SQL migrations in `supabase/migrations` to your database (via the Supabase SQL editor or `supabase db push`)

## Configuration

- **Database Configuration**: All data access goes through the typed repository layer in `src/lib/repo/` (Supabase PostgREST; no ORM).
- **Authentication Providers**: Authentication is handled by Supabase Auth (GoTrue); configure providers (e.g. Google OAuth) and the custom access token hook in the Supabase dashboard under Authentication.
- **Subscription Plans**: Update the subscription plans in the `src/components/subscription/SubscriptionPlans.tsx` file.

## Usage

1. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

2. **Access the Dashboard**:
   - Employers can access their dashboard at `/dashboard`.
   - Crew members can access their dashboard at `/crew/dashboard`.

3. **API Calls**:
   - When making API calls, use the `apiFetch` utility function from `@/lib/api` to ensure proper URL resolution in both development and production environments.
   - Example:
     ```javascript
     import { apiFetch } from '@/lib/api';

     // Use this instead of direct fetch calls
     const response = await apiFetch('/api/endpoint', {
       method: 'GET',
       headers: {
         'Content-Type': 'application/json',
       }
     });
     ```

## Deployment

### Vercel Deployment

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy the Application**:
   ```bash
   vercel
   ```
   Follow the prompts to deploy your application.

### Customization

- **Customizing the UI**: Modify the components in the `src/components` directory to customize the user interface.
- **Adding New Features**: Extend the functionality by adding new components and updating the necessary files.

## Contributing

We welcome contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md) to learn how you can help.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
