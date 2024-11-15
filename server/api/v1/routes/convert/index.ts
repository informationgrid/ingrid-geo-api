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

import { FastifyInstance } from 'fastify';
import { throwHttpError } from '../../../../utils/utils';
import { ConversionSettings, convert } from './GeoConverter';
import { ConversionMode, FORMATS, GeoFormat, MODES } from './types';

export default async (server: FastifyInstance, options: any) => {
    server.post<{ Querystring: ConversionSettings }>('/', async function handler (request, reply) {
        let replyBody;
        try {
            let body = request.body as string;
            if (!body?.length) {
                throwHttpError(400, `Request body is mandatory, but was empty`);
            }

            let importFormat: GeoFormat = request.query.importFormat;
            if (importFormat && !Object.keys(FORMATS).includes(importFormat)) {
                throwHttpError(400, `Parameter "importFormat" must be one of ${Object.keys(FORMATS)}`);
            }
            if (!importFormat) {
                importFormat = determineFormat(body);
            }

            let exportFormat: GeoFormat = request.query.exportFormat;
            if (!Object.keys(FORMATS).includes(exportFormat)) {
                throwHttpError(400, `Parameter "exportFormat" must be one of ${Object.keys(FORMATS)}`);
            }

            let mode: ConversionMode = request.query.mode ?? 'full';
            if (!MODES.includes(mode)) {
                throwHttpError(400, `Parameter "mode" must be one of ${MODES}`);
            }

            // set content-type
            reply = reply.header('Content-Type', FORMATS[exportFormat]);

            // create response
            replyBody = convert(body, request.query);
        }
        catch (e) {
            if (e instanceof Error) {
                reply.status(e.cause as number);
                replyBody = e.message;
            }
            else {
                reply.status(500);
                replyBody = String(e);
            }
        }
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