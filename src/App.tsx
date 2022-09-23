import "./App.scss";
import "react-date-range/dist/styles.css"; // main css file
import "react-date-range/dist/theme/default.css"; // theme css file

import { Footer, Header } from "./layouts";
import { Home, FaucetPage, LendPage, LoanPage, HistoryPage, RecordPage } from "./pages";
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

          <Switch>
            <Route component={FaucetPage} path="/faucet" />
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
