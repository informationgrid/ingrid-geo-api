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
import { HttpBadRequestError } from '../../../../utils/utils.js';
import { ConversionSettings, convert, DEFAULT_CRS } from './GeoConverter.js';
import { ParserFactory } from './parsing/ParserFactory.js';
import { FORMATS, GeoFormat, MODES } from './types.js';

export default async (server: FastifyInstance) => {

    // define content-type parsers
    Object.entries(FORMATS).forEach(([geoFormat, contentTypes]) => {
        server.addContentTypeParser(contentTypes, { parseAs: 'string' }, (request, body: string, done) => {
            parse(geoFormat as GeoFormat, body, done);
        });
    });
    server.addContentTypeParser('*', { parseAs: 'string' }, (request, body: string, done) => {
        let geoFormat = determineFormat(body);
        parse(geoFormat, body, done);
    });

    server.post<{ Body: GeoJSON, Querystring: ConversionSettings }>('/', {
        schema: {
            description: 'Converts a given geometry object from and to one of the listed formats. Requires a correct `content-type` header for the payload type - otherwise a simple heuristic is used to deduce it.',
            querystring: {
                type: 'object',
                properties: {
                    importCRS: {
                        type: 'string',
                        default: DEFAULT_CRS
                    },
                    exportFormat: {
                        enum: Object.keys(FORMATS)
                    },
                    exportCRS: {
                        type: 'string',
                        default: DEFAULT_CRS
                    },
                    mode: {
                        enum: MODES,
                        default: 'full'
                    }
                },
                required: ['exportFormat']
            }
        }
    }, async ({ body, query }, reply) => {
        // set content-type
        reply = reply.header('Content-Type', FORMATS[query.exportFormat][0]);
        // create response
        let replyBody = convert(body, query);
        return reply.send(replyBody);
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

function parse(geoFormat: GeoFormat, body: string, done) {
    if (!body?.length) {
        throw HttpBadRequestError('Body cannot be empty');
    }
    try {
        let parsedBody = ParserFactory.get(geoFormat).parse(body);
        done(null, parsedBody);
    }
    catch (e) {
        done(new errorCodes.FST_ERR_VALIDATION(e));
    }
}
