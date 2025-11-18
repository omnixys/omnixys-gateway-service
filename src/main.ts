import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';
// relativer Import
import { AppModule } from './app.module.js';
import { corsOptions } from './config/cors.js';
import { nodeConfig } from './config/node.js';
import { helmetHandlers } from './security/http/helmet.handler.js';

if (process.env.NODE_ENV !== 'production') {
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
}

const { httpsOptions, port } = nodeConfig;

const bootstrap = async () => {
    const app = await NestFactory.create(AppModule, { httpsOptions });
    app.use(helmetHandlers, compression());
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.enableCors(corsOptions);
    await app.listen(port);
    console.log(`🚀 Gateway ready at http${httpsOptions ? 's' : ''}://localhost:${port}/graphql`);
};

await bootstrap();
