import dotenv from 'dotenv';
dotenv.config();

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { appRoutes } from './routes';

const server = Fastify({
    logger: true
});

server.register(cors, {
    origin: '*' // Configure implementation to match frontend URL in production
});

server.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register routes
server.register(appRoutes);

const start = async () => {
    try {
        const port = parseInt(process.env.PORT || '3000', 10);
        await server.listen({ port, host: '0.0.0.0' });
        console.log(`Server listening on http://localhost:${port}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
