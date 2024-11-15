# README

This API converts geometry information from and to various formats.
Additionally, it can create centroid and bbox information.

The default port is 3000 and can be changed using the `GEO_API_PORT` environment variable.


## Endpoints

### GET `/info`

Returns general information on API use.

### POST `/convert`

Converts a given geometry object from and to one of the [supported formats](#formats).
If the input format is not given via the `importFormat` query parameter, a simple heuristic is used to deduce it.
The export format has to be specified via the `exportFormat` query parameter.

Also supports calculation of the centroid or the bounding box of a given geometry, via the `mode` parameter.

#### Query Parameters

Required:
* `exportFormat` - One of [`geojson`, `gml`, `wkt`]

Optional:
* `importFormat` - One of [`geojson`, `gml`, `wkt`]
* `importCRS` - TODO
* `exportCRS` - TODO
* `mode` - One of [`full`, `centroid`, `bbox`]. Defaults to `full`

#### Body

The to-be-converted geometry object in one of the [supported formats](#formats).

Example `GeoJSON`:
```
{
    "type": "GeometryCollection",
    "geometries": [
        {
            "type": "Point",
            "coordinates": [40, 10]
        },
        {
            "type": "LineString",
            "coordinates": [[10, 10], [20, 20], [10, 40]]
        },
        {
            "type": "Polygon",
            "coordinates": [[[40, 40], [20, 45], [45, 30], [40, 40]]]
        }
    ]
}
```

Example `GML`:
```
<gml:MultiGeometry>
    <gml:geometryMembers>
        <gml:Point>
            <gml:pos>40 10</gml:pos>
        </gml:Point>
        <gml:LineString>
            <gml:posList>10 10 20 20 10 40</gml:posList>
        </gml:LineString>
        <gml:Polygon>
            <gml:exterior>
                <gml:LinearRing>
                    <gml:posList>40 40 20 45 45 30 40 40</gml:posList>
                </gml:LinearRing>
            </gml:exterior>
        </gml:Polygon>
    </gml:geometryMembers>
</gml:MultiGeometry>
```

Example `WKT`:
```
GEOMETRYCOLLECTION (POINT (40 10),
LINESTRING (10 10, 20 20, 10 40),
POLYGON ((40 40, 20 45, 45 30, 40 40)))
```


## Formats

Supported formats for input and output (parameter in parentheses) are
* GeoJSON (`geojson`)
* GML (`gml`)
* WKT (`wkt`)
