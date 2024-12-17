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

import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';


export function readFile(file: string) {
    return readFileSync(import.meta.dirname + `/resources/${file}`).toString();
}

export function assertEquals(format: string, actual: string, expected: string) {
    switch (format) {
        case 'geojson':
            return isDeepStrictEqual(actual, expected);
        case 'gml':
            return assert.strictEqual(actual, expected);
        case 'wkt':
            return assert.strictEqual(actual, expected);
        default:
            throw new Error(`Comparing objects is not implemented for format ${format}`)
    }
}
