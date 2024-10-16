import path from 'path';
// import { getDirName } from './utils';
import autoload from '@fastify/autoload';
import config from './config';
import Fastify from 'fastify';

const server = Fastify({
    logger: true
});

const baseUrl = '/' + (config.server.baseUrl?.trim().replace(/^\/*|\/*$/g, '').trim() ?? '');

// Run the server!
async function start() {

    let version = 'v1';
    const versionBaseUrl = `${baseUrl}/${version}`.trim().replace(/\/+/g, '/').trim()
    // log.info(`-- version ${version} (${versionBaseUrl})`);
    console.log(versionBaseUrl);

    // register routes
    const routesBaseDir = path.resolve(__dirname, `api/${version}/routes`);
    console.log(routesBaseDir);
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
        await server.listen({ port: 3000 });
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}

start();
