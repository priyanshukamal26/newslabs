import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { appRoutes } from './routes';
import { initScheduler } from './services/scheduler.service';

const server = Fastify({
    logger: true
});

server.register(cors, {
    origin: '*', // Configure implementation to match frontend URL in production
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
});

import { prisma } from './db';

// Expose NLP classifier readiness from the content routes module
import { getNlpStatus } from './routes/content';

server.get('/health', async (request, reply) => {
    const start = performance.now();
    try {
        // Ping the database to check if it's reachable (avoids full query overhead)
        await prisma.$queryRaw`SELECT 1`;
        const dbLatency = Math.round(performance.now() - start);
        return { status: 'ok', database: 'connected', dbLatency, nlpClassifier: getNlpStatus(), timestamp: new Date().toISOString() };
    } catch (error: any) {
        server.log.error('Database health check failed:', error.message);
        return reply.status(503).send({ 
            status: 'error', 
            database: 'disconnected', 
            error: error.message,
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
        initScheduler();
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
