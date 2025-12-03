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

describe('Tests for more complex polygons', () => {

    const geojsonParser = ParserFactory.get('geojson');
    const gmlParser = ParserFactory.get('gml');
    const wktParser = ParserFactory.get('wkt');

    test('Convert polygon with holes from GML to GeoJSON', async () => {
        let geojson = gmlParser.parse(readFile('polygon-with-hole.xml'));
        let actual = geojsonParser.write(geojson);
        let expected = readFile('polygon-with-hole.json');
        assertEqualIgnoreSpaces(actual, expected);
    });

    test('Convert polygon with holes and wrong direction from GML to GeoJSON', async () => {
        let geojson = gmlParser.parse(readFile('clockwise-polygon.xml'));
        let actual = geojsonParser.write(geojson);
        let expected = readFile('polygon-with-hole.json');
        assertEqualIgnoreSpaces(actual, expected);
    });

    test('Convert polygon with holes from GeoJSON to GML', async () => {
        let geojson = geojsonParser.parse(readFile('polygon-with-hole.json'));
        let actual = gmlParser.write(geojson);
        let expected = readFile('polygon-with-hole.xml');
        assertEqualIgnoreSpaces(actual, expected);
    });

    // test('Convert polygon with holes and wrong direction from GeoJSON to GML', async () => {
    //     TODO
    // });

    test('Convert polygon with holes from GML to WKT', async () => {
        let geojson = gmlParser.parse(readFile('polygon-with-hole.xml'));
        let actual = wktParser.write(geojson);
        let expected = readFile('polygon-with-hole.wkt');
        assertEqualIgnoreSpaces(actual, expected);
    });

    test('Convert polygon with holes and wrong direction from GML to WKT', async () => {
        let geojson = gmlParser.parse(readFile('clockwise-polygon.xml'));
        let actual = wktParser.write(geojson);
        let expected = readFile('polygon-with-hole.wkt');
        assertEqualIgnoreSpaces(actual, expected);
    });

    test('Convert polygon with holes from WKT to GML', async () => {
        let geojson = wktParser.parse(readFile('polygon-with-hole.wkt'));
        let actual = gmlParser.write(geojson);
        let expected = readFile('polygon-with-hole.xml');
        assertEqualIgnoreSpaces(actual, expected);
    });

    // test('Convert polygon with holes and wrong direction from WKT to GML', async () => {
    //     TODO
    // });

    test('Convert polygon with holes from GeoJSON to WKT', async () => {
        let geojson = geojsonParser.parse(readFile('polygon-with-hole.json'));
        let actual = wktParser.write(geojson);
        let expected = readFile('polygon-with-hole.wkt');
        assertEqualIgnoreSpaces(actual, expected);
    });

    // test('Convert polygon with holes and wrong direction from GeoJSON to WKT', async () => {
    //     TODO
    // });

    test('Convert polygon with holes from WKT to GeoJSON', async () => {
        let geojson = wktParser.parse(readFile('polygon-with-hole.wkt'));
        let actual = geojsonParser.write(geojson);
        let expected = readFile('polygon-with-hole.json');
        assertEqualIgnoreSpaces(actual, expected);
    });

    // test('Convert polygon with holes and inconsistent direction from WKT to GeoJSON', async () => {
    //     TODO
    // });
});
