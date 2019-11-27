$(document).ready(function () {

  // use school key inorder to get forecast data
  const apiKey = "166a433c57516f51dfab1f7edaed8413";
  let url = 'https://api.openweathermap.org/data/2.5/';
  let requestType = ""; 
  let query ="";
  //

  // pull current location
    $('#getWeather,#past-cities').on('click', function () {
   
    // get location from user input box
    let e = $(event.target)[0];
    console.log(e.id);
    let location = "";

    if (e.id === "getWeather" || e.id === "getWeatherIcon") {
    
      location = $('#city-search').val();
    } else if ( e.className === ("cityList") ) {
    
      location = e.innerText;
    }

    if (location == "") return;

    updateCityStore(location);
    getCurWeather(location);
    getForecastWeather(location);
   });

  function convertDate(epoch) {
    // function to convert unix epoch to local time
    // returns arr ["MM/DD/YYYY, HH:MM:SS AM", "MM/DD/YYYY", "HH:MM:SS AM"]
   
    let readable = [];
    let myDate = new Date(epoch * 1000);

    // local time
    // returns string "MM/DD/YYYY, HH:MM:SS AM"
    readable[0] = (myDate.toLocaleString());
    readable[1] = ((myDate.toLocaleString().split(", "))[0]);
    readable[2] = ((myDate.toLocaleString().split(", "))[1]);

    
    return readable;
  }

  function getCurLocation() {
    // This function is based on geoFindMe function found at
    //https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
    //this function return an object with the lat and lon of current location
   

    let location = {};

    function success(position) {
      

      location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        success: true
      }
     
      getCurWeather(location);
      getForecastWeather(location);
    }

    function error() {
      location = { success: false }
      console.log('Could not get location');
      return location;
    }

    if (!navigator.geolocation) {
      console.log('Geolocation is not supported by your browser');
    } else {
      navigator.geolocation.getCurrentPosition(success, error);
    }
  };

  function getCurWeather(loc) {
    // function to get current weather
    // returns object of current weather data


    drawHistory();
    // clear search field
    $('#city-search').val("");

    if (typeof loc === "object") {
      city = `lat=${loc.latitude}&lon=${loc.longitude}`;
    } else {
      city = `q=${loc}`;
    }

    // set queryURL based on type of query
    requestType = 'weather';
    query = `?${city}&units=imperial&appid=${apiKey}`;
    queryURL = `${url}${requestType}${query}`;

   
    // Create an AJAX call to retrieve data Log the data in console
    $.ajax({
      url: queryURL,
      method: 'GET'
    }).then(function (response) {
     

      weatherObj = {
        city: `${response.name}`,
        wind: response.wind.speed,
        humidity: response.main.humidity,
        temp: response.main.temp,
        date: (convertDate(response.dt))[1],
        icon: `http://openweathermap.org/img/w/${response.weather[0].icon}.png`,
        desc: response.weather[0].description
      }

      // calls function to draw results to page
      drawCurWeather(weatherObj);
      getUvIndex(response);
    });
  };

  function getForecastWeather(loc) {
    // function to get 5 day forecast data
    // returns array of daily weather objects
    


    if (typeof loc === "object") {
      city = `lat=${loc.latitude}&lon=${loc.longitude}`;
    } else {
      city = `q=${loc}`;
    }

    // array to hold all the days of results
    let weatherArr = [];
    let weatherObj = {};

    // set queryURL based on type of query
    requestType = 'forecast/daily';
    query = `?${city}&cnt=6&units=imperial&appid=${apiKey}`;
    queryURL = `${url}${requestType}${query}`;

    // Create an AJAX call to retrieve data Log the data in console
    $.ajax({
      url: queryURL,
      method: 'GET'
    }).then(function (response) {
    

      for (let i = 1; i < response.list.length; i++) {
        let cur = response.list[i]
        // TODO check for errors/no data
        weatherObj = {
          weather: cur.weather[0].description,
          icon: `http://openweathermap.org/img/w/${cur.weather[0].icon}.png`,
          minTemp: cur.temp.min,
          maxTemp: cur.temp.max,
          humidity: cur.humidity,
          date: (convertDate(cur.dt))[1]
        };

        weatherArr.push(weatherObj);
      }

      drawForecast(weatherArr);
    });
  };

  function drawCurWeather(cur) {
    // function to draw  weather all days
    // need logic to pick variables


    $('#forecast').empty(); 
    $('#cityName').text(cur.city + " (" + cur.date + ")");
    $('#curWeathIcn').attr("src", cur.icon);
    $('#curTemp').text("Temp: " + cur.temp + " F");
    $('#curHum').text("Humidity: " + cur.humidity + "%");
    $('#curWind').text("Windspeed: " + cur.wind + " MPH");
  };

  function drawForecast(cur) {
 

    for (let i = 0; i < cur.length; i++) {
      let $colmx1 = $('<div class="col mx-1">');
      let $cardBody = $('<div class="card-body forecast-card">');
      let $cardTitle = $('<h5 class="card-title">');
      $cardTitle.text(cur[i].date);


      let $ul = $('<ul>');

      let $iconLi = $('<li>');
      let $iconI = $('<img>');
      $iconI.attr('src', cur[i].icon);

      let $weathLi = $('<li>');
      $weathLi.text(cur[i].weather);

      let $tempMinLi = $('<li>');
      $tempMinLi.text('Min Temp: ' + cur[i].minTemp + " F");

      let $tempMaxLi = $('<li>');
      $tempMaxLi.text('Max Temp: ' + cur[i].maxTemp + " F");

      let $humLi = $('<li>');
      $humLi.text('Humidity: ' + cur[i].humidity + "%");

      // assemble element
      $iconLi.append($iconI);

      $ul.append($iconLi);
      $ul.append($weathLi);
      $ul.append($tempMinLi);
      $ul.append($tempMaxLi);
      $ul.append($humLi);

      $cardTitle.append($ul);
      $cardBody.append($cardTitle);
      $colmx1.append($cardBody);

      $('#forecast').append($colmx1);
    }
  };

  function getUvIndex(uvLoc) {
    
    // function to color uv index

      city = `lat=${parseInt(uvLoc.coord.lat)}&lon=${parseInt(uvLoc.coord.lon)}`;

    // set queryURL based on type of query
    requestType = 'uvi';
    query = `?${city}&appid=${apiKey}`;
    queryURL = `${url}${requestType}${query}`;

    // Create an AJAX call to retrieve data Log the data in console
    $.ajax({
      url: queryURL,
      method: 'GET'
    }).then(function (response) {
      let bkcolor = "violet";
      
     

      let uv = parseFloat(response.value);

      if (uv < 3) { 
        bkcolor = 'green';
      } else if (uv < 6) { 
        bkcolor = 'yellow';
      } else if (uv < 8) { 
        bkcolor = 'orange';
      } else if (uv < 11) { 
        bkcolor = 'red';
      }

      let title = '<span>UV Index: </span>';
      let color = title + `<span style="background-color: ${bkcolor}; padding: 0 7px 0 7px;">${response.value}</span>`;

      $('#curUv').html(color);
    }); 
  };

  function updateCityStore(city) {
    let cityList = JSON.parse(localStorage.getItem("cityList")) || [];
    cityList.push(city); 
    cityList.sort();

    // removes duplicate cities
    for (let i=1; i<cityList.length; i++) {
       if (cityList[i] === cityList[i-1]) cityList.splice(i,1);
    }

    //stores in local storage
    localStorage.setItem('cityList', JSON.stringify(cityList));
  };

  function drawHistory() {
    // function to pull city history from local memory
  
    let cityList = JSON.parse(localStorage.getItem("cityList")) || [];

    $('#past-cities').empty();
    cityList.forEach ( function (city) {
      let cityNameDiv = $('<div>');
      cityNameDiv.addClass("cityList");
      cityNameDiv.attr("value",city);
      cityNameDiv.text(city);
      $('#past-cities').append(cityNameDiv);
    });
  };

  // will get location when page initializes
  const location = getCurLocation();
});