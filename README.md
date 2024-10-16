# README

This API converts geometry information from and to various formats.
Additionally, it creates centroid and bbox information.


## Endpoints

### `/convert`

Converts a given geometry object from and to one of the supported formats. The input format is recognized automatically, the export format has to be specified via query parameter.

#### Body
The to-be-converted geometry object in one of the supported formats.

#### Parameter
* `exportCRS` - TODO
* `exportFormat` - One of [`geojson`, `gml`, `wkt`]
* `mode` - TODO


## Formats

Supported formats are:
* GeoJSON (`geojson`)
* GML (`gml`)
* WKT (`wkt`)
