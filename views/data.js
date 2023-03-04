async function getData() {
    try {
        const response = await fetch('/car-parks');
        const data = await response.json();
        console.log(data);

        // Add circles for each car park and update the table
        const carParkTableBody = document.getElementById('carParkTableBody');
        carParkTableBody.innerHTML = ''; // clear previous data
        data.forEach((carPark) => {
            // Calculate the radius of the circle based on the percentage of occupancy
            const minRadius = 10; // minimum radius size in pixels
            const radius = Math.max(Math.sqrt(carPark.percentage) * 10, minRadius);

            // Determine the fill color based on the percentage of occupancy
            let fillColor;
            if (carPark.percentage < 50) {
                fillColor = '#00FF00'; // green
            } else if (carPark.percentage < 75) {
                fillColor = '#FFFF00'; // yellow
            } else {
                fillColor = '#FF0000'; // red
            }

            if (carPark.status == 'Filling') {
                statusImg = '/images/up-arrow.png';
                icon = L.icon({
                    iconUrl: statusImg,
                    iconSize: [50, 50],
                });

            } else if (carPark.status == 'Emptying') {
                statusImg = '/images/down-arrow.png';
                icon = L.icon({

                    iconUrl: statusImg,
                    iconSize: [50, 50],
                });
            } else {
                statusImg = '/images/side-arrow.png';
                icon = L.icon({
                    iconUrl: statusImg,
                    iconSize: [50, 50],
                });
            }


            // Create the circle and add it to the map
            const circle = L.circleMarker([carPark.lat, carPark.lng], {
                radius: radius,
                fillColor: fillColor,
                fillOpacity: 0.6,
                stroke: true
            }).addTo(map);

            const status = L.marker([carPark.lat, carPark.lng], { icon }).addTo(map);
            const freeSpaces = Math.max(carPark.capacity - carPark.occupancy, 0);

            // Add a row to the table
            const row = carParkTableBody.insertRow();
            const nameCell = row.insertCell();
            const occupancyCell = row.insertCell();
            const freeSpacesCell = row.insertCell();
            const statusCell = row.insertCell();
            nameCell.textContent = carPark.name;
            occupancyCell.textContent = `${carPark.occupancy}/${carPark.capacity} (${carPark.percentage}%)`;
            occupancyCell.classList.add(carPark.percentage < 50 ? 'low-occupancy' : (carPark.percentage < 75 ? 'medium-occupancy' : 'high-occupancy'));
            freeSpacesCell.textContent = freeSpaces;

            // Create the image element and set its source to the statusImg variable
            const statusImgEl = document.createElement('img');
            statusImgEl.src = statusImg;
            statusImgEl.style.width = '20px';
            statusImgEl.style.height = '20px';

            // Append the image element to the status cell
            statusCell.appendChild(statusImgEl);
            statusCell.appendChild(document.createTextNode(carPark.status));

            // Add a popup with car park information to the circle
            circle.bindPopup(createPopupContent(carPark));
            status.bindPopup(createPopupContent(carPark));
        });
        function createPopupContent(carPark) {
            return `
            <h3>${carPark.name}</h3>
            <p>Occupancy: ${carPark.occupancy}/${carPark.capacity} (${carPark.percentage}%)</p>
            <p>Status: ${carPark.status}</p>
            <p>Last updated: ${carPark.lastUpdated}</p>`;
        }
    } catch (error) {
        console.error(error);
    }
        getData();
}

export default getData;