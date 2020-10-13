import React, { Component } from "react";
import "./History.scss";
import Currency from "../components/Currency";
import { inject, observer } from "mobx-react";
import { History } from "history";
import { ViewModelLocator } from "../core/ViewModelLocator";
import HistoryViewModel from "../core/viewmodels/HistoryViewModel";

interface IProps {
  history: History;
  locator: ViewModelLocator;
}

interface IState {
  vm?: HistoryViewModel;
}

const types = [
  { label: "Active", value: "active" },
  { label: "Deposit", value: "deposit" },
  { label: "Borrow", value: "loan" },
  { label: "Closed", value: "closed" },
];

@inject("history")
@inject("locator")
@observer
class HistoryPage extends Component<IProps, IState> {
  state: IState = {};

  componentDidMount() {
    this.setState({ vm: this.props.locator.historyVM });
    this.props.locator.once("init", () => this.setState({ vm: this.props.locator.historyVM }));

    if (this.props.locator.initFinished) {
      this.props.locator.historyVM.refresh();
    }
  }

  render() {
    const { vm } = this.state;

    return (
      <div className="history page">
        <div className="categories">
          <h1>History</h1>
          <div className="nav">
            {types.map((t) => {
              return (
                <div key={t.value} className={`item ${vm?.type === t.value ? "active" : ""}`}>
                  {t.label}
                </div>
              );
            })}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th className="token">
                <div>Token</div>
              </th>
              <th>Amount</th>
              <th>Interest</th>
              <th>APR</th>
              <th>Term</th>
              <th>Maturity Date</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr onClick={(_) => this.props.history.push("/record/abc")}>
              <td className="token">
                <div>
                  <Currency symbol="dai" />
                  DAI
                  <span className="lend">↓</span>
                </div>
              </td>
              <td>12,345 DAI</td>
              <td>20 DAI</td>
              <td>5%</td>
              <td>90 Days</td>
              <td>2020-09-01</td>
              <td>Matured</td>
            </tr>
            <tr>
              <td className="token">
                <div>
                  <Currency symbol="usdc" />
                  USDC
                  <span className="loan">↑</span>
                </div>
              </td>
              <td>500 USDC</td>
              <td>12 USDC</td>
              <td>8%</td>
              <td>30 Days</td>
              <td>2020-09-01</td>
              <td>Matured</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
}

export default HistoryPage;
