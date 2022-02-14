const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { google } = require('googleapis');

// 如果 SCOPES 有更改過，需要刪除 token.json 重新認證
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = path.join(__dirname, 'token.json');

let forceTokenGenerate;

async function main(genToken = false) {
  console.log(`Run authorize check, gen new token?: ${genToken}`);
  forceTokenGenerate = genToken;
  const authClient = await authorization();
  return authClient;
}

async function authorization() {
  /**
   * 第一步:
   * 取得 credentials json 檔案，取得方式我有寫成說明，
   * 可以看這裡：https://github.com/balabambe/googlesheet-to-vuei18n
   */
  const checkCredentials = new Promise((resolve, reject) => {
    console.log(`Checking credentials file...`);
    fs.readFile(path.join(__dirname, 'credentials.json'), (err, content) => {
      if (err) {
        return reject(`Error loading client secret file: ${err}`);
      }
      const credentials = JSON.parse(content);
      const { client_secret, client_id, redirect_uris } = credentials.installed;
      const oAuth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0],
      );
      console.log('Checking credentials success.');
      return resolve(oAuth2Client);
    });
  });

  const oAuth2Client = await checkCredentials.catch((err) => {
    console.error(err);
    throw new Error(err);
  });

  /**
   * 第二步:
   * 檢查是否有 token.json
   * 沒有的話直接吐 Error
   * 如果是在 cli 模式下
   * 會到 getNewToken 取得 access token
   * 
   * 如果是從其他隻程式來取，沒取到就是直接吐 Error
   */
  const checkToken = new Promise((resolve, reject) => {
    console.log('Checking token file...');
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err || forceTokenGenerate) {
        console.log(`${forceTokenGenerate ? 'Force generate new token...' : 'Token file does not exists...'}`);
        return reject(`Error loading token file: ${err}`);
      };
      console.log(`Get token success, setting oAuth2 Credentials...`);
      oAuth2Client.setCredentials(JSON.parse(token));
      return resolve(oAuth2Client);
    });
  });

  return checkToken.catch((err) => {
      if (forceTokenGenerate) {
        getNewToken(oAuth2Client);
        return true;
      }
      console.error(err);
      throw new Error(err);
    });
  
}

/**
 * 取得 access token:
 * 從 credentials 內取得參數，產生認證 URL，
 * 再透過瀏覽器打開網址取得 token 並輸入，
 * token 就會自動產生一個名為 token.json 的檔案，
 * 下次認證時，就不用再跑一次認證
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 */
 function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err)
        return console.error(
          'Error while trying to retrieve access token',
          err,
        );
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log(`Token stored to ${TOKEN_PATH}`);
      });
    });
  });
}

if (process.argv[2] === 'yes') {
  main(true);
}

module.exports = main;
