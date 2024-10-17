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
        await server.listen({ host: '0.0.0.0', port: 3000 });
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}

start();
