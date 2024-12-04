/**
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

import { FastifyInstance } from 'fastify';
import { template } from '../../../../utils/utils.js';

const README = template('Information', '../README.md');

export default async (server: FastifyInstance) => {
    server.get('/', {
        schema: {
            description: 'Returns general information on API use.',
        }
    }, async (request, reply) => {
        return reply.header('Content-Type', 'text/html').send(await README);
    });
}
