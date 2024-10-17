import * as fs from 'fs';
import { FastifyInstance } from 'fastify';

export default async (server: FastifyInstance, options: any) => {
    server.get('/', async function handler (request, reply) {
        let body = fs.readFileSync('../README.md');
        return reply.header('Content-Type', 'text/html').send(body);
    });
}
