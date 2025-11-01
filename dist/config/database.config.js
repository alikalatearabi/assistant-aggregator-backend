"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseConfig = void 0;
const databaseConfig = () => ({
    database: {
        uri: process.env.MONGO_URI || 'mongodb://admin:password123@mongodb:27017/assistant_aggregator?authSource=admin',
    },
    minio: {
        endpoint: process.env.MINIO_ENDPOINT || 'localhost',
        port: parseInt(process.env.MINIO_PORT || '9000', 10),
        accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
        secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
        useSSL: process.env.MINIO_USE_SSL === 'true',
        bucketName: process.env.MINIO_BUCKET_NAME || 'assistant-aggregator',
    },
    elasticsearch: {
        node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
        indexPrefix: process.env.ELASTICSEARCH_INDEX_PREFIX || 'assistant_aggregator',
        maxRetries: parseInt(process.env.ELASTICSEARCH_MAX_RETRIES || '3', 10),
        requestTimeout: parseInt(process.env.ELASTICSEARCH_REQUEST_TIMEOUT || '60000', 10),
        pingTimeout: parseInt(process.env.ELASTICSEARCH_PING_TIMEOUT || '3000', 10),
    },
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    rateLimit: {
        login: {
            maxCount: parseInt(process.env.RATE_LIMIT_LOGIN_MAX || '10', 10),
            windowHours: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW_HOURS || '1', 10),
        },
        message: {
            maxCount: parseInt(process.env.RATE_LIMIT_MESSAGE_MAX || '50', 10),
            windowHours: parseInt(process.env.RATE_LIMIT_MESSAGE_WINDOW_HOURS || '1', 10),
        },
    },
});
exports.databaseConfig = databaseConfig;
//# sourceMappingURL=database.config.js.map