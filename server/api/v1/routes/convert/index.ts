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

import { convert } from './geoConverter';
import { throwHttpError } from '../../../../utils/utils';
import { FastifyInstance } from 'fastify';
import { ConversionMode, FORMATS, GeoFormat, MODES } from './types';

interface ConversionQuery {
    exportCRS: string,
    exportFormat: GeoFormat,
    mode: ConversionMode
}

export default async (server: FastifyInstance, options: any) => {
    server.post<{ Querystring: ConversionQuery }>('/', async function handler (request, reply) {
        let replyBody;
        try {
            let exportFormat: GeoFormat = request.query.exportFormat;
            if (!Object.keys(FORMATS).includes(exportFormat)) {
                throwHttpError(400, `Parameter "exportFormat" must be one of ${Object.keys(FORMATS)}`);
            }

            let mode: ConversionMode = request.query.mode ?? 'full';
            if (!MODES.includes(mode)) {
                throwHttpError(400, `Parameter "mode" must be one of ${MODES}`);
            }

            let body = request.body as string;

            // set content-type
            reply = reply.header('Content-Type', FORMATS[exportFormat]);

            // create response
            replyBody = convert(body, exportFormat, request.query.exportCRS, mode);
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
