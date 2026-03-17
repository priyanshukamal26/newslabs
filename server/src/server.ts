import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { appRoutes } from './routes';

const server = Fastify({
    logger: true
});

server.register(cors, {
    origin: '*', // Configure implementation to match frontend URL in production
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
});

import prisma from './lib/prisma';

// Expose NLP classifier readiness from the content routes module
import { getNlpStatus } from './routes/content';

server.get('/health', async (request, reply) => {
    const start = performance.now();
    try {
        // Use a model-based query instead of raw SQL to match exactly how other routes work.
        // This confirms the connection pool is healthy and the ORM is mapping correctly.
        await prisma.user.count();
        const dbLatency = Math.round(performance.now() - start);
        return { status: 'ok', database: 'connected', dbLatency, nlpClassifier: getNlpStatus(), timestamp: new Date().toISOString() };
    } catch (error: any) {
        server.log.error({
            message: error.message,
            stack: error.stack,
            code: error.code,
            meta: error.meta
        }, 'Database health check failed');
        
        return reply.status(503).send({ 
            status: 'error', 
            database: 'disconnected', 
            error: error.message || 'Unknown database error',
            nlpClassifier: getNlpStatus(),
            timestamp: new Date().toISOString() 
        });
    }
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
