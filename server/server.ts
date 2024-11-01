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

import { parseNumber } from './utils/utils';
import autoload from '@fastify/autoload';
import config from './config';
import path from 'path';
import Fastify from 'fastify';

const server = Fastify({
    logger: true
});

const baseUrl = '/' + (config.server.baseUrl?.trim().replace(/^\/*|\/*$/g, '').trim() ?? '');

// Run the server!
async function start() {

    let version = 'v1';
    const versionBaseUrl = `${baseUrl}/${version}`.trim().replace(/\/+/g, '/').trim()

    // register routes
    const routesBaseDir = path.resolve(__dirname, `api/${version}/routes`);
    await server.register(autoload, {
        dir: routesBaseDir,
        // forceESM: true,
        indexPattern: /^.*index\.ts$/,
        routeParams: true,
        options: { prefix: versionBaseUrl },
        dirNameRoutePrefix: (folderParent: string, folderName: string) => {
            return `/${folderName}`;
        }
    });
    try {
        let port = parseNumber(process.env.GEO_API_PORT) ?? 3000;
        await server.listen({ host: '0.0.0.0', port });
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}

start();
