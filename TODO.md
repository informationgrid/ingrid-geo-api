# TODO

* add query parameter to automatically fix linear ring direction to counter-clockwise, ignore it, or throw 400
    * currently, GML input is fixed automatically if it is consistent (i.e. exterior and interior have different directions)
    * currently, GEOJSON and WKT direction is ignored (no error, no fix)
