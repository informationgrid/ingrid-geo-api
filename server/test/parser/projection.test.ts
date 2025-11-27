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

import { describe, test } from 'node:test';
import { convert } from '../../api/v1/routes/convert/GeoConverter.js';
import { ParserFactory } from '../../api/v1/routes/convert/parsing/ParserFactory.js';
import { assertEqualIgnoreSpaces, readFile } from '../test.utils.js';

describe('Mode tests', () => {

    const geojsonParser = ParserFactory.get('geojson');
    const gmlParser = ParserFactory.get('gml');
    const wktParser = ParserFactory.get('wkt');

    const expected = 'GEOMETRYCOLLECTION(POINT(4452779.6317309431118889.9748579597),LINESTRING(1113194.90793273574865942.279503176,2226389.81586547152273030.926987689,1113194.90793273571118889.9748579597),POLYGON((4452779.6317309434865942.279503176,2226389.81586547155621521.486192066,5009377.0856973113503549.843504374,4452779.6317309434865942.279503176)))';

    test('Convert projection from WGS84 to EPSG:3857 for GeoJSON', async () => {
        let geojson = geojsonParser.parse(readFile('example.json'));
        let actual = convert(geojson, { importCRS: 'WGS84', exportFormat: 'wkt', exportCRS: 'EPSG:3857', mode: 'full' });
        assertEqualIgnoreSpaces(actual, expected);
    });

    test('Convert projection from WGS84 to EPSG:3857 for GML', async () => {
        let geojson = gmlParser.parse(readFile('example.xml'));
        let actual = convert(geojson, { importCRS: 'WGS84', exportFormat: 'wkt', exportCRS: 'EPSG:3857', mode: 'full' });
        assertEqualIgnoreSpaces(actual, expected);
    });

    test('Convert projection from WGS84 to EPSG:3857 for WKT', async () => {
        let geojson = wktParser.parse(readFile('example.wkt'));
        let actual = convert(geojson, { importCRS: 'WGS84', exportFormat: 'wkt', exportCRS: 'EPSG:3857', mode: 'full' });
        assertEqualIgnoreSpaces(actual, expected);
    });
});
