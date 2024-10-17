# README

This API converts geometry information from and to various formats.
Additionally, it can create centroid and bbox information.


## Endpoints

### GET `/info`

Returns general information on API use.

### POST `/convert`

Converts a given geometry object from and to one of the supported formats. The input format is recognized automatically, the export format has to be specified via query parameter.

Also supports calculation of the centroid or the bounding box of a given geometry, via the `mode` parameter.

#### Body
The to-be-converted geometry object in one of the supported formats.

#### Query Parameters
* `exportCRS` - TODO
* `exportFormat` - One of [`geojson`, `gml`, `wkt`]
* `mode` - One of [`full`, `centroid`, `bbox`]. Defaults to `full`


## Formats

Supported formats (parameter in parentheses) are
* GeoJSON (`geojson`)
* GML (`gml`)
* WKT (`wkt`)
