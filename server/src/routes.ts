import { FastifyInstance } from 'fastify';
import { contentRoutes } from './routes/content';
import { authRoutes } from './routes/auth';
import { aiRoutes } from './routes/ai';
import { userRoutes } from './routes/user';
import { notificationRoutes } from './routes/notifications';

export async function appRoutes(server: FastifyInstance) {
    server.get('/', async () => {
        return { message: 'Welcome to NewsLab API' };
    });

    server.register(contentRoutes, { prefix: '/api/content' });
    server.register(authRoutes, { prefix: '/api/auth' });
    server.register(aiRoutes, { prefix: '/api/ai' });
    server.register(userRoutes, { prefix: '/api/user' });
    server.register(contentRoutes, { prefix: '/api/public' }); // Reusing contentRoutes for the public endpoints
    server.register(notificationRoutes, { prefix: '/api/notifications' });
}
