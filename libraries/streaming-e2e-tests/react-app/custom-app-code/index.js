import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { DirectLineStreaming } from 'botframework-directlinejs';
import { path } from 'path';
import { dotenv } from 'dotenv';
const ENV_FILE = path.join(__dirname, '.env');
dotenv.config({ path: ENV_FILE });

(async function() {
  console.log('**********************BOT_HOSTNAME: ', BOT_HOSTNAME);
  const botHostname = process.env.BOT_HOSTNAME;
  const res = await fetch(`https://${botHostname}.azurewebsites.net/api/token/directlinease`, {
    method: 'POST'
  });

  const { token } = await res.json();

  const directLine = new DirectLineStreaming({
    domain: `https://${botHostname}.azurewebsites.net/.bot/v3/directline`,
    token
  });

  ReactDOM.render(
    <React.StrictMode>
      <App directLine={directLine}/>
    </React.StrictMode>,
    document.getElementById('root')
  );
})();

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
