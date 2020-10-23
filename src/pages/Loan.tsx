import "./Lend.scss";

import React, { Component } from "react";
import { inject, observer } from "mobx-react";

import Calendar from "../components/Calendar";
import Loading from "../components/Loading";
import LoanViewModel from "../core/viewmodels/LoanViewModel";
import NumBox from "../components/NumBox";
import Skeleton from "react-loading-skeleton";
import TokenSelector from "../components/TokenSelector";
import { ViewModelLocator } from "../core/ViewModelLocator";

interface IProps {
  locator: ViewModelLocator;
}

interface State {
  vm?: LoanViewModel;
  preview: Date;
  ranges: { startDate: Date; endDate: Date; key: "selection" }[];

  maxLoan?: string;
}

@inject("locator")
@observer
class Loan extends Component<IProps, State> {
  state: State = {
    ranges: [
      {
        startDate: new Date(),
        endDate: new Date(),
        key: "selection",
      },
    ],
    preview: new Date(),
  };

  componentDidMount() {
    this.setState({ vm: this.props.locator.loanVM });
    this.props.locator.once("init", () => this.setState({ vm: this.props.locator.loanVM }));
  }

  onLoanMaxClick = () => {};

  onCollateralMaxClick = () => {
    const vm = this.props.locator.loanVM;
    const collateralToken = vm?.selectedCollateralToken;
    if (!vm || !collateralToken) return;

    vm.inputCollateral(vm!.maxCollateralAmount!);
  };

  render() {
    const { vm } = this.state;
    const loading = !vm || vm?.loading;
    const buttonDisabled =
      (vm && vm.term && vm.selectedPool && vm.inputLoanValue && vm.inputCollateralValue ? false : true) || vm?.sending;

    return (
      <div className="loan page">
        <h1>Loan</h1>

        <div className="content">
          <Calendar
            months={1.33}
            onPreview={vm?.peekTerm}
            maxDate={vm?.maxDate}
            minDate={vm?.minDate}
            onSelect={vm?.selectTerm}
            onMouseOut={vm?.restoreTerm}
          />

          <div className="form">
            <div className="items">
              <div className="item">
                <TokenSelector title="Loan Token" tokens={vm?.loanTokens} onChange={vm?.selectLoanPair} />
              </div>
              <div className="item">
                <NumBox
                  title="Amount"
                  onChange={vm?.inputLoan}
                  defaultValue={this.state.maxLoan}
                  onButtonClick={this.onLoanMaxClick}
                />
              </div>
              <div className="item">
                <TokenSelector title="Collateral Token" tokens={vm?.collateralTokens} />
              </div>

              <div className="item">
                <NumBox
                  title="Collateral Amount"
                  onChange={vm?.inputCollateral}
                  maxValue={vm?.maxCollateralAmount}
                  onButtonClick={this.onCollateralMaxClick}
                />
              </div>

              <div className="item">
                <span>Terms:</span>
                <span>{loading ? <Loading /> : `${vm!.term} Days`}</span>
              </div>

              <div className="item">
                <span>Interest:</span>
                <span>{loading ? <Loading /> : `${vm!.interest.toFixed(4)} ${vm!.loanToken.name.toUpperCase()}`}</span>
              </div>

              <div className="item">
                <span>APR:</span>
                <span>{loading ? <Loading /> : `${(vm!.apr * 100).toFixed(2)}%`}</span>
              </div>

              <div className="item">
                <span>Collateralization Ratio:</span>
                <span>{loading ? <Loading /> : `${vm!.collateralization.toFixed(2)}%`}</span>
              </div>

              <div className="item">
                <span>Maturity Date:</span>
                <span>{loading ? <Loading /> : vm!.maturityDate}</span>
              </div>
            </div>

            {loading ? (
              <Skeleton height={37} />
            ) : (
              <button disabled={buttonDisabled} onClick={vm?.loan}>
                {vm?.loanToken.allowance?.eq(0) ? "Approve & Loan" : "Loan"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default Loan;
