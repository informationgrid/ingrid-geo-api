/**
 * ==================================================
 * geo-conversion-api
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

import { convert as convertCRS, getBbox, getCentroid, parse as gmlToGeojson } from './geojson.utils';
import { geojsonToWKT, wktToGeoJSON } from '@terraformer/wkt';
import { geomToGml } from 'geojson-to-gml-3';
import { throwHttpError } from '../../../../utils';
import { ConversionMode, GeoFormat } from './types';
import { DOMParser } from '@xmldom/xmldom';
import { GeoJSON, Geometry, GeometryCollection, Point } from 'geojson';

const DEFAULT_CRS = 'WGS84';
const DOM_PARSER = new DOMParser({
    // throw on error, swallow rest
    errorHandler: (level, msg) => {
        if (level == 'error') {
            throw new Error(msg);
        }
    }
});
const PARSERS = [parseGeoJSON, parseGML, parseWKT];

export function convert(inputGeometry: string, exportFormat: GeoFormat, exportCRS: string = DEFAULT_CRS, mode: ConversionMode): string {
    let geojson = parse(inputGeometry);
    // TODO
    // if (exportCRS != DEFAULT_CRS) {
    //     geojson = convertCRS(geojson, exportCRS);
    // }
    if (mode == 'bbox') {
        geojson = getBbox(geojson) as GeoJSON;
    }
    else if (mode == 'centroid') {
        geojson = getCentroid(geojson as Geometry | GeometryCollection) as Point;
    }
    return write(geojson, exportFormat);
}

function parse(inputGeometry: string): GeoJSON {
    // try parsing with various parsers
    for (let parser of PARSERS) {
        try {
            return parser(inputGeometry);
        }
        catch (e) {
            // swallow error
        }
    }
    // otherwise, no format could successfully be converted
    throwHttpError(400, 'Could not parse input');
}

function write(geojson: GeoJSON, exportFormat: GeoFormat): string {
    switch (exportFormat) {
        case 'geojson': return writeGeoJSON(geojson);
        case 'gml': return writeGML(geojson);
        case 'wkt': return writeWKT(geojson);
    }
}

function parseGeoJSON(inputGeometry: string): GeoJSON {
    return JSON.parse(inputGeometry);
}

function writeGeoJSON(geojson: GeoJSON): string {
    return JSON.stringify(geojson);
}

function parseGML(inputGeometry: string): GeoJSON {
    // if the gml snippet does not contain namespace information, add it manually
    if (!inputGeometry.includes('xmlns:gml')) {
        inputGeometry = inputGeometry.replace('>', ' xmlns:gml="http://www.opengis.net/gml/3.2">');
    }
    let dom = DOM_PARSER.parseFromString(inputGeometry, 'application/xml');
    // @ts-expect-error xmldom uses own Node/Element implementations, which are compatible
    // see https://github.com/xmldom/xmldom/issues/724
    return gmlToGeojson(dom.documentElement, undefined, { 'gml': 'http://www.opengis.net/gml/3.2' });
}

function writeGML(geojson: GeoJSON): string {
    return geomToGml(geojson);
}

function parseWKT(inputGeometry: string): GeoJSON {
    return wktToGeoJSON(inputGeometry);
}

function writeWKT(geojson: GeoJSON): string {
    return geojsonToWKT(geojson);
}
