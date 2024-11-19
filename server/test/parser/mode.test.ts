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

    test('Return centroid for GML', async () => {
        let geojson = gmlParser.parse(readFile('example.xml'));
        let actual = convert(geojson, { exportFormat: 'gml', mode: 'centroid' });
        let expected = '<gml:Point><gml:pos>26.42857142857142727.857142857142858</gml:pos></gml:Point>';
        assertEqualIgnoreSpaces(actual, expected);
    });

    test('Return bounding box for WKT', async () => {
        let geojson = wktParser.parse(readFile('example.wkt'));
        let actual = convert(geojson, { exportFormat: 'geojson', mode: 'bbox' });
        let expected = '{"type":"Polygon","coordinates":[[[10,10],[45,10],[45,45],[10,45],[10,10]]]}';
        assertEqualIgnoreSpaces(actual, expected);
    });
});
