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

import { GeoJSON, Geometry, GeometryCollection, Point } from 'geojson';
import { getBbox, getCentroid, project } from './parsing/geojson.utils.js';
import { ParserFactory } from './parsing/ParserFactory.js';
import { ConversionMode, GeoFormat } from './types.js';

export const DEFAULT_CRS = 'WGS84';

export interface ConversionSettings {
    importCRS: string,
    exportFormat: GeoFormat,
    exportCRS: string,
    mode: ConversionMode
}

export function convert(geojson: GeoJSON, { importCRS, exportFormat, exportCRS, mode }: ConversionSettings): string {
    if (mode == 'bbox') {
        geojson = getBbox(geojson) as GeoJSON;
    }
    else if (mode == 'centroid') {
        geojson = getCentroid(geojson as Geometry | GeometryCollection) as Point;
    }
    if (importCRS != DEFAULT_CRS || exportCRS != DEFAULT_CRS) {
        geojson = project(geojson, importCRS, exportCRS);
    }
    return ParserFactory.get(exportFormat).write(geojson);
}
