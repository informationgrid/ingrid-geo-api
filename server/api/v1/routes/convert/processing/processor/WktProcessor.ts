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

import { GdalOpts as GdalOptions, ProcessingOptions, Processor } from '../Processor.js';

export class WktProcessor implements Processor {

    preprocess(geometry: string): string {
        // convert this to a simple CSV
        // return geometry.replaceAll('\n', '');
        return `WKT\n"${geometry.replaceAll('\n', '')}"`;
    }

    postprocess(geometry: string, options?: WktProcessingOptions): string {
        // convert this from the retrieved CSV
        geometry = geometry.split('\n')[1].replace(/"/g, '');
        return geometry;
    }

    gdalOptions(): GdalOptions {
        return {
            driver: 'CSV',
            format: 'CSV',
            openOptions: ['-oo', 'KEEP_GEOM_COLUMNS=NO'],
            outputOptions: ['-lco', 'GEOMETRY=AS_WKT', '-lco', 'GEOMETRY_NAME=WKT', '-lco', 'STRING_QUOTING=ALWAYS', '-lco', 'LINEFORMAT=LF']
        };
    }
}

export type WktProcessingOptions = {
    // tagging type
} & ProcessingOptions;
