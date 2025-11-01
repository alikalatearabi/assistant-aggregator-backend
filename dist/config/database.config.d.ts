export declare const databaseConfig: () => {
    database: {
        uri: string;
    };
    minio: {
        endpoint: string;
        port: number;
        accessKey: string;
        secretKey: string;
        useSSL: boolean;
        bucketName: string;
    };
    elasticsearch: {
        node: string;
        indexPrefix: string;
        maxRetries: number;
        requestTimeout: number;
        pingTimeout: number;
    };
    port: number;
    nodeEnv: string;
    rateLimit: {
        login: {
            maxCount: number;
            windowHours: number;
        };
        message: {
            maxCount: number;
            windowHours: number;
        };
    };
};
