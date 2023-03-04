mapboxgl.accessToken = '<YOUR_MAPBOX_ACCESS_TOKEN>';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v11',
  center: [-2.3838943174822416, 51.35293692981349],
  zoom: 13
});

map.on('load', () => {
  map.addSource('car-parks', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: formattedData
    }
  });

  map.addLayer({
    id: 'car-parks',
    type: 'circle',
    source: 'car-parks',
    paint: {
      'circle-radius': {
        property: 'capacity',
        stops: [
          [0, 0],
          [1000, 20],
          [2000, 30],
          [3000, 40]
        ]
      },
      'circle-color': {
        property: 'occupancy',
        stops: [
          [0, 'green'],
          [50, 'yellow'],
          [100, 'red']
        ]
      }
    }
  });
});