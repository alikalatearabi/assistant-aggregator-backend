# MinIO Configuration

## Environment Variables

Set these environment variables to configure MinIO properly:

### Required for External Access
```bash
# Public URL for external file access (IMPORTANT!)
MINIO_PUBLIC_URL=http://185.149.192.130:9000

# MinIO connection settings
MINIO_ENDPOINT=minio  # or localhost for local development
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=assistant-aggregator
```

### Example .env file
```env
MINIO_PUBLIC_URL=http://185.149.192.130:9000
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=assistant-aggregator
```

## How it works

1. **MINIO_ENDPOINT**: Used for internal API calls to MinIO (upload/download operations)
2. **MINIO_PUBLIC_URL**: Used to generate public URLs that external clients can access

Without `MINIO_PUBLIC_URL`, the system will generate URLs like:
- `http://minio:9000/bucket/file.pdf` (not accessible externally)

With `MINIO_PUBLIC_URL=http://185.149.192.130:9000`, it generates:
- `http://185.149.192.130:9000/bucket/file.pdf` (accessible externally)

## Current Issue Fix

The wrong URL `http://minio:9000/...` will be replaced with `http://185.149.192.130:9000/...` once you set the `MINIO_PUBLIC_URL` environment variable.