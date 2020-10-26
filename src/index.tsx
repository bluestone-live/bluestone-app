import "./index.scss";

import * as serviceWorker from "./serviceWorker";

import App from "./App";
import { Provider } from "mobx-react";
import React from "react";
import ReactDOM from "react-dom";
import ViewModelLocator from "./core/ViewModelLocator";
import dayjs from "dayjs";
import history from "./core/services/History";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);
ViewModelLocator.init();

ReactDOM.render(
  <Provider history={history} locator={ViewModelLocator}>
    <App />
  </Provider>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
