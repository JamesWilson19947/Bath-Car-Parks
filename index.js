const express = require('express');
const axios = require('axios');
const https = require('https');
const path = require('path');
const cors = require('cors');

const app = express();

const { constants } = require('crypto');

const agent = new https.Agent({
    rejectUnauthorized: false,
    secureOptions: constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION
});

// Set EJS as the default engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

// enable CORS
app.use(cors());
app.use('/images', express.static(path.join(__dirname, 'images')));
// remove the code to get data from app.js and put it in /car-parks route handler
app.get('/car-parks', async (req, res) => {
    try {
        const response = await axios.get('https://data.bathnes.gov.uk/geoserver/parking/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=parking%3ACarParkOccupancy&maxFeatures=50&outputFormat=application%2Fjson', {
            httpsAgent: agent
        });

        const data = response.data;

        const formattedData = data.features.map((feature) => {
            return {
                id: feature.properties.ID,
                name: feature.properties.Name,
                description: feature.properties.Description,
                capacity: feature.properties.Capacity,
                occupancy: feature.properties.Occupancy,
                percentage: feature.properties.Percentage,
                location: feature.properties.Location,
                lat: feature.properties.lat,
                lng: feature.properties.lng,
                status: feature.properties.Status,
                lastUpdated: feature.properties.LastUpdatedText
            };
        });

        res.json(formattedData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/', (req, res) => {
    res.render('index');
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
