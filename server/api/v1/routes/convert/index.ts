import { convert } from './geoConverter';
import { FastifyInstance } from 'fastify';
import { ConversionMode, FORMATS, GeoFormat, MODES } from './types';
import { throwHttpError } from '../../../../utils';

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
