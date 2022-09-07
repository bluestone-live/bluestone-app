import "./App.scss";
import "react-date-range/dist/styles.css"; // main css file
import "react-date-range/dist/theme/default.css"; // theme css file
// import { ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

import { Footer, Header } from "./layouts";
import { HistoryPage, Home, LendPage, LoanPage, RecordPage } from "./pages";
import { Route, Router, Switch } from "react-router-dom";

import { History } from "history";
import React from "react";
import { ViewModelLocator } from "./core/ViewModelLocator";
import { inject } from "mobx-react";

interface IApp {
  history?: History;
  locator?: ViewModelLocator;
}

@inject("history")
@inject("locator")
export default class App extends React.Component<IApp, {}> {
  render() {
    return (
      <Router history={this.props.history!}>
        <div className="App">
          <div className="top">
            <Header />
          </div>
          {/* <ToastContainer /> */}
          <Switch>
            <Route component={LendPage} path="/lend" />
            <Route component={LoanPage} path="/borrow" />
            <Route component={HistoryPage} path="/history" />
            <Route component={RecordPage} path="/record/:id" />
            <Route component={Home} />
          </Switch>

          <Footer />
        </div>
      </Router>
    );
  }
}
