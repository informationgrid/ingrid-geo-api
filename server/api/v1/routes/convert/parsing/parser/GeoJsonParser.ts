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

import { check } from '@placemarkio/check-geojson';
import { GeoJSON } from 'geojson';
import { GeoParser } from '../GeoParser.js';

export class GeoJsonParser implements GeoParser {

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    parse(geometry: string, crs?: string): GeoJSON {
        // use @placemarkio/check-geojson instead of JSON.parse because it validates GeoJSON
        // return JSON.parse(geometry);
        try {
            return check(geometry);
        }
        catch (e) {
            let issue = e?.issues?.[0];
            if (!issue) {
                throw e;
            }
            throw `${issue.message} [${issue.from},${issue.to}]`;
        }
    }

    write(geojson: GeoJSON): string {
        return JSON.stringify(geojson);
    }
}
