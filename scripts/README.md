# Database Seeding

This directory contains scripts to seed initial data into the MongoDB database.

## Available Seeds

### User Seeds (`seed-users.js`)

Creates initial users with different roles for testing and development:

- **Admin User**: Full system access
- **Manager User**: Management-level access
- **Regular User**: Standard user access

## Usage

### Seed Initial Users

```bash
npm run seed:users
```

This will create the following users:

- **Admin**: `admin@company.com` / `Admin123!`
- **Manager**: `manager@company.com` / `Manager123!`
- **User**: `user@company.com` / `User123!`

### Seed Only Admin User

```bash
npm run seed:admin
```

Creates only the admin user.

### Clean Up Seeded Users

```bash
npm run seed:cleanup
```

Removes all seeded users (useful for development/testing).

## Configuration

The seed scripts use the following environment variables:

- `MONGO_URI`: MongoDB connection string (defaults to local development setup)

Example:
```bash
MONGO_URI="mongodb://admin:password@production-server:27017/assistant_aggregator?authSource=admin" npm run seed:users
```

## Security Notes

- **Change default passwords** after seeding in production
- The scripts use bcrypt with 12 salt rounds for password hashing
- Users are created with unique constraints on email, national code, and personal code
- Scripts check for existing users to avoid duplicates

## For Production Deployment

1. Run seeds after database setup: `npm run seed:users`
2. Change default passwords through the application
3. Create additional users as needed through the API
4. Consider removing seed scripts from production builds for security