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

import { GeoJSON, Geometry, GeometryCollection, Point } from 'geojson';
import { throwHttpError } from '../../../../utils/utils.js';
import { convert as convertCRS, getBbox, getCentroid } from './parsing/geojson.utils.js';
import { ParserFactory } from './parsing/ParserFactory.js';
import { ConversionMode, GeoFormat } from './types.js';

const DEFAULT_CRS = 'WGS84';

export interface ConversionSettings {
    importFormat: GeoFormat,
    importCRS?: string,
    exportFormat: GeoFormat,
    exportCRS?: string,
    mode: ConversionMode
}

export function convert(geometry: string, { importFormat, importCRS, exportFormat, exportCRS, mode }: ConversionSettings): string {

    if (importFormat == 'geojson' && importCRS != DEFAULT_CRS
        || exportFormat == 'geojson' && exportCRS != DEFAULT_CRS
    ) {
        throwHttpError(400, 'GeoJSON is always represented in WGS84 but you specified a different CRS');
    }

    let geojson = ParserFactory.get(importFormat).parse(geometry, importCRS);
    // TODO handle exportCRS if given
    // if (exportCRS != DEFAULT_CRS) {
    //     geojson = convertCRS(geojson, exportCRS);
    // }
    if (mode == 'bbox') {
        geojson = getBbox(geojson) as GeoJSON;
    }
    else if (mode == 'centroid') {
        geojson = getCentroid(geojson as Geometry | GeometryCollection) as Point;
    }
    return ParserFactory.get(exportFormat).write(geojson);
}
