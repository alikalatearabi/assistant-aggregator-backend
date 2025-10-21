const crypto = require('crypto');

// Manual presigned URL construction (alternative to using MinIO SDK)
// This is more complex but doesn't require the MinIO SDK dependency

function generatePresignedUrl(minioConfig, bucket, objectKey, expirySeconds = 3600) {
  const {
    endPoint,
    port = 9000,
    useSSL = false,
    accessKey,
    secretKey
  } = minioConfig;

  const protocol = useSSL ? 'https' : 'http';
  const baseUrl = `${protocol}://${endPoint}:${port}/${bucket}/${objectKey}`;

  // Current time
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);

  // Expiry time
  const expiryTime = Math.floor(now.getTime() / 1000) + expirySeconds;

  // Create canonical request
  const canonicalUri = `/${bucket}/${objectKey}`;
  const canonicalQuerystring = `X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=${encodeURIComponent(accessKey + '/' + dateStamp + '/us-east-1/s3/aws4_request')}&X-Amz-Date=${amzDate}&X-Amz-Expires=${expirySeconds}&X-Amz-SignedHeaders=host`;

  const canonicalHeaders = `host:${endPoint}:${port}\n`;
  const signedHeaders = 'host';

  const payloadHash = crypto.createHash('sha256').update('').digest('hex');

  const canonicalRequest = [
    'GET',
    canonicalUri,
    canonicalQuerystring,
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');

  // Create string to sign
  const algorithm = 'AWS4-HMAC-SHA256';
  const region = 'us-east-1'; // MinIO uses us-east-1 by default
  const service = 's3';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;

  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    crypto.createHash('sha256').update(canonicalRequest).digest('hex')
  ].join('\n');

  // Calculate signature
  const kDate = crypto.createHmac('sha256', 'AWS4' + secretKey).update(dateStamp).digest();
  const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
  const kService = crypto.createHmac('sha256', kRegion).update(service).digest();
  const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  // Construct final URL
  const presignedUrl = `${baseUrl}?${canonicalQuerystring}&X-Amz-Signature=${signature}`;

  return {
    url: presignedUrl,
    expiresAt: new Date(expiryTime * 1000).toISOString(),
    expiresIn: expirySeconds
  };
}

// Example usage
function generateAllUrls() {
  const minioConfig = {
    endPoint: 'your-company-minio-endpoint.com',
    port: 9000,
    useSSL: false,
    accessKey: 'your-access-key',
    secretKey: 'your-secret-key'
  };

  const documents = JSON.parse(require('fs').readFileSync('new-documents-export.json', 'utf8'));

  const results = documents.map(doc => ({
    _id: doc._id,
    filename: doc.filename,
    ...generatePresignedUrl(minioConfig, doc.bucket, doc.objectKey)
  }));

  require('fs').writeFileSync('manual-presigned-urls.json', JSON.stringify(results, null, 2));
  console.log('Manual presigned URLs saved to manual-presigned-urls.json');
}

// Uncomment to run:
// generateAllUrls();