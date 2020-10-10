import React from "react";
import ReactDOM from "react-dom";
import "./index.scss";
import { Provider } from "mobx-react";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import { createBrowserHistory } from "history";
const history = createBrowserHistory();

ReactDOM.render(
  <Provider history={history}>
    <App />
  </Provider>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
