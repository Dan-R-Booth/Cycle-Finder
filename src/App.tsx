import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './App.css';
import 'bootstrap/dist/css/bootstrap.css';
import { Button, ButtonGroup, OverlayTrigger, Tooltip, Navbar, Form, Container, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBicycle, faMagnifyingGlass, faLocationCrosshairs, faMapLocationDot, faArrowsUpDown, faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

function App() {

  // The following type declarions are used to store data collected from the CitiBikes API
  type CycleStation = {
    location: {
      city: string;
      country: string;
    };
    stations: Station[];
  }

  type Station = Array<JSON> & {
    latitude: number;
    longitude: number;
    distance: number;
    free_bikes: number;
    timestamp: string;
    id: string;
    name: string;
  }

  type CycleProvider = {
    id: string;
    name: string;
    location: {
      city: string;
      country: string;
    };
  }

  // Stores max num of decimal places for latitude and longitude
  const decimalPlaces = 8;

  // Stores a Regular Expresion to make sure only strings matching this
  // can be entered in the latitude and longitude boxes 
  const latLongRegExp = new RegExp('^(-?\\d{1,2})(\\.\\d{0,' + decimalPlaces + '})?$', 'g')

  // useState sets the state (value) of a const state variable async
  // variables normally variables “disappear” when the function exits but state variables are preserved by React.

  // This sorts the currently active sort on the list and if the sort is descending or not
  const [activeSort, setActiveSort] = useState<[string, boolean]>();

  // This stores a JSON array for all the Cycle Stations
  const [cycleStations, setCycleStations] = useState<CycleStation>();

  const [cycleProviders, setCycleProviders] = useState<CycleProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('default');
  
  // This stores a JSON array of the n closest Cycle Stations to an entered Longitude and Latitude,
  // where n = numStations and the Stations first meet the filter conditions
  const [closestStations, setClosestStations] = useState<Station[] | undefined>([]);
  
  // This stores the number of Cycle Stations to be displayed
  const [numStations, setNumStations] = useState<number>(5);

  const [latitudeBoxValue, setLatitudeBoxValue] = useState<string>('');
  const [longitudeBoxValue, setLongitudeBoxValue] = useState<string>('');

  // This stores the minimum number of free bikes the user wants each station displayed to have
  const [minBikes, setMinBikes] = useState<number>(0);
  
  // These store the sorting indicator icons used for each sortable columns 
  const [distanceIcon, setDistanceIcon] = useState<IconProp>(faArrowsUpDown);
  const [free_bikesIcon, setFree_bikesIcon] = useState<IconProp>(faArrowsUpDown);
  const [timeStampIcon, setTimeStampIcon] = useState<IconProp>(faArrowsUpDown);

  // Runs if activeSort is different after render
  // Updates the header sort icons to match the active sort, before displaying the Closest Cycle Stations
  useEffect(() => {
    setDistanceIcon(faArrowsUpDown);
    setFree_bikesIcon(faArrowsUpDown);
    setTimeStampIcon(faArrowsUpDown);

    var sort = activeSort?.[0];
    var isDescending = activeSort?.[1];

    switch(sort) {
      case 'distance':
        if (isDescending) {
          setDistanceIcon(faArrowUp);
        }
        else {
          setDistanceIcon(faArrowDown);
        }
        break;
      case 'free_bikes':
        if (isDescending) {
          setFree_bikesIcon(faArrowUp);
        }
        else {
          setFree_bikesIcon(faArrowDown);
        }
        break;
      case 'timestamp':
        if (isDescending) {
          setTimeStampIcon(faArrowUp);
        }
        else {
          setTimeStampIcon(faArrowDown);
        }
        break;
    }

    displayStations();
  }, [activeSort]);
  
  // Runs after render
  useEffect(() => {
    fetchCycleProviderData();
    setActiveSort(['distance', false]);
  }, []);
  
  // This function is called from the search button and it then calls the fetchCycleStationData
  // function to get the latest data for the selected cycle provider
  function search (submitEvent: React.SyntheticEvent<HTMLElement>) {
    submitEvent.preventDefault();
    fetchCycleStationData(selectedProvider);
  }

  // This function collects data from the CitiBikes API about all cycle providers (e.g. Santander Cycles)
  // async/await -> Pause function until promise resolved
  // Response (Promise) -> set as JSON data-> to variable providerData
  const fetchCycleProviderData = async () => {
    const response = await fetch('http://api.citybik.es/v2/networks')
    .then((response) => response.json())
    .then((providerData) => {
      // This just takes the JSON array with information about the cycle providers from the API response
      // and sorts the providers by their name, and if these match, then by city
      // (ignoring if letters are upper or lower case)
      const sortedProviderData = providerData.networks.sort((a: CycleProvider, b: CycleProvider) => {
        // This uses localeCompare so that the cases can be ignored
        var comparison = a.name.localeCompare(b.name, undefined, {sensitivity: 'base'});

        if (comparison !== 0) {
          return comparison;
        }
        else {
          return a.location.city.localeCompare(b.location.city, undefined, {sensitivity: 'base'});
        }
      });

      setCycleProviders(sortedProviderData);
      console.log(providerData);
    })
    .catch((err) => {
      console.log(err.message);
    });
  };

  // This function collects data from the CitiBikes API about a selected Cycle Provider (e.g. Santander Cycles)
  // async/await -> Pause function until promise resolved
  // Response (Promise) -> set as JSON data-> to variable cycleData
  const fetchCycleStationData = async (provider: string) => {
    const response = await fetch('http://api.citybik.es/v2/networks/' + provider)
    .then((response) => response.json())
    .then((cycleData) => {
      console.log(cycleData);
      // This just takes the JSON array with information about the cycle stations from the API response
      // cycleData.network.stations -> to just get station data
      setCycleStations(cycleData.network);
      console.log(cycleStations);
    })
    .catch((err) => {
      console.log(err.message);
    });
  };

  // Runs if cycleStations is different after render
  // Calls the calulateDistances function with latitude and longitude entered
  // and then sorts the JSON array by distance so closest stations are at the start.
  // Finally, closestStations is set filtering the cycleStations array by minBikes, and
  // then slices it by numStations, to get the closest n stations (where n = numStations).
  useEffect(() => {
    calulateDistances(parseFloat(latitudeBoxValue), parseFloat(longitudeBoxValue));

    cycleStations?.stations.sort(sortBy('distance'));
    
    // Takes the top entries in the JSON array, using the numBikes constant, and adds them to a new stations array
    // This filters the list of stations so only those meeting the minimum free bikes threshold are left, before
    // slicing the array by numStations
    setClosestStations(cycleStations?.stations.filter(cycleStation => cycleStation.free_bikes >= minBikes).slice(0, numStations));
    
  }, [cycleStations]);

  // Runs if closestStations is different after render and calls the displayStations
  // function to display these Cycle Stations
  useEffect(() => {
    // Apply the sort which was previously active
    if (activeSort !== undefined) {
      closestStations?.sort(sortBy(activeSort?.[0]));
      
      if (activeSort?.[1] === true) {
        closestStations?.reverse();
      }
    }
    
    displayStations();
  }, [closestStations]);

  // This calls the getDistanceBetweenPoints to calculate the distance
  // between the given latitude and longitude and the cycle stations
  function calulateDistances(latitude: number, longitude: number) {
    cycleStations?.stations.map((cycleStation) => {
      let distance = getDistanceBetweenPoints(latitude, longitude, cycleStation.latitude, cycleStation.longitude); 
      
      // Adds calulated distance to JSON array element
      cycleStation.distance = distance;
    })
  }

  // Calulating distance between points using Haversine formula, and returning the distance in meters
  function getDistanceBetweenPoints(latA: number, longA: number, latB: number, longB: number) {
    
    // Converting latitude and longitude of both points to radians
    const latARad = latA * Math.PI / 180;
    const longARad = longA * Math.PI / 180;
    const latBRad = latB * Math.PI / 180;
    const longBRad = longB * Math.PI / 180;

    // Earth's radius in km
    const R = 6371;
    
    // Calulate difference between latitude and longitude
    let diffLat = (latBRad - latARad);
    let diffLong = (longBRad - longARad);
    
    // Haversine formula
    const a = Math.pow(Math.sin(diffLat/2), 2) + Math.cos(latARad) * Math.cos(latBRad) * Math.pow(Math.sin(diffLong/2), 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    // distance in km
    const distance = R * c;

    return distance;
  }

  // This displays all the closest stations by creating HTML rows for each station
  function displayStations() {
    const body = document.getElementById('body');

    if (body !== null) {
      var isTable = document.getElementById('tableContainer');

      // If the table already exists this will remove the table before creating a new table
      if (isTable !== null) {
        isTable.remove();
      }

      // This creates the container to hold the stations being displayed
      var table = document.createElement('div');
      table.id = 'tableContainer';
      table.className = 'mb-5';
      body.appendChild(table);

      // This creates a row for each cycle station in the closest stations array,
      // and adds columns in each row for a stations latitude, longitude, distance from entered lat and long, name, free bikes and last updated time
      closestStations?.map((cycleStation) => {
        // This creates a link to google maps so that the user can view the location of the cycle station
        var link = 'https://www.google.co.uk/maps/place/' + cycleStation.latitude + ' ' + cycleStation.longitude;

        var row = document.createElement('div');
        row.id = cycleStation.id;
        row.className = 'container-fluid border';
        table.appendChild(row);

        var rowAligner = document.createElement('div');
        rowAligner.className = 'row align-items-center my-3';
        row.appendChild(rowAligner);

        var colLat = document.createElement('Col');
        colLat.className = 'col';
        colLat.innerText = cycleStation.latitude.toString();
        colLat.innerText = parseFloat(cycleStation.latitude.toString()).toFixed(decimalPlaces);
        rowAligner.appendChild(colLat);

        var colLong = document.createElement('Col');
        colLong.className = 'col';
        colLong.innerText = cycleStation.longitude.toString();
        colLong.innerText = parseFloat(cycleStation.longitude.toString()).toFixed(decimalPlaces);
        rowAligner.appendChild(colLong);

        var colDistance = document.createElement('Col');
        colDistance.className = 'col';
        colDistance.innerText = parseFloat(cycleStation.distance.toString()).toFixed(3);
        rowAligner.appendChild(colDistance);

        var colName = document.createElement('Col');
        colName.className = 'col';
        colName.innerText = cycleStation.name + ', ' + cycleStations?.location.city + '\t';
        rowAligner.appendChild(colName);

        var mapLink = document.createElement('a');
        mapLink.href = link;
        mapLink.target = '_blank';
        mapLink.rel = 'noopener noreferrer'
        mapLink.title = 'View on Google Maps';
        colName.appendChild(mapLink);

        const root = createRoot(mapLink);
        root.render(<FontAwesomeIcon icon={faMapLocationDot}/>);

        var colFreeBikes = document.createElement('Col');
        colFreeBikes.className = 'col';
        colFreeBikes.innerText = cycleStation.free_bikes.toString();
        rowAligner.appendChild(colFreeBikes);

        var colTimeStamp = document.createElement('Col');
        colTimeStamp.className = 'col';
        var timestamp = new Date(cycleStation.timestamp);
        colTimeStamp.innerText =  timestamp.toLocaleTimeString() + ', ' + timestamp.toDateString();
        rowAligner.appendChild(colTimeStamp);
      })
    }
  }

  // This sorts an array using a value inputed as a String
  function sortBy(sortType: string) {
    return function(a: any, b: any) {
      if (a[sortType] > b[sortType]) {
        return 1;
      }
      else if (a[sortType] < b[sortType]) {
        return -1;
      }
      else {
        return 0;
      }
    }
  }

  // This is run when a header (from the list of cycle stations) is clicked on
  const sortClickHandler = (e: React.MouseEvent<HTMLElement>, newSort: string) => sortList(newSort);
  
  // This sorts the list of CycleStations by a new sort
  function sortList(newSort: string) {

    // This stores if the new sort is descending
    var isDescending;

    // This checks if the sort is the same type as the previous sort, and if so reverses closestStations list,
    // and sets isDescending to the opposiste of the previous sort
    if (activeSort?.[0] === newSort) {
      closestStations?.reverse();
      
      isDescending = !activeSort[1];
    }
    // Otherwise closestStations is sorted by the new sort selected, and isDescending is set to false
    else {
      closestStations?.sort(sortBy(newSort));

      isDescending = false;
    }

    // Sets the activeSort const to the newSort
    setActiveSort([newSort, isDescending]);
  }

  // When the either the Latitude or Longitude box values change or a new provider is selected, this calls
  // the checkSearchInputs() to see if the search button should be enabled
  useEffect(() => {
    checkSearchInputs();
  }, [selectedProvider, latitudeBoxValue, longitudeBoxValue]);

  // If a new cycle provider is selected in providerSelect, this updates the
  // selectedProvider varaiable (via setSelectedProvider)
  function onProviderChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedProvider(event.target.value);
  }

  // If a new value is entered in latitudeBox, this checks if the value is a valid enterd value.
  // If the value is a '-' or an empty string, these values are excepted and the latitudeBoxValue is updated
  // Overwise, the value is checked to see if it matches the latitude longitude Regular Expresion
  // and then if the number is between -90 and 90, the latitudeBoxValue is updated
  // (latitudeBoxValue varaiable is updated via setLatitudeBoxValue, which thus updates the value in latitudeBoxValue)
  function onLatitudeChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.id === 'latitudeBox') {
      var newLatitudeText = event.target.value;
      var newLatitude = parseFloat(event.target.value);

      if (newLatitudeText === '-' || newLatitudeText === '') {
        setLatitudeBoxValue(newLatitudeText);
      }
      else if (newLatitudeText.match(latLongRegExp)) {
        if ((newLatitude <= 90.0 && newLatitude >= -90.0)) {
          setLatitudeBoxValue(newLatitudeText);
        }
      }
    }
  }

  // If a new value is entered in longitudeBoxValue, this checks if the value is a valid enterd value.
  // If the value is a '-' or an empty string, these values are excepted and the longitudeBoxValue is updated
  // Overwise, the value is checked to see if it matches the latitude longitude Regular Expresion
  // and then if the number is between -90 and 90, the longitudeBoxValue is updated
  // (longitudeBoxValue varaiable is updated via setLongitudeBoxValue, which thus updates the value in longitudeBoxValue)
  function onLongitudeChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.id === 'longitudeBox') {
      var newLongitudeText = event.target.value;
      var newLongitude = parseFloat(event.target.value);

      if (newLongitudeText === '-' || newLongitudeText === '') {
        setLongitudeBoxValue(newLongitudeText);
      }
      else if (newLongitudeText.match(latLongRegExp)) {
        if ((newLongitude <= 90.0 && newLongitude >= -90.0)) {
          setLongitudeBoxValue(newLongitudeText);
        }
      }
    }
  }

  // This checks if either latitude and longitude input boxes are empty,
  // or if the default Provider is selected
  // If either boxes are empty or default selected, then the Search button is disabled
  // If both are not empty and default is not, then the Search button is enabled
  function checkSearchInputs() {
    // Uses HTMLButtonElement so the button can be enabled and disabled
    const searchButton = document.getElementById('searchButton') as HTMLButtonElement | null;
  
    // Checks that the searchButton exists
    if (searchButton !== null) {
      // If latitudeBoxValue or longitudeBoxValue are empty the search button is disabled
      if (isNaN(parseFloat(latitudeBoxValue)) || isNaN(parseFloat(longitudeBoxValue)) || selectedProvider === 'default') {
        searchButton.disabled = true;
      }
      else
      {
        searchButton.disabled = false;
      }
    }

  }

  // If a new value is entered in numStationsBox, this checks if the value is less than 200,
  // and if it is updates the numStations varaiable (via setNumStations) to match the new value
  // and thus updating the value in numStationsBox
  function numStationsChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.id === 'numStationsBox') {
      var newNumStations = parseInt(event.target.value);

      // This is sets the value if it is less than or equal to 200
      // It uses not > 200 as this means if the box is cleared the box to type a number
      if (!(newNumStations > 200)) {
        setNumStations(newNumStations);
      }
    }
  }

  // If a new value is entered in minBikesBox, this checks if the value is less than 100,
  // and if it is updates the minBikes varaiable (via setMinBikes) to match the new value
  // and thus updating the value in minBikesBox
  function minBikesChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.id === 'minBikesBox') {
      var newMinBikes = parseInt(event.target.value);

      // This is sets the value if it is less than 100
      // It uses not >= 100 as this means if the box is cleared the box to type a number
      if (!(newMinBikes >= 100)) {
        setMinBikes(newMinBikes);
      }
    }
  }

  // If the numStations or minBikes is updated, the list of stations dispalyed will be updated accordingly
  useEffect(() => {
    setClosestStations(cycleStations?.stations.filter(cycleStation => cycleStation.free_bikes >= minBikes).slice(0, numStations));
  }, [numStations, minBikes]);

  // This uses navigator geolocation to get the users current latitude and longitude
  function getLocation() {
    navigator.geolocation.getCurrentPosition(function(position) {

      // Uses HTMLInputElement so value can be accessed
      const latitudeBox = document.getElementById('latitudeBox') as HTMLInputElement | null;
      const longitudeBox = document.getElementById('longitudeBox') as HTMLInputElement | null;

      // Uses HTMLButtonElement so the button can be enabled
      const searchButton = document.getElementById('searchButton') as HTMLButtonElement | null;
  
      // Checks that the latitudeBox and longitudeBox both exist along with the searchButton
      if (latitudeBox !== null && longitudeBox !== null && searchButton !== null) {
        setLatitudeBoxValue(position.coords.latitude.toFixed(decimalPlaces));
        setLongitudeBoxValue(position.coords.longitude.toFixed(decimalPlaces));
      }
    });
  }

  // This renders a tooltip in the OverlayTrigger at props with the parsed text
  const renderTooltip = (props: any, tooltipText: string) => (
    <Tooltip {...props}>
      {tooltipText}
    </Tooltip>
  );

  return (
    <div id='body'>
      {/* This uses bootstrap so that everything in this div stays at the top of the page when it's scrolled down */}
      <div className='sticky-top' data-toggle='affix'>
        <Navbar variant='dark' bg='dark' expand='xxl'>
          <Navbar.Brand className='ms-3'> <h1>Cycle Finder <FontAwesomeIcon icon={faBicycle}/></h1> </Navbar.Brand>
          <Navbar.Toggle className='me-3' aria-controls={'navbar'} />

          <Navbar.Collapse className='collapse navbar-collapse ms-3' id='navbar'>

            <OverlayTrigger placement='bottom' overlay={(props) => renderTooltip(props, 'Select Provider for Cycle Stations')}>
              <Form.Select id='providerSelect' data-testid='providerSelect' className='my-auto me-3 pt-1' defaultValue='default' onChange={onProviderChange}>
                <option data-testid='default' value='default'>Select Provider </option>

                {cycleProviders.map(({id, name, location}) => (
                  <option data-testid={id} key={id} value={id}> {name} ({location.city}, {location.country}) </option>
                ), )}
              </Form.Select>
            </OverlayTrigger>

            <Form className='d-flex my-auto me-3 pt-1' onSubmit={(e) => search(e)}>
              <Form.Label className='text-white my-auto me-2' htmlFor='latitudeBox'> Latitude: </Form.Label>
              <OverlayTrigger placement='bottom' overlay={(props) => renderTooltip(props, 'Enter Latitude up to ' + decimalPlaces + ' decimal places')}>
                <Form.Control id='latitudeBox' data-testid='latitudeBox' className='my-auto me-3' type='text' inputMode='decimal' value={latitudeBoxValue} maxLength={4 + decimalPlaces} onChange={onLatitudeChange}/>
              </OverlayTrigger>
              
              <Form.Label className='text-white my-auto me-2' htmlFor='longitudeBox'> Longitude: </Form.Label>
              <OverlayTrigger placement='bottom' overlay={(props) => renderTooltip(props, 'Enter Longitude up to ' + decimalPlaces + ' decimal places')}>
                <Form.Control id='longitudeBox' data-testid='longitudeBox' className='my-auto me-3' type='text' inputMode='decimal' value={longitudeBoxValue} maxLength={4 + decimalPlaces} onChange={onLongitudeChange}/>
              </OverlayTrigger>

              <ButtonGroup className='my-auto me-4'>
                <OverlayTrigger placement='bottom' overlay={(props) => renderTooltip(props, 'Search for Closest Stations')}>
                  <Button id='searchButton' data-testid='searchButton' className='text-nowrap' variant='primary' type='submit'> <FontAwesomeIcon icon={faMagnifyingGlass}/> Search </Button>
                </OverlayTrigger>

                <OverlayTrigger placement='bottom' overlay={(props) => renderTooltip(props, 'Use Current Location')}>
                  <Button id='currentLocationButton' data-testid='currentLocationButton' className='text-nowrap' variant='success' type='button' onClick={getLocation}> <FontAwesomeIcon icon={faLocationCrosshairs}/> </Button>
                </OverlayTrigger>
              </ButtonGroup>

            </Form>
            <Form.Label className='text-white my-auto me-1' htmlFor='numStationsBox'> Number of Stations: </Form.Label>
            <OverlayTrigger placement='bottom' overlay={(props) => renderTooltip(props, 'Enter a Number between 0 and 200')}>
              <Form.Control id='numStationsBox' className='my-auto me-3 pt-1' name='numStationsBox' type='number' value={numStations} step='1' min='0' max='200' onChange={numStationsChange}/>
            </OverlayTrigger>

            <Form.Label className='text-white my-auto me-1' htmlFor='minBikesBox'> Minimum Free Bikes: </Form.Label>
            <OverlayTrigger placement='bottom' overlay={(props) => renderTooltip(props, 'Enter a Number between 0 and 99')}>
              <Form.Control id='minBikesBox' className='my-auto me-2 pt-1' name='minBikesBox' type='number' value={minBikes} step='1' min='0' max='99'onChange={minBikesChange}/>
            </OverlayTrigger>

          </Navbar.Collapse>
        </Navbar>

        {/* This uses bootstrap to create a container which width will be maximum on screens of any size, with a border */}
        <Container fluid className='border bg-white'>
          {/* This is the header for all the pieces in a Lego set, made using a bootstrap row and columns with column names */}
          <Row className='my-3'>
            <Col>
              <h6 id='latitudeHeader'>Latitude: </h6>
            </Col>
            <Col>
              <h6 id='longitudeHeader'>Longitude: </h6>
            </Col>
            <Col>
              <OverlayTrigger placement='left' overlay={(props) => renderTooltip(props, 'Sort by Distance')}>
                <h6 id='distanceHeader' onClick={(e) => sortClickHandler(e, 'distance')}> Distance (km): <FontAwesomeIcon icon={distanceIcon}/> </h6>
              </OverlayTrigger>
            </Col>
            <Col>
              <h6 id='stationNameHeader'>Station Name: </h6>
            </Col>
            <Col>
              <OverlayTrigger placement='left' overlay={(props) => renderTooltip(props, 'Sort by Number of Free Bikes')}>
                <h6 id='freeBikesHeader' onClick={(e) => sortClickHandler(e, 'free_bikes')}>
                  Free Bikes: <FontAwesomeIcon icon={free_bikesIcon}/>
                </h6>
              </OverlayTrigger>
            </Col>
            <Col>
              <OverlayTrigger placement='left' overlay={(props) => renderTooltip(props, 'Sort by Last Updated')}>
                <h6 id='lastUpdatedHeader' onClick={(e) => sortClickHandler(e, 'timestamp')} title='Sort by Last Updated'> Last Updated: <FontAwesomeIcon icon={timeStampIcon}/> </h6>
              </OverlayTrigger>
            </Col>
          </Row>
        </Container>
      </div>

      <Navbar variant='dark' bg='dark' fixed='bottom'>
        <p className='text-white ms-5 my-2'> Data Collected using <a href='https://api.citybik.es/v2/' target='_blank' rel='noopener noreferrer'>CityBikes API</a></p>
      </Navbar>
    </div>
  );
}

export default App;
