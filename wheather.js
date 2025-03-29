const apiKey = "4aa450041973ce1f6f3023cbd830a8f0";
const apiUrl = "https://api.openweathermap.org/data/2.5/weather";
const forecastUrl = "https://api.openweathermap.org/data/2.5/forecast";

async function getWeather() {
    try {
    let city = document.getElementById("searchBox").value.trim();
    if (!city) return alert("Please enter a city name");

        let response = await fetch(`${apiUrl}?q=${city}&appid=${apiKey}&units=metric`);
        let data = await response.json();
        console.log(data)

        if (data.cod !== 200) {
            alert("City not found!");
            return;
        }

       await updateWeatherUI(data);

        // Fetch Forecasts using city coordinates
        let { lat, lon } = data.coord;
        getForecast(lat, lon);
        getHourlyForecast(lat, lon);

    } catch (error) {
        console.log(error)
        // alert("Something went wrong! Please try again.");
    }
}

async function updateWeatherUI(data) {
    document.getElementById("cityName").innerText = data.name;
    document.getElementById("temperature").innerText = `${Math.round(data.main.temp)}°C`;
    document.getElementById("condition").innerText = capitalizeFirstLetter(data.weather[0].description);
    document.getElementById("humidity").innerText = `Humidity: ${data.main.humidity}%`;
    console.log(data.wind.speed)
    document.getElementById("windSpeed").innerText = `Wind Speed: ${Math.round(data.wind.speed * 3.6)} km/h`;
    

    // Convert sunrise and sunset timestamps
    const sunriseTime = formatTime(data.sys.sunrise);
    const sunsetTime = formatTime(data.sys.sunset);

    // Update UI elements
    document.getElementById("sunriseTime").innerText = ` ${sunriseTime}`;
    document.getElementById("sunsetTime").innerText = `Sunset: ${sunsetTime}`;
     // Call function to update date and time
     updateTime();

}
// Function to convert Unix timestamp to readable time
function formatTime(timestamp) {
    const date = new Date(timestamp * 1000); // Convert seconds to milliseconds
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const amPm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12 || 12; // Convert to 12-hour format
    minutes = minutes.toString().padStart(2, "0");

    return `${hours}:${minutes} ${amPm}`;
}

function updateTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const seconds = now.getSeconds().toString().padStart(2, "0");

    document.querySelector(".time").textContent = `${hours}:${minutes}:${seconds}`;

    // Update Date
    const options = { weekday: "long", day: "numeric", month: "long" };
    document.querySelector(".date").textContent = now.toLocaleDateString("en-US", options);
}

// Update time every second
setInterval(updateTime, 1000);
async function getForecast(lat, lon) {
    try {
        let response = await fetch(`${forecastUrl}?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        let data = await response.json(); // Now 'data' is correctly defined
        console.log("API Response:", data); // Debugging: Check API response

        if (!data.list) {
            console.error("Invalid API response:", data);
            alert("Weather data not available.");
            return;
        }

        let forecastContainer = document.getElementById("forecastContainer");
        forecastContainer.innerHTML = "<h2>5 Days Forecast:</h2>";

        let dailyForecasts = {};
        for (let forecast of data.list) {
            // console.log(forecast)
            let date = forecast.dt_txt.split(" ")[0]; 
            if (!dailyForecasts[date] || Math.abs(new Date(forecast.dt_txt).getHours() - 12) < Math.abs(new Date(dailyForecasts[date].dt_txt).getHours() - 12)) {
                dailyForecasts[date] = forecast;
            }
        }

        Object.keys(dailyForecasts).slice(0, 5).forEach(date => {
            let forecast = dailyForecasts[date];
            let weatherIcon = forecast.weather[0].icon;
            let temp = Math.round(forecast.main.temp);
            let description = capitalizeFirstLetter(forecast.weather[0].description);

            let forecastElem = document.createElement("div");
            forecastElem.classList.add("forecast-item");

            let imgElem = document.createElement("img");
            imgElem.src = `https://openweathermap.org/img/wn/${weatherIcon}.png`;
            imgElem.classList.add("icon");
            imgElem.alt = description;

            let detailsDiv = document.createElement("div");
            detailsDiv.classList.add("forecast-details");
            detailsDiv.innerHTML = `
                <span class="temp">${temp}°C</span>
                <span class="date">${formatDate(date)}</span>
            `;

            forecastElem.appendChild(imgElem);
            forecastElem.appendChild(detailsDiv);
            forecastContainer.appendChild(forecastElem);
        });

    } catch (error) {
        console.error("Error fetching forecast data:", error);
        alert("Failed to load weather data. Please try again.");
    }
}
console.log("API Response:", data);
// Function to format the date
function formatDate(dateString) {
    let options = { weekday: 'long', day: 'numeric', month: 'short' };
    let date = new Date(dateString);
    return date.toLocaleDateString('en-US', options);
}


async function getHourlyForecast(lat, lon) {
    try {
        let response = await fetch(`${forecastUrl}?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
        let data = await response.json();

        let hourlyForecastContainer = document.getElementById("hourlyForecastContainer");
        hourlyForecastContainer.innerHTML = "";

        let forecasts = data.list.slice(0, 5); // Get first 6 forecast entries
        let cityTimeOffset = data.city.timezone; // Timezone offset in seconds

        forecasts.forEach(forecast => {
            let utcTime = forecast.dt + cityTimeOffset; // Convert to city local time
            let date = new Date(utcTime * 1000);
            
            // Force time to be in fixed 3-hour intervals (e.g., 12:00, 15:00, 18:00)
            let hours = date.getUTCHours(); // Get city-adjusted hours
            let fixedHours = hours - (hours % 3); // Round to nearest 3-hour interval
            let formattedTime = `${String(fixedHours).padStart(2, '0')}:00`; // Ensure "HH:00" format

            let temp = Math.round(forecast.main.temp);
            let windSpeed = Math.round(forecast.wind.speed);
            let icon = `https://openweathermap.org/img/wn/${forecast.weather[0].icon}.png`;

            let card = `
                <div class="hourly-card">
                    <p>${formattedTime}</p>
                    <img src="${icon}" alt="Weather">
                    <p class="hourly-temp">${temp}°C</p>
                    <p>${windSpeed} km/h</p>
                </div>
            `;
            hourlyForecastContainer.innerHTML += card;
        });
    } catch (error) {
        console.error("Error fetching hourly forecast:", error);
    }
}

function formatDate(dateString) {
    let options = { weekday: "long", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Dark Mode Toggle
document.addEventListener("DOMContentLoaded", function () {
    const toggleSwitch = document.getElementById("darkModeToggle");

    if (localStorage.getItem("darkMode") === "enabled") {
        document.body.classList.add("dark-mode");
        toggleSwitch.checked = true;
    }

    toggleSwitch.addEventListener("change", function () {
        document.body.classList.toggle("dark-mode");
        localStorage.setItem("darkMode", document.body.classList.contains("dark-mode") ? "enabled" : "disabled");
    });
});

// Fetch Weather by Current Location
function getCurrentLocation() {
    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        let response = await fetch(`${apiUrl}?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`);
        let data = await response.json();

        updateWeatherUI(data);
        getForecast(latitude, longitude);
        getHourlyForecast(latitude, longitude);
    });
}

// Auto-fetch for a default city
getWeather("New York"); // Change as needed