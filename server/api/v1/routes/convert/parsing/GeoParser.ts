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

import { GeoJSON } from 'geojson';

export interface GeoParser {
    /**
     * Parse a GeoJSON from a given geometry string.
     * 
     * @param geometry string representing a geometry in this parser's format
     * @param crs coordinate reference system of the input geometry
     * @returns a GeoJSON representation of the input geometry string
     */
    parse(geometry: string, crs?: string): GeoJSON;

    /**
     * Returns a string representation of this parser's format.
     * 
     * @param geojson GeoJSON to convert to this parser's format
     */
    write(geojson: GeoJSON): string;
}
