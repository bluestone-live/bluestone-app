import React from "react";
import "./App.scss";
import { Header, Footer } from "./layouts";
import { Router, Route, Switch } from "react-router-dom";
import { inject } from "mobx-react";
import { Home, LendPage, LoanPage, HistoryPage, RecordPage } from "./pages";
import { History } from "history";
import "react-date-range/dist/styles.css"; // main css file
import "react-date-range/dist/theme/default.css"; // theme css file

interface IApp {
  history?: History;
}

interface IState {
  isHome?: boolean;
}

@inject("history")
export default class App extends React.Component<IApp, {}> {
  state: IState = {};

  componentDidMount() {
    window.addEventListener("popstate", (_) => {
      this.setState({ isHome: window.location.pathname?.length <= 1 });
    });
  }

  render() {
    return (
      <Router history={this.props.history!}>
        <div className="App">
          <div className="top">
            <Header isHome={this.state.isHome} />
          </div>

          <Switch>
            <Route component={LendPage} path="/lend" />
            <Route component={LoanPage} path="/loan" />
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
