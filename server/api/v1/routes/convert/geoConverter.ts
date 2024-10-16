import { geojsonToWKT, wktToGeoJSON } from '@terraformer/wkt';
import { geomToGml } from 'geojson-to-gml-3';
import { convert as convertCRS, parse } from './geojson.utils';
import { DOMParser } from '@xmldom/xmldom';

const DEFAULT_CRS = 'WGS84';

const domParser = new DOMParser({
    errorHandler: (level, msg) => {
        // throw on error, swallow rest
        if (level == 'error') {
            throw new Error(msg);
        }
    }
});

export type GeoFormat = 'geojson' | 'gml' | 'wkt';

export function convert(inputGeometry: any, exportFormat: GeoFormat, exportCRS: string = DEFAULT_CRS): string {
    // try to parse as GeoJSON
    let geojson = parseGeoJSON(inputGeometry);
    // otherwise, try to parse as GML
    if (!geojson) {
        geojson = parseGML(inputGeometry);
    }
    // otherwise, try to parse as WKT
    if (!geojson) {
        geojson = parseWKT(inputGeometry);
    }
    // otherwise, no format could successfully be converted
    if (!geojson) {
        throw new Error('Could not ascertain input format');
    }

    // TODO
    // geojson = convertCRS(geojson, exportCRS);

    switch (exportFormat) {
        case 'geojson': return JSON.stringify(geojson);
        case 'gml': return geomToGml(geojson);
        case 'wkt': return geojsonToWKT(geojson);
    }
}

export function bbox(inputGeometry: any, exportFormat: GeoFormat) {

}

export function centroid(inputGeometry: any, exportFormat: GeoFormat) {

}

function parseGeoJSON(inputGeometry: any) {
    try {
        return JSON.parse(inputGeometry);
    }
    catch (e) {
        return null;
    }
}

function parseGML(inputGeometry: any) {
    try {
        if (!inputGeometry.includes('xmlns:gml')) {
            inputGeometry = inputGeometry.replace('>', ' xmlns:gml="http://www.opengis.net/gml/3.2">');
        }
        let dom = domParser.parseFromString(inputGeometry, 'application/xml');
        // @ts-expect-error xmldom uses own Node/Element implementations, which are compatible
        // see https://github.com/xmldom/xmldom/issues/724
        return parse(dom.documentElement, undefined, { 'gml': 'http://www.opengis.net/gml/3.2' });
    }
    catch (e) {
        return null;
    }
}

function parseWKT(inputGeometry: any) {
    try {
        return wktToGeoJSON(inputGeometry);
    }
    catch (e) {
        return null;
    }
}



// export async function convert2(inputGeometry: any, exportFormat: GeoFormat): Promise<string> {

//     let GEOJSON = (await import('ol/format/GeoJSON.js')).default;
//     let GML32 = (await import('ol/format/GML32.js')).default;
//     let wkt = (await import('ol/format/WKT.js')).default;

//     // try to parse as GeoJSON
//     let geojson = parseGeoJSON(inputGeometry);
//     let geometry;
//     try {
//         geometry = new GEOJSON().readGeometry(inputGeometry);
//     }
//     catch (e) {
//         console.log(e);
//     }
//     // otherwise, try to parse as GML
//     if (!geometry) {
//         geometry = new GML32().readGeometry(inputGeometry);
//         // geojson = parseGML(inputGeometry);
//     }
//     // otherwise, try to parse as WKT
//     if (!geometry) {
//         geometry = new wkt().readGeometry(inputGeometry);
//         // geojson = parseWKT(inputGeometry);
//     }
//     // otherwise, no format could successfully be converted
//     if (!geometry) {
//         throw new Error('Could not ascertain input format');
//     }

//     switch (exportFormat) {
//         case 'geojson': return JSON.stringify(geometry);
//         case 'gml': return geomToGml(geometry);
//         case 'wkt': return WKT.convert(geojson);
//     }
// }