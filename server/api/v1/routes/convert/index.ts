import { bbox, centroid, convert, GeoFormat } from './geoConverter';
import { FastifyInstance, RouteShorthandOptions } from 'fastify';
import { Static, Type } from '@sinclair/typebox';

// export const ConversionQuery = Type.Object({
//   name: Type.String(),
//   mail: Type.Optional(Type.String({ format: 'email' })),
// })

// export type ConversionQueryType = Static<typeof ConversionQuery>;

// const opts: RouteShorthandOptions = {
//     schema: {
//         // querystring: ConversionQuery
//     }
// };

const formats = {
    'geojson': 'text/json',
    'gml': 'application/gml+xml',
    'wkt': 'text/plain'
};
const modes = ['bbox', 'centroid', 'full'];

interface ConversionQuery {
    exportCRS: string,
    exportFormat: GeoFormat,
    mode: 'bbox' | 'centroid' | 'full'
}

export default async (server: FastifyInstance, options: any) => {
    server.post<{ Querystring: ConversionQuery }>('/', async function handler (request, reply) {
        let replyBody;
        try {
            let exportFormat: GeoFormat = request.query.exportFormat;
            if (!Object.keys(formats).includes(exportFormat)) {
                return reply.status(400).send(`Parameter "exportFormat" must be one of ${Object.keys(formats)}`);
            }

            let mode = request.query.mode ?? 'full';
            if (!modes.includes(mode)) {
                return reply.status(400).send(`Parameter "mode" must be one of ${modes}`);
            }

            // set content-type
            reply = reply.header('Content-Type', formats[exportFormat]);

            // create response
            switch (mode) {
                case 'full':
                    replyBody = convert(request.body, exportFormat, request.query.exportCRS);
                    break;
                case 'centroid':
                    replyBody = centroid(request.body, exportFormat);
                    break;
                case 'bbox':
                    replyBody = bbox(request.body, exportFormat);
                    break;
            }
        }
        catch (e) {
            // e.message;
            reply.status(500);
            replyBody = e;
        }

        return reply.send(replyBody);
    });
}
