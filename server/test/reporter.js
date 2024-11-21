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

import { Transform } from 'node:stream';
import { spec } from 'node:test/reporters';

class Reporter extends Transform {

    specReporter;
    errorLogs;

    // This is a custom test reporter for node:test
    // it'll only log console.logs that occur during 
    // failed tests. For everything else it delegates
    // to the default "spec" reporter.
    constructor() {
        super({ writableObjectMode: true });
        
        this.specReporter = new spec();
        this.errorLogs = [];
    }

    addToErrorLogs = (_, data) => {
        this.errorLogs.push(data);
    }

    _transform(event, encoding, callback) {
        switch (event.type) {
            case 'test:stdout':
                callback(null);
                break;
            case 'test:stderr':
                this.errorLogs.push(this.specReporter._transform(event, encoding, this.addToErrorLogs));
                callback(null);
                break;
            case 'test:pass':
                this.specReporter._transform(event, encoding, callback);
                this.errorLogs = [];
                break;
            case 'test:fail':
                this.specReporter._transform(event, encoding, this.addToErrorLogs);
                callback(null, this.errorLogs.join(''));
                this.errorLogs = [];
                break;
            default:
                this.specReporter._transform(event, encoding, callback);
                break;
        }
    }

    _flush(callback) {
        this.specReporter._flush(callback);
    }
}

export default new Reporter();
