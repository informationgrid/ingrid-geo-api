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

import assert from 'assert';
import { FastifyInstance } from 'fastify';
import { after, before, describe, test } from 'node:test';
import server from '../../index.js';

describe('POST /convert', () => {
    let app: FastifyInstance;

    before(async () => {
        app = await server();
    });

    after(async () => {
        await app.close()
    });

    test('POST /convert without parameters returns status 400', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/v1/convert'
        });
        assert.strictEqual(response.statusCode, 400);
    });

    test('POST /convert?exportFormat=gml succeeds', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/v1/convert?exportFormat=gml',
            body: {
                "type": "Point",
                "coordinates": [40, 10]
            }
        });
        assert.strictEqual(response.statusCode, 200);
        let expected = '<gml:Point><gml:pos>40 10</gml:pos></gml:Point>';
        assert.strictEqual(response.body, expected);
    });

    test('POST /convert?exportFormat=gml with malformed input fails', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/v1/convert?exportFormat=gml',
            body: {
                "type": "Pointer",
                "coordinates": [40, 10]
            }
        });
        assert.strictEqual(response.statusCode, 400);
    });
});
