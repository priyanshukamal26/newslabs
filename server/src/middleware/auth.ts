import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export interface AuthPayload {
    userId: string;
}

export function getUserIdFromRequest(request: FastifyRequest): string | null {
    try {
        const authHeader = request.headers.authorization;
        if (!authHeader) return null;
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
        return decoded.userId;
    } catch {
        return null;
    }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
    }
    (request as any).userId = userId;
}
