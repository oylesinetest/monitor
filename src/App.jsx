import React, { useState, useEffect } from 'react'
import './App.css'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { CircularProgress } from '@mui/material';
import ProgressBar from "@ramonak/react-progress-bar";

function tableFloatFormat (n) {
  return (n<0?"":"+") + n.toFixed(2);
}

function sumValues(obj1, obj2) {
  const result = {};

  for (const key in obj1) {
    if (obj1.hasOwnProperty(key) && obj2.hasOwnProperty(key)) {
      if (typeof obj1[key] === 'number' && typeof obj2[key] === 'number') {
        result[key] = obj1[key] + obj2[key];
      } else {
        // Handle non-numeric values or missing fields as needed.
        // You can choose to throw an error, skip the field, or handle it differently.
        // In this example, we assume both fields are numeric.
      }
    }
  }

  return result;
}

function formatDate(date) {
  const day = date.getDate();
  const monthAbbreviations = [
    'Oc', 'Şub', 'Mar',
    'Nis', 'May', 'Haz',
    'Tem', 'Agu', 'Eyl',
    'Eki', 'Kas', 'Ara'
  ];
  const monthAbbreviation = monthAbbreviations[date.getMonth()];
  return `${day} ${monthAbbreviation}`;
}

function formatDateTime(date) {
  const options = {
    weekday: 'long', // Full day name (e.g., "Monday")
    month: 'long',   // Full month name (e.g., "January")
    day: 'numeric',  // Day of the month (e.g., "1")
    hour: 'numeric', // Hour in 12-hour format (e.g., "1 PM")
    minute: 'numeric', // Minutes (e.g., "30")
    hour12: false     // Use 12-hour format (true) or 24-hour format (false)
  };

  return date.toLocaleString('tr-TR', options);
}

function areDatesSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function getDates(startDate, endDate) {
  const dateList = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dateList.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dateList;
}

function identityChange() {
  return (value) => 0;
}

function directChange(change) {
  return (value) => change;
}

function directChangeLimit(change, limit) {
  return (value) => value > limit ? 0 : change;
}

function percentChange(percent) {
  return (value) => value * percent;
}

function percentChangeLimit(percent, limit) {
  return (value) => value > limit ? 0 : value * percent;
}

function inversePercentChange(percent) {
  return (value) => (100 - value) * percent;
}

function changeForValueAndAction(valueType, actionType) {

  switch (actionType) {
    case 'Faiz':
      return inversePercentChange(0.02);
    case 'Kawga':
      return percentChange(-0.3);
    case 'Asksal Olay':
      return inversePercentChange(0.01);
    case 'Trip':
      return inversePercentChange(-0.05);
    case 'Karsilikli Trip':
      return inversePercentChange(-0.1);
    case 'Selfie':
      switch (valueType) {
        case 'Buluşma':
          return directChangeLimit(5, 50);
        case 'Öpüşme':
          return directChangeLimit(3, 30);
        case 'Evlenme':
          return directChangeLimit(1, 20);
        default:
          identityChange();
      }
    case 'Ayak Fotosu':
      switch (valueType) {
        case 'Buluşma':
          return percentChangeLimit(0.3, 60);
        case 'Öpüşme':
          return percentChangeLimit(0.2, 70);
        case 'Evlenme':
          return percentChangeLimit(0.05, 50);
        default:
          identityChange();
      }
    
      case 'Birlikte Oyun':
        switch (valueType) {
          case 'Buluşma':
            return directChangeLimit(5, 50);
          case 'Öpüşme':
            return directChangeLimit(3, 30);
          case 'Evlenme':
            return directChangeLimit(2, 40);
          default:
            identityChange();
        }
            
      case 'Birlikte Dizi':
        switch (valueType) {
          case 'Buluşma':
            return directChangeLimit(1, 80);
          case 'Öpüşme':
            return directChangeLimit(1, 80);
          case 'Evlenme':
            return directChangeLimit(2, 80);
          default:
            identityChange();
        }
    default:
      return identityChange();
  }
}

function deltaValueWithAction(value, valueType, actionType) {
  const mutator = changeForValueAndAction(valueType, actionType);
  return mutator(parseFloat(value));
}

function deltaValuesWithAction(values, action) {
  const actionType = action.type;
  return {
    bulusma: parseFloat(deltaValueWithAction(values.bulusma, 'Buluşma', actionType)),
    opusme: parseFloat(deltaValueWithAction(values.opusme, 'Öpüşme', actionType)),
    evlenme: parseFloat(deltaValueWithAction(values.evlenme, 'Evlenme', actionType)),
  }
}

function addActionToDay(list, action) {
  return list.map(obj => ({
    ...obj,
    actions: areDatesSameDay(obj.date, action.date) ? [...obj.actions, action] : obj.actions,
  }));
}

function App() {
  const [actions, setActions] = useState([]);
  const [processedData, setProcessedData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chosenDay, setChosenDay] = useState(formatDate(new Date(Date.now())));
  const [selectedAction, setSelectedAction] = React.useState('');

  const handleChange = (event) => {
    setSelectedAction(event.target.value);
  };


  const startingDay = new Date('2023-09-01');
  const today = Date.now();
  const startingValues = {
    bulusma: 30,
    opusme: 20,
    evlenme: 10,
  };

  const computeData = (data) => {
    var sortedActions = data.sort((a, b) => a.time - b.time);
    sortedActions = sortedActions.map(obj => ({
      ...obj,
      date: new Date(obj.time),
    }));

    const dateRange = getDates(startingDay, today);

    var processedValues = dateRange.map(date => ({
      date: date,
      values: {
        bulusma: -1,
        opusme: -1,
        evlenme: -1,
      },
      actions: []
    }));
    processedValues[0].values = startingValues;

    sortedActions.forEach((action, index) => {
      processedValues = addActionToDay(processedValues, action);
    })

    //Add interest for every day
    processedValues = processedValues.map(obj => ({
      ...obj,
      actions: [{type:'Faiz', time: obj.date.toTimeString, date: obj.date}, ...obj.actions],
    }));

    //Process the action types
    for (let i = 0; i < processedValues.length; i++) {
      const item = processedValues[i];
      var currVal = item.values;
      var date = item.date;
      var actions = item.actions;

      actions.forEach((action, index) => {
        const delta = deltaValuesWithAction(currVal, action);
        processedValues[i].actions[index] = {
          ...action,
          delta: delta
        }
        currVal = sumValues(currVal, delta);
      })

      processedValues[i].values = currVal;
      if (i != processedValues.length - 1) {
        processedValues[i + 1].values = currVal;
      }
    }

    processedValues = processedValues.map(obj => ({
      ...obj,
      bulusma: obj.values.bulusma,
      opusme: obj.values.opusme,
      evlenme: obj.values.evlenme,
    }));

    return processedValues;
  }

  useEffect(() => {
    axios.get('https://scented-military-dinner.glitch.me/getAll')
      .then(({ data }) => {
        setActions(data);
        setProcessedData(computeData(data));
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      })
  }, [isLoading]);

  const dateFormattedData = processedData.map(obj => ({
    ...obj,
    date: formatDate(obj.date),
  }));

  const onChartClick = (event) => {
    setChosenDay(event.activeLabel);
  }

  const onSubmitButtonClick = (event) => {
    if (selectedAction === '' || !selectedAction) return;

    const apiUrl = 'https://scented-military-dinner.glitch.me/add';

    const postData = {
      type: selectedAction,
    };

    axios.post(apiUrl, postData)
      .then((response) => {
        setIsLoading(true);
      })
      .catch((error) => {
        // Handle any errors that occurred during the POST request.
        console.error('Error making POST request:', error);
      });
  }

  const chosenDayActions = () => {
    const dayData = dateFormattedData.find((data) => data.date === chosenDay);

    return dayData ? dayData.actions : [];
  }

  const chosenDayValues = () => {
    const dayData = dateFormattedData.find((data) => data.date === chosenDay);

    return dayData ? dayData.values : [];
  }

  return (
    <div style={{ height: "100vh", width: "100vh" }}>
      {isLoading ? (
        <CircularProgress color="success" />
      ) : (
        <div style={{ height: "100vh", width: "100vh" }}>
          <ResponsiveContainer width="100%" height="50%">
            <LineChart data={dateFormattedData}
              onClick={onChartClick}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
                <YAxis type="number" domain={[0, 100]} tickFormatter={(tick) => {
                  return `${tick}%`;
                }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="bulusma" stroke="#8884d8" name="Buluşma"/>
              <Line type="monotone" dataKey="opusme" stroke="#8884d8" name="Öpüşme"/>
              <Line type="monotone" dataKey="evlenme" stroke="#8884d8" name="Evlenme"/>
            </LineChart>
          </ResponsiveContainer>
          <div>
            <ProgressBar completed={chosenDayValues().bulusma} maxCompleted={100} customLabel='Buluşma' height='40px' transitionDuration= '3s' animateOnRender={true}/>
            <br></br>
            <ProgressBar completed={chosenDayValues().opusme} maxCompleted={100} customLabel='Öpüşme' height='40px' transitionDuration= '3s' animateOnRender={true}/>
            <br></br>
            <ProgressBar completed={chosenDayValues().evlenme} maxCompleted={100} customLabel='Evlenme' height='40px' transitionDuration= '3s' animateOnRender={true}/>
          </div>
            <br></br>
          <div>
            
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="simple table">
                <TableHead>
                  <TableRow>
                    <TableCell>Olay</TableCell>
                    <TableCell align="right">Zaman</TableCell>
                    <TableCell align="right">Buluşma</TableCell>
                    <TableCell align="right">Öpüşme</TableCell>
                    <TableCell align="right">Evlenme</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {chosenDayActions().map((row, index) => (
                    <TableRow
                      key={"key"+index}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {row.type}
                      </TableCell>
                      <TableCell align="right">{formatDateTime(row.date)}</TableCell>
                      <TableCell align="right">{tableFloatFormat(row.delta.bulusma)}</TableCell>
                      <TableCell align="right">{tableFloatFormat(row.delta.evlenme)}</TableCell>
                      <TableCell align="right">{tableFloatFormat(row.delta.opusme)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
            <br></br>
          <div>
            <></>
            <Box sx={{ minWidth: 120 }}>
              <FormControl fullWidth>
                <InputLabel id="demo-simple-select-label">Olay</InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  value={selectedAction}
                  label="Age"
                  onChange={handleChange}
                >
                  <MenuItem value={'Asksal Olay'}>Asksal Olay</MenuItem>
                  <MenuItem value={'Ayak Fotosu'}>Ayak Fotosu</MenuItem>
                  <MenuItem value={'Selfie'}>Selfie</MenuItem>
                  <MenuItem value={'Kawga'}>Kawga</MenuItem>
                  <MenuItem value={'Trip'}>Trip</MenuItem>
                  <MenuItem value={'Karsilikli Trip'}>Karsilikli Trip</MenuItem>
                  <MenuItem value={'Birlikte Oyun'}>Birlikte Oyun</MenuItem>
                  <MenuItem value={'Birlikte Dizi'}>Birlikte Dizi</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <br></br>
            <Button variant="contained" onClick={onSubmitButtonClick}>Olay ekle</Button>
          </div>
        </div>
      )}
    </div>

  )
}

export default App
