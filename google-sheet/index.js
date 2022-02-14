/* eslint-disable no-console */
const { google } = require('googleapis');
const googleAuth = require('./authorization');
const SPREADSHEET_ID = '1QrtRGZNxzOucrDDD-BL600bT17evr53lenOHUdROjwM';
const SPREADSHEET_RANGE = 'Data Harvest';
const sheets = google.sheets('v4');

async function authorize() {
  try {
    const oAuth2Client = await googleAuth();
    return oAuth2Client;
  } catch(err){
    console.error(err);
  }
}

function writeSheetData(auth, payload) {
  return new Promise((resolve, reject) => {

    sheets.spreadsheets.values.append(
      {
        spreadsheetId: SPREADSHEET_ID,
        range: SPREADSHEET_RANGE,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        includeValuesInResponse: true,
        responseDateTimeRenderOption: 'FORMATTED_STRING',
        responseValueRenderOption: 'FORMATTED_VALUE',
        auth,
        resource: {
          values: [
            payload
          ],
        }
      },
      (err, res) => {
        if (err) {
          return reject('The API returned an error: ' + err);
        }
        const resp = res.data;
        console.log('sheet response(serialized): ' + JSON.stringify(resp));
        return resolve(resp);
      },
    );
  });
}

async function listSheetDatas(auth) {
  return new Promise((resolve, reject) => {
    sheets.spreadsheets.values.get(
      {
        spreadsheetId: SPREADSHEET_ID,
        range: SPREADSHEET_RANGE,
        auth,
      },
      (err, res) => {
        if (err) {
          return reject('The API returned an error: ' + err);
        }
        const rows = res.data.values;
        return resolve(rows);
      },
    );
  }); 
}

module.exports = {
  authorize,
  listSheetDatas,
  writeSheetData,
};