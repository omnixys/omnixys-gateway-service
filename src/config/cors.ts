import { type CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface.js';

export const corsOptions: CorsOptions = {
    // Access-Control-Allow-Origin (nur Requests von origin zulassen)
    origin: [
        'http://localhost:3000',
        'https://omnixys.com',
        'https://omnixys-sphere-ihh4dk9zv-omnixys.vercel.app',
        'http://192.168.178.102:3000',
        'http://192.0.0.2:3000',
    ],
    credentials: true,
    // Access-Control-Allow-Methods (hier: default)
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
    // Access-Control-Allow-Headers
    allowedHeaders: [
        'Origin',
        'Accept',
        'Content-Type',
        'Authorization',
        'Allow',
        'Content-Length',
        'Date',
        'If-Match',
        'If-Not-Match',
        'sec-fetch-mode',
        'sec-fetch-site',
        'sec-fetch-dest',
    ],
    // Access-Control-Expose-Headers
    exposedHeaders: [
        'Content-Type',
        'Content-Length',
        'ETag',
        'Location',
        'Date',
        'Last-Modified',
        'Access-Control-Allow-Origin',
        'Content-Security-Policy',
        'Strict-Transport-Security',
        'X-Content-Type-Options',
    ],
    // Access-Control-Max-Age: 24 * 60 * 60
    maxAge: 86_400,
};
