/**
 * ==================================================
 * geo-conversion-api
 * ==================================================
 * Copyright (C) 2024 wemove digital solutions GmbH
 * ==================================================
 * Licensed under the EUPL, Version 1.2 or - as soon they will be
 * approved by the European Commission - subsequent versions of the
 * EUPL (the "Licence");
 * 
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 * 
 * https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Licence for the specific language governing permissions and
 * limitations under the Licence.
 * ==================================================
 */

import * as fs from 'fs';
import { marked } from 'marked';
import { FastifyInstance } from 'fastify';

export default async (server: FastifyInstance, options: any) => {
    server.get('/', async function handler (request, reply) {
        let md = fs.readFileSync('../README.md', 'utf8');
        let body = marked.parse(md);
        return reply.header('Content-Type', 'text/html').send(body);
    });
}
