import "./History.scss";

import React, { Component } from "react";
import { inject, observer } from "mobx-react";

import Currency from "../components/Currency";
import { History } from "history";
import HistoryViewModel from "../core/viewmodels/HistoryViewModel";
import { IRecordUI } from "../core/viewmodels/Types";
import Loading from "../components/Loading";
import { ViewModelLocator } from "../core/ViewModelLocator";
import i18n from "../i18n";

interface IProps {
  history: History;
  locator: ViewModelLocator;
}

interface IState {
  vm?: HistoryViewModel;
}

const types = [
  { label: i18n.t("history_nav_active"), value: "active" },
  { label: i18n.t("history_nav_deposit"), value: "deposit" },
  { label: i18n.t("history_nav_borrow"), value: "loan" },
  { label: i18n.t("history_nav_closed"), value: "closed" },
];

@inject("history")
@inject("locator")
@observer
class HistoryPage extends Component<IProps, IState> {
  state: IState = {};

  componentDidMount() {
    this.setState({ vm: this.props.locator.historyVM });
    this.props.locator.once("init", () => {
      this.setState({ vm: this.props.locator.historyVM });
      this.props.locator.historyVM!.refresh();
    });

    if (this.props.locator.initFinished) {
      this.props.locator.historyVM!.refresh();
    }
  }

  selectRecord = (record: IRecordUI) => {
    this.state.vm?.selectRecord(record);
    this.props.history.push(`/record/${record.id}`);
  };

  render() {
    const { vm } = this.state;

    return (
      <div className="history page">
        <div className="categories">
          <h1>{i18n.t("history_title")}</h1>
          <div className="nav">
            {types.map((t) => {
              return (
                <div
                  key={t.value}
                  className={`item ${vm?.type === t.value ? "active" : ""}`}
                  onClick={() => vm?.switch(t.value as any)}
                >
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
                <div>{i18n.t("common_token")}</div>
              </th>
              <th>{i18n.t("common_type")}</th>
              <th>{i18n.t("common_amount")}</th>
              <th>{i18n.t("common_interest")}</th>
              <th>APR</th>
              <th>{i18n.t("common_term")}</th>
              <th>{i18n.t("common_maturity_date")}</th>
            </tr>
          </thead>

          <tbody>
            {vm && !vm.loading
              ? vm.currentRecords.map((r, i) => {
                  return (
                    <tr key={i} onClick={(_) => this.selectRecord(r)}>
                      <td className="token">
                        <div>
                          <Currency symbol={r.token} />
                          {r.token}
                          {/* <span className="lend">↓</span> */}
                        </div>
                      </td>
                      <td className="type">{r.type}</td>
                      <td className="amount">{`${r.amount} ${r.token}`}</td>
                      <td className="interest">{`${r.interest} ${r.token}`}</td>
                      <td>{r.apr}%</td>
                      <td>{r.term} Days</td>
                      <td>{r.maturityDate}</td>
                    </tr>
                  );
                })
              : new Array(7).fill(1).map((_, i) => {
                  return (
                    <tr key={i}>
                      <td className="token">
                        <div>
                          <Loading />
                        </div>
                      </td>
                      <td className="type">
                        <Loading />
                      </td>
                      <td className="amount">
                        <Loading />
                      </td>
                      <td className="interest">
                        <Loading />
                      </td>
                      <td>
                        <Loading />
                      </td>
                      <td>
                        <Loading />
                      </td>
                      <td>
                        <Loading />
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    );
  }
}

export default HistoryPage;
