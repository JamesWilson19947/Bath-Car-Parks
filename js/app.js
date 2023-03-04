run();

async function run() {

    try {
        map = L.map('map').setView([51.382168, -2.363052], 16);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);


        // Get user location
        let userLocation = null;
        if (navigator.geolocation) {
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 });
                });
                userLocation = [position.coords.latitude, position.coords.longitude];
            } catch (error) {
                handleGeolocationError(error);
            }
        }

        // Fetch car park data
        const response = await fetch('/car-parks');
        const data = await response.json();
        await renderCarParks(data, userLocation, map);

    } catch (error) {
        console.error(error);
    }

}

function handleGeolocationError(error) {
    if (error.code === 1) {
        console.log('User denied location permission');
    } else if (error.code === 2) {
        console.log('Location unavailable');
    } else if (error.code === 3) {
        console.log('Timeout expired');
    } else {
        console.log('Failed to get user location:', error.message);
    }
}

async function renderCarParks(data, userLocation, map) {
    const carParkTableBody = document.getElementById('carParkTableBody');

    // Render car park markers on map
    data.forEach((carPark) => {
        const latitude = carPark.lat
        const longitude = carPark.lng
        const occupancyPercentage = Math.round((carPark.occupancy / carPark.capacity) * 100);
        const fillColor = getFillColor(occupancyPercentage);
        const radius = getRadius(occupancyPercentage);

        const marker = L.circleMarker([latitude, longitude], {
            radius: radius,
            fillColor: fillColor,
            fillOpacity: 0.5,
            stroke: true
        }).addTo(map);

        const icon = getIcon(carPark.status);
        const statusMarker = L.marker([latitude, longitude], { icon }).addTo(map);

        marker.bindPopup(createPopupContent(carPark));
        statusMarker.bindPopup(createPopupContent(carPark));
    });

    // Render car park data in table
    const tableRows = data.map((carPark) => {
        const { name, occupancy, capacity, freeSpaces, status } = carPark;
        const occupancyPercentage = Math.round((carPark.occupancy / carPark.capacity) * 100);
        const row = document.createElement('tr');
        const nameCell = createTableCell(name);
        const occupancyCell = createTableCell(`${occupancy}/${capacity} (${occupancyPercentage}%)`);
        const freeSpacesCell = createTableCell(capacity -occupancy);
        const statusCell = createTableCell(createStatusElement(carPark));
        const distanceCell = createTableCell(getDistanceText(carPark, userLocation));

        row.appendChild(nameCell);
        row.appendChild(occupancyCell);
        row.appendChild(freeSpacesCell);
        row.appendChild(statusCell);
        row.appendChild(distanceCell);
        return row;


    });

    // Only update the parts of the table that have changed
    updateTable(carParkTableBody, tableRows);
}

function createTableCell(text) {
    const cell = document.createElement('td');
    cell.textContent = text;
    return cell;
}

function createTableCell(text) {
    const cell = document.createElement('td');
    const span = document.createElement('span');
    span.innerHTML = text;
    cell.appendChild(span);
    return cell;
}
function createStatusElement(carPark) {
    const statusImg = getStatusImage(carPark.status);
    return `<img src="${statusImg}" style="width:20px;height:20px;"> ${carPark.status}`;
}


function updateTable(tableBody, newRows) {
    // Remove rows that are no longer in the new data
    for (let i = tableBody.children.length - 1; i >= newRows.length; i--) {
        tableBody.removeChild(tableBody.children[i]);
    }

    // Replace existing rows with new data
    for (let i = 0; i < newRows.length; i++) {
        const newRow = newRows[i];
        const oldRow = tableBody.children[i];
        if (oldRow) {
            tableBody.replaceChild(newRow, oldRow);
        } else {
            tableBody.appendChild(newRow);
        }
    }
}

function createPopupContent(carPark) {
    const { name, occupancy, capacity, occupancyPercentage, status, lastUpdated } = carPark;
    return `<h3>${name}</h3> <p>Occupancy: ${occupancy}/${capacity} (${occupancyPercentage}%)</p> <p>Status: ${status}</p> <p>Last updated: ${lastUpdated}</p>;`
}

function getDistanceText(carPark, userLocation) {
    if (userLocation) {
        const distanceInMiles = getDistanceInMiles(userLocation[0], userLocation[1], carPark.lat, carPark.lng);
        return `${Math.round(distanceInMiles * 10) / 10} mi`;
    } else {
        return 'N/A';
    }
}

function getFillColor(occupancyPercentage) {
    if (occupancyPercentage < 50) {
        return '#00FF00'; // green
    } else if (occupancyPercentage < 75) {
        return '#FFFF00'; // yellow
    } else {
        return '#FF0000'; // red
    }
}

function getRadius(occupancyPercentage) {
    const minRadius = 10; // minimum radius size in pixels
    return Math.max(Math.sqrt(occupancyPercentage) * 10, minRadius);
}

function getStatusImage(status) {
    if (status === 'Filling') {
        return '/images/up-arrow.png';
    } else if (status === 'Emptying') {
        return '/images/down-arrow.png';
    } else {
        return '/images/side-arrow.png';
    }
}

function getIcon(status) {
    const statusImg = getStatusImage(status);
    return L.icon({
        iconUrl: statusImg,
        iconSize: [50, 50]
    });
}

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
}

function getDistanceInMiles(lat1, lon1, lat2, lon2) {
    const earthRadiusInMiles = 3958.8;
    const dLat = degreesToRadians(lat2 - lat1);
    const dLon = degreesToRadians(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusInMiles * c;
}

function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}
