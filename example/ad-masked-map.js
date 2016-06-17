'use strict'

/* Function to focus on a particular feature by converting the inverse-mask
GeoJSON to a vector mask, and zooming to the field's footprint. */
const focusOnFeature = (fieldJson) => {
  L.geoJson(fieldJson, {
      fillOpacity: 1,
      fillColor: '#000',
      weight: 0
    }).addTo(map);
  map.fitBounds(fieldJson.properties.bounds);
}

/* Function used to initialize a map component using an NDVI image as the
basemap instead of the default satellite imagery. */
const setupMap = (mbAccessToken, ndviBasemap) => {
  const basemapUrl = `http://api.tiles.mapbox.com/v4/${ndviBasemap}/{z}/{x}/{y}.png`;
  const map = L.map('map').setView([0, 0], 0);
  L.tileLayer(`${basemapUrl}?access_token=${mbAccessToken}`).addTo(map);
  return map;
}



/ !!! PROGRAM BEGINS HERE !!! /

/* Rather than initializing a map with Mapbox's standard satellite
basemap, we will use an Astro Digital NDVI image surface as the basemap. We will
then use our polygon data to focus on on the pixel values within individual
fields, by zooming to their area and masking the surrounding imagery.

A feature mask can be created by developing a multi-polygon where the outer
area is a rectangle representing the full area of the world, and the inner
ring (hole) is the area of each field.

Begin by mapping over the NDVI results data to create an array of GeoJSON
where the geometry of each feature consists of a -180/-90 to 180/90
coordinate array and the original field's coordinates. */
let fieldsJson = adNdviData.results.map((field) => {
  const id = field.id;
  field = field.value;
  /* Save the original field boundaries as a property, so that they can
  // later be used to focus on the field. */
  field.properties.bounds = L.geoJson(field).getBounds();
  field.properties.id = id;
  /* Assemble the mask from a coordinate array representing the world's area
  and each field's native geometry. */
  field.geometry.coordinates = [
    [
      [-180, -90],
      [-180, 90],
      [180, 90],
      [180, -90],
      [-180, -90]
    ],
    field.geometry.coordinates[0]
  ]
  return field;
})

const mbAccessToken = 'pk.eyJ1IjoiYXN0cm9kaWdpdGFsIiwiYSI6ImNVb1B0ZkEifQ.IrJoULY2VMSBNFqHLrFYew';
const ndviBasemap = 'astrodigital.56effcd44936180007240bae';
// Call the setupMap function with the NDVI basemap as one of its arguments.
const map = setupMap(mbAccessToken, ndviBasemap);

// Cycle through fields, sending one at a time to the focusOnFeature function.
let displayIndex = 0;
setInterval(() => {
  // Remove previous mask, if applicable.
  map.eachLayer((lyr) => {if (!lyr._tiles) map.removeLayer(lyr)})
  // Focus on feature.
  focusOnFeature(fieldsJson[displayIndex])
  // Repeat loop after all fields have been cycled through.
  displayIndex = (displayIndex < fieldsJson.length - 1) ? displayIndex + 1 : 0;
}, 2500);
