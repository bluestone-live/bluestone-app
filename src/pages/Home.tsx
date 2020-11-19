import "./Home.scss";

import React, { Component } from "react";
import { inject, observer } from "mobx-react";

import BorrowIcon from '../assets/borrow.svg';
import Currency from "../components/Currency";
import DepositIcon from '../assets/deposit.svg';
import HomeViewModel from "../core/viewmodels/HomeViewModel";
import { Link } from "react-router-dom";
import Loading from "../components/Loading";
import RiskIcon from '../assets/risk.svg';
import Skeleton from "react-loading-skeleton";
import { Slogan } from "../layouts";
import { ViewModelLocator } from "../core/ViewModelLocator";
import i18n from "../i18n";

// import protect from "../assets/protect-96.png";
// import requestMoney from "../assets/request-money-96.png";
// import sendMoney from "../assets/send-money-96.png";

interface IProps {
  locator: ViewModelLocator;
}

interface IState {
  vm?: HomeViewModel;
}

@inject("locator")
@observer
class Home extends Component<IProps, IState> {
  state: IState = {};

  componentDidMount() {
    const locator = this.props.locator;
    this.setState({ vm: locator.homeVM });

    this.props.locator.once("init", () => {
      this.setState({ vm: locator.homeVM });
      locator.homeVM?.refresh();
    });

    if (locator.initFinished) {
      locator.homeVM?.refresh();
    }
  }

  render() {
    const { vm } = this.state;

    return (
      <div className="home page">
        <Slogan />
        <div className="welcome" />

        <div className="content">
          <table>
            <thead>
              <tr>
                <th className="asset">{i18n.t("home_asset")}</th>
                <th>{i18n.t("home_lending_cap")}</th>
                <th>{i18n.t("home_best_lending_term")}</th>
                <th>{i18n.t("home_borrowing_apr")}</th>
                <th>{i18n.t("home_actions")}</th>
              </tr>
            </thead>

            <tbody>
              {vm && vm.pools
                ? vm.pools.map((p) => {
                    return (
                      <tr key={p.token.address}>
                        <td className="asset">
                          <div className="uppercase">
                            <Currency symbol={p.token.name} />
                            <span>{p.token.name}</span>
                          </div>
                        </td>
                        <td className="uppercase">{`${p.lendingAmount} ${p.token.name}`}</td>

                        <td>{`${p.lowestLendingApr}%-${p.bestLendingApr}%`}</td>
                        <td>{`${p.lowLoanApr}% - ${p.highLoanApr}%`}</td>
                        <td>
                          <Link to="/lend">
                            <button>{i18n.t("button_deposit")}</button>
                          </Link>
                          <Link to="/borrow">
                            <button>{i18n.t("button_loan")}</button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                : new Array(3).fill(1).map((_, i) => {
                    return (
                      <tr key={i}>
                        <td className="asset">
                          <div>
                            <Skeleton className="icon-loading" width={27} height={27} />
                            <Loading />
                          </div>
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

        <div className="features">
          <div className="feature">
            <div className="title">
              <img src={BorrowIcon} alt="Borrow" />
              <span>Borrow</span>
            </div>

            <div>Choose your favorable term and lock a fixed rate</div>
          </div>

          <div className="feature">
            <div className="title">
              <img src={DepositIcon} alt="Deposit" />
              <span>Deposit</span>
            </div>

            <div>Lend to the most borrowed pool and enjoy competitive APR</div>
          </div>

          <div className="feature">
            <div className="title">
              <img src={RiskIcon} alt="Security" />
              <span>No Bank Run Risk</span>
            </div>

            <div>All loans are guaranteed to be paid back</div>
          </div>
        </div>
      </div>
    );
  }
}

export default Home;
