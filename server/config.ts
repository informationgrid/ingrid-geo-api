import path from 'path';
import readConfig from 'read-config-ng';

const config = readConfig(path.resolve(__dirname, '..', 'config.json'));
export default config;