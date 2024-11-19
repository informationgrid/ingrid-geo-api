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
import { ParserFactory } from '../../api/v1/routes/convert/parsing/ParserFactory.js';
import { assertEqualIgnoreSpaces, readFile } from '../test.utils.js';

describe('Parsing/Conversion tests', () => {

    const geojsonParser = ParserFactory.get('geojson');
    const gmlParser = ParserFactory.get('gml');
    const wktParser = ParserFactory.get('wkt');

    test('Convert GML to GeoJSON', async () => {
        let geojson = gmlParser.parse(readFile('example.xml'));
        let actual = geojsonParser.write(geojson);
        let expected = readFile('example.json');
        assertEqualIgnoreSpaces(actual, expected);
    });

    test('Convert GeoJSON to GML', async () => {
        let geojson = geojsonParser.parse(readFile('example.json'));
        let actual = gmlParser.write(geojson);
        let expected = readFile('example.xml');
        assertEqualIgnoreSpaces(actual, expected);
    });

    test('Convert GML to WKT', async () => {
        let geojson = gmlParser.parse(readFile('example.xml'));
        let actual = wktParser.write(geojson);
        let expected = readFile('example.wkt');
        assertEqualIgnoreSpaces(actual, expected);
    });

    test('Convert WKT to GML', async () => {
        let geojson = wktParser.parse(readFile('example.wkt'));
        let actual = gmlParser.write(geojson);
        let expected = readFile('example.xml');
        assertEqualIgnoreSpaces(actual, expected);
    });

    test('Convert GeoJSON to WKT', async () => {
        let geojson = geojsonParser.parse(readFile('example.json'));
        let actual = wktParser.write(geojson);
        let expected = readFile('example.wkt');
        assertEqualIgnoreSpaces(actual, expected);
    });

    test('Convert WKT to GeoJSON', async () => {
        let geojson = wktParser.parse(readFile('example.wkt'));
        let actual = geojsonParser.write(geojson);
        let expected = readFile('example.json');
        assertEqualIgnoreSpaces(actual, expected);
    });
});
