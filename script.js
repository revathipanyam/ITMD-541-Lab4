// script.js

// Standard request:
// https://api.sunrisesunset.io/json?lat=38.907192&lng=-77.036873

// Specific date and setting timezone request: 
// https://api.sunrisesunset.io/json?lat=38.907192&lng=-77.036873&timezone=UTC&date=1990-05-22

// Date range request:
// https://api.sunrisesunset.io/json?lat=38.907192&lng=-77.036873&date_start=1990-05-01&date_end=1990-07-01

document.addEventListener('DOMContentLoaded', function () {
    // Elements
    const geolocationBtn = document.getElementById('geolocationBtn');
    const searchBtn = document.getElementById('searchBtn');
    const locationSearch = document.getElementById('locationSearch');
    const errorContainer = document.getElementById('errorContainer');
    document.addEventListener('click', handleCodeClick);

    // Event listeners
    geolocationBtn.addEventListener('click', getUserLocation);
    searchBtn.addEventListener('click', function () {
        searchLocation();
    });

    // Functions

    function handleCodeClick(event) {
        const codeElement = event.target.closest('code');
        if (codeElement && codeElement.firstChild && codeElement.firstChild.nodeType === 3) {
            // Extract the URL from the text content of the code element
            const url = codeElement.firstChild.nodeValue.trim();
            if (url) {
                // Open the URL in a new tab or window
                window.open(url, '_blank');
            }
        }
    }
    
    function getUserLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function (position) {
                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;
                    fetchDataForLocation(latitude, longitude, "auto");
                },
                function (error) {
                    displayError(`Geolocation error: ${error.message}`);
                }
            );
        } else {
            displayError('Geolocation is not supported by this browser.');
        }
    }
    
    function searchLocation() {
        const searchedLocation = locationSearch.value;
        // Implement logic to search for a location using the geocode API
        // and then fetch sunrise and sunset data for the found location
        fetchLocationAndData(searchedLocation);
    }

    async function fetchDataForLocation(latitude, longitude, method) {
        console.log(latitude, longitude)
        // Create a new Date object
        var today = new Date();

        // Get the current year, month, and day
        var year = today.getFullYear();
        var month = ('0' + (today.getMonth() + 1)).slice(-2); // Add leading zero if needed
        var day = ('0' + today.getDate()).slice(-2); // Add leading zero if needed

        // Format the date as "YYYY-MM-DD"
        var formattedDate = year + '-' + month + '-' + day;

        var nextDay = new Date(today);
        nextDay.setDate(today.getDate() + 1);

        // Get the year, month, and day of the next day
        var nextYear = nextDay.getFullYear();
        var nextMonth = ('0' + (nextDay.getMonth() + 1)).slice(-2); // Add leading zero if needed
        var nextDayOfMonth = ('0' + nextDay.getDate()).slice(-2); // Add leading zero if needed

        // Format the next day's date as "YYYY-MM-DD"
        var formattedNextDay = nextYear + '-' + nextMonth + '-' + nextDayOfMonth;

        console.log("Next day's date is: " + formattedNextDay);

        // Implement logic to fetch data from the Sunrise Sunset API
        // Use the location parameter to specify the location in the API request
        const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
        const apiUrl = `https://api.sunrisesunset.io/json?lat=${latitude}&lng=${longitude}&date_start=${formattedDate}&date_end=${formattedNextDay}`;
        await fetch(proxyUrl + apiUrl)
            .then(response => response.json())
            .then(data => {
                $('#popupModal').modal('show');
                // Update the DOM with the received data
                if(method = "auto") {
                    const [country, cityName] = data.results[0].timezone.split('/'); // Replace 'city' with the actual property in the response containing the city name
                    updateModalTitle(cityName);
                }
                updateDashboard(data.results[0], data.results[1]);
                displayError('');
            })
            .catch(error => {
                // Handle errors and display error message
                displayError(error.message);
            });
    }

    function fetchLocationAndData(searchedLocation) {
        console.log(searchedLocation);
        const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
        const geocodeApiUrl = `https://geocode.maps.co/search?q=${searchedLocation}`;
        console.log(geocodeApiUrl)
        fetch(proxyUrl + geocodeApiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Network response was not ok: ${response.statusText}`);
                }

                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    throw new Error('The response is not in JSON format. Please try again with a different location.');
                }
                console.log(response, "amith")
                return response.json();
            })
            .then(geocodeData => {
                console.log(geocodeData[0]);
                const cityName = searchedLocation; // Replace 'city' with the actual property in the response containing the city name
                updateModalTitle(cityName);
                
                const latitude = geocodeData[0].lat;
                const longitude = geocodeData[0].lon;
                // Fetch sunrise and sunset data using the obtained latitude and longitude
                fetchDataForLocation(latitude, longitude, "manual");
            })
            .catch(error => {
                // Handle errors from the geocode API
                console.log(error.message);
                if(error.message.includes('Cannot')) {
                    displayError("Please provide a City name")
                } else {
                    displayError(error.message);
                }
            });
    }

    function updateModalTitle(cityName) {
        const modalTitle = document.getElementById('popupModalLabel');
        modalTitle.innerText = `${cityName} weather`;
    }

    function updateDashboard(todayData, tomorrowData) {
        // Update spans for today
        updateDayInfo(todayData, 'sunriseToday', 'sunsetToday', 'dawnToday', 'duskToday', 'dayLengthToday', 'solarNoonToday', 'timeZoneToday');

        // Update spans for tomorrow
        updateDayInfo(tomorrowData, 'sunriseTomorrow', 'sunsetTomorrow', 'dawnTomorrow', 'duskTomorrow', 'dayLengthTomorrow', 'solarNoonTomorrow', 'timeZoneTomorrow');
    }

    function updateDayInfo(data, sunriseId, sunsetId, dawnId, duskId, dayLengthId, solarNoonId, timeZoneId) {
        console.log(data)
        const sunriseSpan = document.getElementById(sunriseId);
        const sunsetSpan = document.getElementById(sunsetId);
        const dawnSpan = document.getElementById(dawnId);
        const duskSpan = document.getElementById(duskId);
        const dayLengthSpan = document.getElementById(dayLengthId);
        const solarNoonSpan = document.getElementById(solarNoonId);
        const timeZoneSpan = document.getElementById(timeZoneId);
    
        // Format the time to display only hours and minutes
        const formatTime = (time) => {
            const [hours, minutes, meridian] = time.split(':');
            const [seconds, meridianIndicator] = meridian.split(" ");
            return `${hours}:${minutes} ${meridianIndicator}`;
        };
    
        const dayLightFormatTime = (time) => {
            const [hours, minutes] = time.split(':');
            return hours + 'h ' + minutes + 'm';
        };
    
        // Update spans with corresponding data
        sunriseSpan.innerText = formatTime(data.sunrise);
        sunsetSpan.innerText = formatTime(data.sunset);
        dawnSpan.innerText = formatTime(data.dawn);
        duskSpan.innerText = formatTime(data.dusk);
        dayLengthSpan.innerText = dayLightFormatTime(data.day_length);
        solarNoonSpan.innerText = formatTime(data.solar_noon);
        timeZoneSpan.innerText = data.timezone;
    }

    function displayError(errorMessage) {
        // Display error message in the errorContainer
        if(!errorMessage) {
            errorContainer.textContent = '';
        } else {
            errorContainer.textContent = `Error: ${errorMessage}`;
        }
    }

});
