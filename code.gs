//// Initial Demo Function (Placed here for Reference)///
//function fetchAirtable() {
//  //Form the request method and authorization header
//  const options = {
//  'method': 'get',
//  'headers': {
//    'Authorization': 'Bearer ' + '[YOUR API KEY]'
//    }
//  };
//  //Form the request URL
//  const url = 'https://api.airtable.com/v0/' + '[YOUR AIRTABLE BASE ID]' + '/' + '[YOUR AIRTABLE TABLE NAME]';
//  //Make the Request and Store the Response
//  const response = UrlFetchApp.fetch(url, options);
//  //Log the response for debugging
//  Logger.log(response);
//  return response
//}

function doGet() {
  return HtmlService.createTemplateFromFile('index').evaluate();
}

///App Functions (All these function depend on the specific schema of the Critters Airtable!)///

function getTodaysCritters() {

  let baseId = PropertiesService.getScriptProperties().getProperty('airtableBaseId');
  let data = getAllAirtable(baseId, 'Critters');

  let today = new Date();
  let monthNow = today.toLocaleString('default', { month: 'long' });

  data = data.filter(critter => critter['fields']['Months Available'].includes(monthNow))

  Logger.log(data.length + ' Critters Found');

  //This loop is added to the data call to enforce default false values for Caught, Donated, and Modeled since
  //Airtable will not deliver false, empty, or null values in the http request payload.
  
  const fieldsSchema = { "Caught": false, "Donated": false, "Modeled": false };
  data.forEach(function (critter, index) {
    let buildData = { ...fieldsSchema, ...critter['fields'] };
    this[index]['fields'] = buildData;
  }, data);

  return data;
}

function catchCritter(recordId) {
  
  let payload = {
    "records": [
      {
        "id": recordId,
        "fields": {
          "Caught": true
        }
      }
    ]
  };

  let baseId = PropertiesService.getScriptProperties().getProperty('airtableBaseId');
  airtableUpdate(baseId, 'Critters', payload);
}

function donateCritter(recordId) {
  let payload = {
    "records": [
      {
        "id": recordId,
        "fields": {
          "Donated": true
        }
      }
    ]
  };

  let baseId = PropertiesService.getScriptProperties().getProperty('airtableBaseId');
  airtableUpdate(baseId, 'Critters', payload);
}

function modelCritter(recordId) {
  let payload = {
    "records": [
      {
        "id": recordId,
        "fields": {
          "Modeled": true,
        }
      }
    ]
  };

  let baseId = PropertiesService.getScriptProperties().getProperty('airtableBaseId');
  airtableUpdate(baseId, 'Critters', payload);
}

///////// Airtable Utilities /////////

function getAllAirtable(baseId, tableName) {
  let response = fetchAirtable(baseId, tableName);
  let records = response['records'];

  while (response.hasOwnProperty('offset')) {
    response = fetchAirtable(baseId, tableName, response['offset']);
    records = records.concat(response['records']);
  }

  Logger.log(records.length + ' Total Records Received');

  return records;
}

function fetchAirtable(baseId, tableName, offset) {
  const options = {
    'method': 'get',
    'headers': {
      'Authorization': 'Bearer ' + PropertiesService.getScriptProperties().getProperty('airtableKey')
    }
  };

  let url = 'https://api.airtable.com/v0/' + baseId + '/' + tableName;

  if (typeof (offset) != "undefined") {
    url = url + '?offset=' + offset;
  };

  const response = JSON.parse(UrlFetchApp.fetch(url, options));

  Logger.log(response.records.length + ' records received in batch');

  return response;
};

function airtableCreate(baseId, tableName, payload) {
  var options = {
    'method': 'post',
    'muteHttpExceptions': true,
    'headers': {
      'Authorization': 'Bearer ' + PropertiesService.getScriptProperties().getProperty('airtableKey'),
      'Content-Type': 'application/json'
    },
    'payload': JSON.stringify(payload)
  };
  var url = 'https://api.airtable.com/v0/' + baseId + '/' + tableName
  let response = JSON.parse(UrlFetchApp.fetch(url, options));
  return response;
}

function airtableUpdate(baseId, tableName, payload) {
  var options = {
    'method': 'patch',
    'muteHttpExceptions': true,
    'headers': {
      'Authorization': 'Bearer ' + PropertiesService.getScriptProperties().getProperty('airtableKey'),
      'Content-Type': 'application/json'
    },
    'payload': JSON.stringify(payload)
  };
  var url = 'https://api.airtable.com/v0/' + baseId + '/' + tableName
  let response = JSON.parse(UrlFetchApp.fetch(url, options));
  return response;
}
