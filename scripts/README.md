# Database Seeding

This directory contains scripts to seed initial data into the MongoDB database.

## Available Seeds

### User Seeds (`seed-users.js`)

Creates initial users with different roles for testing and development:

- **Admin User**: Full system access
- **Manager User**: Management-level access
- **Regular User**: Standard user access

### Document Seeds (`seed-documents.js`)

Seeds documents from JSON export files into the database:

- Loads documents from `files/general-law-documents-export.json`
- Loads documents from `files/vezarat-documents-export.json`
- Upserts documents based on their `_id` (idempotent - safe to run multiple times)
- Converts `minioPath` to proper `fileUrl` format
- Maps `dataset_id` to dataset ObjectId reference

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

### Seed Documents

```bash
npm run seed:documents
```

This will:
- Read documents from `files/general-law-documents-export.json` and `files/vezarat-documents-export.json`
- Create new documents or update existing ones (based on `_id`)
- Set proper file URLs based on MinIO configuration
- Link documents to their respective datasets

The script is **idempotent** - you can run it multiple times safely. It will update existing documents if they already exist in the database.

## Configuration

The seed scripts use the following environment variables:

- `MONGO_URI`: MongoDB connection string (defaults to local development setup)
- `MINIO_ENDPOINT`: MinIO server endpoint (defaults to `127.0.0.1`)
- `MINIO_PORT`: MinIO server port (defaults to `9000`)
- `MINIO_USE_SSL`: Whether to use SSL for MinIO (defaults to `false`)
- `BUCKET`: MinIO bucket name (defaults to `assistant-aggregator`)

### Examples

Seed users:
```bash
MONGO_URI="mongodb://admin:password@production-server:27017/assistant_aggregator?authSource=admin" npm run seed:users
```

Seed documents:
```bash
MONGO_URI="mongodb://admin:password123@127.0.0.1:27017/assistant_aggregator?authSource=admin" \
MINIO_ENDPOINT=127.0.0.1 \
MINIO_PORT=9000 \
npm run seed:documents
```

## Security Notes

- **Change default passwords** after seeding in production
- The scripts use bcrypt with 12 salt rounds for password hashing
- Users are created with unique constraints on email, national code, and personal code
- Scripts check for existing users to avoid duplicates

## Docker Integration

The seed scripts are integrated into the docker-compose setup:

### Automatic Seeding

When you start the docker-compose stack, the seed service will automatically run:

```bash
docker-compose up
```

The seed service will:
1. Wait for MongoDB and MinIO to be ready
2. Install dependencies
3. Run all seed scripts (users and documents)
4. Exit after completion

**Note**: The seed container only runs once. To re-run seeds, you need to explicitly start it:

```bash
npm run docker:seed
# or
docker-compose up seed
```

To view seed logs:
```bash
npm run docker:seed:logs
# or
docker-compose logs seed
```

### Skip Automatic Seeding

If you want to start the stack without seeding:

```bash
docker-compose up --scale seed=0
```

### Manual Seeding in Docker

To manually run seeds in Docker:

```bash
# Run all seeds
docker-compose run --rm seed

# Or start the seed service explicitly
docker-compose up seed
```

## For Production Deployment

1. Run seeds after database setup:
   - Using Docker: `docker-compose up seed`
   - Using npm: `npm run seed:users && npm run seed:documents`
2. Change default passwords through the application
3. Create additional users as needed through the API
4. Consider removing seed scripts from production builds for security