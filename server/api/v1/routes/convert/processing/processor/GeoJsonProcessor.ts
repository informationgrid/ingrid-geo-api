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

import { GdalOpts, ProcessingOptions, Processor } from '../Processor.js';

const JSON_INDENTATION = 2;

export class GeoJsonProcessor implements Processor {

    preprocess(geometry: string): string {
        let geojson = JSON.parse(geometry);
        // -- workaround start
        // see https://github.com/OSGeo/gdal/issues/11484
        if (geojson.type != 'FeatureCollection') {
            let feature = geojson.type == 'Feature' ? geojson : { type: 'Feature', geometry: geojson };
            geojson = {
                type: 'FeatureCollection',
                features: [feature]
            };
            geometry = JSON.stringify(geojson);
        }
        if (!geojson.name) {
            geojson = { ...geojson, name: 'layer' };
            geometry = JSON.stringify(geojson);
        }
        // -- workaround end
        return geometry;
    }

    postprocess(geometry: string, { extractGeometry = true, pretty = true }: GeoJsonProcessingOptions = {}): string {
        if (extractGeometry) {
            let geojson = JSON.parse(geometry);
            let geometries = geojson['features'].map((feature: { geometry: any[] }) => feature.geometry);
            if (geometries.length == 1) {
                return JSON.stringify(geometries[0], null, pretty ? JSON_INDENTATION : null);
            }
            else {
                return JSON.stringify(geometries, null, pretty ? JSON_INDENTATION : null);
            }
        }
        if (pretty) {
            geometry = JSON.stringify(JSON.parse(geometry), null, JSON_INDENTATION);
        }
        return geometry;
    }

    gdalOptions(): GdalOpts {
        return {
            driver: 'GeoJSON',
            format: 'GeoJSON',
            openOptions: [],
            outputOptions: []
        };
    }
}

export type GeoJsonProcessingOptions = {
    extractGeometry?: boolean;
    // mergeFeatures?: boolean;
} & ProcessingOptions;
