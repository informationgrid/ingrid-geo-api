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

import { errorCodes, FastifyInstance } from 'fastify';
import { GeoJSON } from 'geojson';
import { ConversionSettings, convert } from './GeoConverter.js';
import { ParserFactory } from './parsing/ParserFactory.js';
import { FORMATS, GeoFormat, MODES } from './types.js';

export default async (server: FastifyInstance, options: any) => {

    // define content-type parsers
    Object.entries(FORMATS).forEach(([geoFormat, contentTypes]) => {
        server.addContentTypeParser(contentTypes as unknown as string[], { parseAs: 'string' }, (request, body, done) => {
            if (FORMATS['geojson'].includes(request.headers['content-type']) && !body?.length) {
                done(new errorCodes.FST_ERR_CTP_EMPTY_JSON_BODY());
            }
            try {
                let parsedBody = ParserFactory.get(geoFormat as GeoFormat).parse(body as string);
                done(null, parsedBody);
            }
            catch (e) {
                done(new errorCodes.FST_ERR_VALIDATION(e));
            }
        });
    });
    server.addContentTypeParser('*', { parseAs: 'string' }, (request, body, done) => {
        let format = determineFormat(body as string);
        let parsedBody = ParserFactory.get(format).parse(body as string);
        done(null, parsedBody);
    });

    server.post<{ Body: GeoJSON, Querystring: ConversionSettings }>('/', {
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    exportFormat: {
                        enum: Object.keys(FORMATS)
                    },
                    exportCRS: {
                        type: 'string'
                    },
                    mode: {
                        enum: MODES
                    }
                },
                required: ['exportFormat']
            }
        }
    }, async ({ body, query }, reply) => {
        try {
            // set content-type
            reply = reply.header('Content-Type', FORMATS[query.exportFormat][0]);
            // create response
            let replyBody = convert(body, query);
            return reply.send(replyBody);
        }
        catch (e) {
            if (e instanceof Error) {
                return reply.header('Content-Type', 'text/plain').status(e.cause as number).send(e.message);
            }
            else {
                return reply.header('Content-Type', 'text/plain').status(500).send(e);
            }
        }
    });
}

// naive heuristic for input format
function determineFormat(body: string): GeoFormat {
    switch (body[0]) {
        case '[':
        case '{':
            return 'geojson';
        case '<':
            return 'gml';
        default:
            return 'wkt';
    }
}