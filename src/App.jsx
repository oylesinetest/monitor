import { useState, useEffect } from 'react'
import './App.css'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

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

  console.log(currentDate, endDate, currentDate <= endDate);

  while (currentDate <= endDate) {
    dateList.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dateList;
}

function plus1Mutator(value) {
  return value + 1;
}

function checkNewDayValue(list, day) {
  return list.map((curr) => {
    const date = curr.date;
    const value = parseInt(curr.value);
    return {
      date: date,
      value: areDatesSameDay(date, day) ? valueMutator(value) : value
    };
  }
  );
}

function updateValueWithAction(value, actionType) {
  return value + 1;
}

function addActionToDay(list, actionType, actionDate) {
  return list.map(obj => ({
    ...obj,
    actions: areDatesSameDay(obj.date, actionDate) ? [...obj.actions, actionType] : obj.actions,
  }));
}

function App() {
  const [actions, setActions] = useState([]);
  const [processedData, setProcessedData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const startingDay = new Date('2023-09-01');
  const startingValue = "5";

  const computeData = (data) => {
    var sortedActions = data.sort((a, b) => a.time - b.time);
    sortedActions = sortedActions.map(obj => ({
      ...obj,
      date: new Date(obj.time),
    }));

    const lastDate = sortedActions[sortedActions.length - 1].date;
    const dateRange = getDates(startingDay, lastDate);

    var processedValues = dateRange.map(date => ({
      date: date,
      value: -1,
      actions: []
    }));
    processedValues[0].value = startingValue;

    sortedActions.forEach(({type, date}, index) => {
      processedValues = addActionToDay(processedValues, type, date);
    })

    //Add interest for every day
    processedValues = processedValues.map(obj => ({
      ...obj,
      actions: ['interest', ...obj.actions],
    }));

    //Process the action types
    for (let i = 0; i < processedValues.length; i++) {
      const item = processedValues[i];
      var currVal = parseInt(item.value);
      var date = item.date;
      var actions = item.actions;

      actions.forEach((actionType) => {
        currVal = updateValueWithAction(currVal, actionType);
      })

      processedValues[i].value = currVal;
      if (i != processedValues.length - 1) {
        processedValues[i + 1].value = currVal;
      }
    }

    console.log('sortedActions', sortedActions);
    console.log('processedValues', processedValues);

    return processedValues;
  }

  useEffect(() => {
    axios.get('https://scented-military-dinner.glitch.me/getAll')
      .then(({ data }) => {
        console.log(data);
        setActions(data);
        setProcessedData(computeData(data));
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      });
  }, []);

  console.log(processedData);

  const dateFormattedData = processedData.map(obj => ({
    ...obj,
    date: formatDate(obj.date),
  }));

  return (
    <div style = {{height:"100vh", width:"100vh"}}>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
          <ResponsiveContainer width="70%" height="70%"> 
            <LineChart data={dateFormattedData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>

      )}
    </div>

  )
}

export default App
