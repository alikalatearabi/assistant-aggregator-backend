const Minio = require('minio');
const fs = require('fs');

// Company MinIO configuration - UPDATE THESE VALUES
const minioConfig = {
  endPoint: 'your-company-minio-endpoint.com', // e.g., 'minio.company.com'
  port: 9000, // or 443 for HTTPS
  useSSL: false, // set to true if using HTTPS
  accessKey: 'your-access-key',
  secretKey: 'your-secret-key'
};

const bucketName = 'assistant-aggregator'; // or your bucket name
const expirySeconds = 3600; // 1 hour

async function generatePresignedUrls() {
  const minioClient = new Minio.Client(minioConfig);

  // Read the exported JSON
  const documents = JSON.parse(fs.readFileSync('new-documents-export.json', 'utf8'));

  console.log(`Generating presigned URLs for ${documents.length} documents...\n`);

  const results = [];

  for (const doc of documents) {
    try {
      // Generate presigned URL
      const presignedUrl = await minioClient.presignedGetObject(
        bucketName,
        doc.objectKey,
        expirySeconds
      );

      results.push({
        _id: doc._id,
        filename: doc.filename,
        presignedUrl: presignedUrl,
        expiresIn: `${expirySeconds} seconds`,
        expiresAt: new Date(Date.now() + expirySeconds * 1000).toISOString()
      });

      console.log(`✓ ${doc.filename}`);
      console.log(`  URL: ${presignedUrl}\n`);

    } catch (error) {
      console.error(`✗ Failed for ${doc.filename}: ${error.message}`);
      results.push({
        _id: doc._id,
        filename: doc.filename,
        error: error.message
      });
    }
  }

  // Save results to file
  fs.writeFileSync('presigned-urls.json', JSON.stringify(results, null, 2));
  console.log('Presigned URLs saved to presigned-urls.json');

  return results;
}

// Usage instructions
console.log('=== MinIO Presigned URL Generator ===');
console.log('Update the minioConfig object with your company\'s MinIO details, then run:');
console.log('node scripts/generate-presigned-urls.js\n');

// Uncomment to run:
// generatePresignedUrls().catch(console.error);