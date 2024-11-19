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

import assert from 'assert';
import { FastifyInstance } from 'fastify';
import { after, before, describe, test } from 'node:test';
import server from '../../index.js';
import { template } from '../../utils/utils.js';

describe('GET /info', () => {
    let app: FastifyInstance;

    before(async () => {
        app = await server();
    });

    after(async () => {
        await app.close()
    });

    test('GET /info returns status 200', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/v1/info'
        });
        assert.strictEqual(response.statusCode, 200);
    });

    test('GET /info returns README as HTML', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/v1/info'
        });
        let expected = await template('Information', '../README.md');
        assert.strictEqual(response.body, expected);
    });
});
