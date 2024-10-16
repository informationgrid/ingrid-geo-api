import path from 'path';
// import { getDirName } from './utils';
import readConfig from 'read-config-ng';

const config = readConfig(path.resolve(__dirname, '..', 'config.json'));
export default config;