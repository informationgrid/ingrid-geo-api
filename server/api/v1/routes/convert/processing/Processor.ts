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

export interface Processor {

    // /**
    //  * 
    //  * @param geometry string representing a geometry in this processor's format
    //  * @returns the CRS name if it can be extracted from the body, {DEFAULT_CRS} otherwise
    //  */
    // getCRS(geometry: string): string;

    /**
     * Preprocess a geometry string.
     * 
     * @param geometry string representing a geometry in this processor's format
     * @returns a GeoJSON representation of the input geometry string
     */
    preprocess(geometry: string): string;

    /**
     * Postprocess a geometry string.
     * 
     * @param geometry string representing a geometry in this processor's format
     * @param options processor-specific options for affecting the output
     * @returns a string representation of the input geometry in this parser's format
     */
    postprocess(geometry: string, options?: ProcessingOptions): string;

    /**
     * Get the GDAL options for this processor.
     * 
     * @param geometry string representing a geometry in this processor's format
     * @returns various GDAL options to use in ogr2ogr calls
     */
    gdalOptions(geometry?: string): GdalOpts;
}

export type GdalOpts = {
    driver: string,
    format: string,
    openOptions: string[],
    outputOptions: string[]
}

export type ProcessingOptions = {
    pretty?: boolean
}
