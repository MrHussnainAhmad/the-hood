# The Hood

The Hood is a full-stack service outsourcing marketplace built with Next.js, TypeScript, Prisma, MongoDB, Stripe, Cloudinary, and NextAuth. It connects consumers with verified local service providers while giving administrators the tools to manage users, services, orders, locations, verification, reviews, and payouts.

## Overview

The platform supports three role-based experiences:

- Consumers can create accounts, verify email, browse services, book providers, upload order images, pay online, track order progress, and leave reviews.
- Providers can publish services, configure service locations, receive orders, update fulfilment status, upload verification documents, and manage earnings.
- Admins can oversee users, services, orders, provider/company verification, service locations, moderation, and provider payouts.

## Features

- Role-based authentication with NextAuth credentials provider
- Email verification and password reset workflows
- Consumer service booking flow with location eligibility checks
- Provider service, order, location, and earnings management
- Admin dashboard for users, services, orders, locations, verifications, and payouts
- Stripe Payment Intents for consumer payments
- Stripe Connect onboarding and provider payout transfers
- Cloudinary uploads for order images and verification documents
- MongoDB data modeling with Prisma
- Password strength checks with zxcvbn and breach lookup support
- Review moderation with abusive-language filtering
- Responsive UI built with Tailwind CSS

## Tech Stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 16 App Router |
| Language | TypeScript |
| UI | React 19, Tailwind CSS, lucide-react, sonner |
| Authentication | NextAuth.js, Credentials Provider, Prisma Adapter |
| Database | MongoDB |
| ORM | Prisma |
| Payments | Stripe, Stripe Connect |
| File Uploads | Cloudinary |
| Email | Nodemailer SMTP |
| Forms and Validation | React Hook Form, Zod |
| Password Security | bcryptjs, zxcvbn |

## Project Structure

```text
.
├── prisma/
│   └── schema.prisma          # Prisma MongoDB schema
├── public/                    # Static assets
├── scripts/
│   └── create-admin.js        # Admin account creation helper
├── src/
│   ├── app/                   # Next.js App Router pages and API routes
│   ├── components/            # Shared UI, layout, admin, home, and payment components
│   ├── lib/                   # Auth, database, payments, email, uploads, helpers
│   └── types/                 # TypeScript type augmentation
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

Install the following before running the project:

- Node.js 20 or later
- npm
- MongoDB database connection string
- Stripe account and API keys
- Cloudinary account
- SMTP credentials for email delivery

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/thehood.git
cd thehood
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

If `.env.example` is not present, create `.env` manually using the variables listed below.

Generate the Prisma client:

```bash
npx prisma generate
```

Run the development server:

```bash
npm run dev
```

Open the app at:

```text
http://localhost:3000
```

## Environment Variables

Create a `.env` file in the project root and configure these values:

```env
DATABASE_URL="mongodb+srv://USER:PASSWORD@HOST/DATABASE"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-secure-secret"

STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
CLOUDINARY_UPLOAD_FOLDER="thehood"

SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-smtp-user"
SMTP_PASS="your-smtp-password"
SMTP_FROM="The Hood <no-reply@example.com>"

ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="secure-admin-password"
ADMIN_NAME="Admin"

PRISMA_LOG_QUERIES="false"
```

## Available Scripts

```bash
npm run dev
```

Starts the local development server.

```bash
npm run build
```

Creates a production build.

```bash
npm run start
```

Starts the production server after building.

```bash
npm run lint
```

Runs ESLint.

```bash
npm run create:admin
```

Creates an admin user using `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME` from the environment.

You can also pass values directly:

```bash
node scripts/create-admin.js admin@example.com secure-password "Admin Name"
```

## Database

This project uses Prisma with MongoDB. The schema is located at:

```text
prisma/schema.prisma
```

After changing the schema, regenerate the Prisma client:

```bash
npx prisma generate
```

For MongoDB projects, Prisma does not use SQL migrations in the same way as relational databases. Keep schema changes synchronized with the application and regenerate the client whenever models change.

## Core Workflows

### Consumer Flow

1. Register and verify email.
2. Browse available services.
3. Book a service for an eligible location.
4. Upload optional order images.
5. Pay through Stripe checkout flow.
6. Track order status.
7. Review completed orders.

### Provider Flow

1. Register as a provider.
2. Add services and service locations.
3. Complete company verification when required.
4. Receive and manage assigned orders.
5. Update order status from processing to completed.
6. Onboard to Stripe Connect.
7. Track earnings and payout status.

### Admin Flow

1. Manage users and account restrictions.
2. Review provider/company verification submissions.
3. Manage services and available locations.
4. Monitor orders and status changes.
5. Review payout-ready orders.
6. Release provider payouts through Stripe Connect.

## Security Notes

- Keep `.env` files out of version control.
- Use strong `NEXTAUTH_SECRET` values in every environment.
- Use Stripe webhook verification before relying on payments in production.
- Rotate leaked API keys immediately.
- Use production SMTP, Stripe, MongoDB, and Cloudinary credentials only in secure deployment environments.

## Deployment

The app can be deployed to Vercel or another Node-compatible hosting platform.

Before deployment:

1. Configure all required environment variables.
2. Run `npm run build` locally.
3. Ensure `npx prisma generate` runs during install/build.
4. Configure production URLs for `NEXTAUTH_URL` and Stripe Connect return/refresh flows.
5. Use production-ready Stripe and SMTP credentials.

## License

This project is currently private/proprietary. Add a license file before publishing if you want others to use, modify, or distribute the code.
