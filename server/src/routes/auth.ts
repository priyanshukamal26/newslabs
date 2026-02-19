import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().optional()
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string()
});

export async function authRoutes(server: FastifyInstance) {
    server.post('/register', async (request, reply) => {
        try {
            const { email, password, name } = registerSchema.parse(request.body);

            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing) {
                return reply.status(400).send({ error: 'User already exists' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await prisma.user.create({
                data: { email, password: hashedPassword, name }
            });

            const token = jwt.sign({ userId: user.id }, JWT_SECRET);
            let userTopics: string[] = [];
            try {
                userTopics = JSON.parse(user.topics);
            } catch (e) {
                userTopics = [];
            }
            return { token, user: { id: user.id, email: user.email, name: user.name, topics: userTopics, aiProvider: user.aiProvider } };
        } catch (error) {
            return reply.status(400).send({ error: error instanceof Error ? error.message : 'Invalid request' });
        }
    });

    server.post('/login', async (request, reply) => {
        try {
            const { email, password } = loginSchema.parse(request.body);

            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                return reply.status(401).send({ error: 'Invalid credentials' });
            }

            const valid = await bcrypt.compare(password, user.password);
            if (!valid) {
                return reply.status(401).send({ error: 'Invalid credentials' });
            }

            const token = jwt.sign({ userId: user.id }, JWT_SECRET);
            let userTopics: string[] = [];
            try {
                userTopics = JSON.parse(user.topics);
            } catch (e) {
                userTopics = [];
            }
            return { token, user: { id: user.id, email: user.email, name: user.name, topics: userTopics, aiProvider: user.aiProvider } };
        } catch (error) {
            console.error('Login error:', error);
            return reply.status(400).send({ error: 'Invalid request', details: error instanceof Error ? error.message : String(error) });
        }
    });

    server.put('/update', async (request, reply) => {
        try {
            const authHeader = request.headers.authorization;
            if (!authHeader) return reply.status(401).send({ error: 'Unauthorized' });

            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

            const { topics } = z.object({ topics: z.array(z.string()) }).parse(request.body);

            const user = await prisma.user.update({
                where: { id: decoded.userId },
                data: { topics: JSON.stringify(topics) },
            });

            return { user: { id: user.id, email: user.email, name: user.name, topics, aiProvider: user.aiProvider } };
        } catch (error) {
            return reply.status(400).send({ error: 'Update failed' });
        }
    });
}
