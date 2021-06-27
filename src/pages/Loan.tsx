import "./Lend.scss";

import React, { Component } from "react";
import { inject, observer } from "mobx-react";

import Button from "../components/Button";
import Calendar from "../components/Calendar";
import LendNavMobile from "../components/LendNavMobile";
import Loading from "../components/Loading";
import LoanViewModel from "../core/viewmodels/LoanViewModel";
import NumBox from "../components/NumBox";
import Skeleton from "react-loading-skeleton";
import TokenSelector from "../components/TokenSelector";
import { ViewModelLocator } from "../core/ViewModelLocator";
import dayjs from "dayjs";
import i18n from "../i18n";

interface IProps {
  locator: ViewModelLocator;
}

interface State {
  vm?: LoanViewModel;
  preview: Date;
  ranges: { startDate: Date; endDate: Date; key: "selection" }[];
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

  onLoanMaxClick = () => {
    const vm = this.props.locator.loanVM;
    vm?.inputLoan(vm?.maxLoanAmount);
  };

  onCollateralMaxClick = () => {
    const vm = this.props.locator.loanVM;
    vm?.inputCollateral(vm!.maxCollateralAmount!);
  };

  render() {
    const { vm } = this.state;
    const loading = !vm || vm?.loading;
    const sending = vm?.sending;
    const buttonDisabled =
      (vm && vm.term && vm.selectedPool && vm.inputLoanValue && vm.inputCollateralValue ? false : true) ||
      vm?.sending ||
      !vm?.inputLoanLegal ||
      !vm?.inputCollateralValueLegal;

    return (
      <div className="loan page">
        <LendNavMobile type="borrow" />
        <h1 className="legend">{i18n.t("loan_title")}</h1>

        <div className="content">
          <Calendar
            months={1.33}
            onPreview={vm?.peekTerm}
            maxDate={vm?.maxDate}
            minDate={vm?.minDate}
            onSelect={vm?.selectTerm}
            onMouseOut={vm?.restoreTerm}
            type="Borrow"
          />

          <div className="form">
            <div className="items">
              <div className="item">
                <TokenSelector title={i18n.t("loan_loan_token")} tokens={vm?.loanTokens} onChange={vm?.selectLoanPair} />
              </div>
              <div className="item">
                <NumBox
                  title={i18n.t("common_amount")}
                  onChange={vm?.inputLoan}
                  maxValue={vm?.maxLoanAmount}
                  onButtonClick={this.onLoanMaxClick}
                  isValid={vm?.inputLoanLegal ?? true}
                />
              </div>
              <div className="item">
                <TokenSelector title={i18n.t("loan_collateral_token")} tokens={vm?.collateralTokens} />
              </div>

              <div className="item">
                <NumBox
                  title={i18n.t("loan_collateral_amount")}
                  onChange={vm?.inputCollateral}
                  maxValue={vm?.maxCollateralAmount}
                  onButtonClick={this.onCollateralMaxClick}
                  isValid={vm?.inputCollateralValueLegal ?? true}
                />
              </div>

              <div className="item">
                <span>{i18n.t("common_term")}:</span>
                <span>{loading ? <Loading /> : `${vm!.term}-${i18n.t("common_day")}`}</span>
              </div>

              <div className="item">
                <span>{i18n.t("common_interest")}:</span>
                <span>{loading ? <Loading /> : `${vm!.interest.toFixed(4)} ${vm!.loanToken.name.toUpperCase()}`}</span>
              </div>

              <div className="item">
                <span>APR:</span>
                <span>{loading ? <Loading /> : `${(vm!.apr * 100).toFixed(2)}%`}</span>
              </div>

              <div className="item">
                <span>{i18n.t("common_collateralization_ratio")}:</span>
                <span>{loading ? <Loading /> : `${vm!.collateralization.toFixed(2)}%`}</span>
              </div>

              <div className="item">
                <span>
                  {i18n.t("common_maturity_date")} ({dayjs.tz.guess()}):
                </span>
                <span>{loading ? <Loading /> : vm!.maturityDate}</span>
              </div>
            </div>

            {loading ? (
              <Skeleton height={37} />
            ) : (
              <Button disabled={buttonDisabled} onClick={vm?.loan} loading={sending}>
                {vm?.selectedCollateralToken?.allowance?.eq(0) ? `${i18n.t("button_approve")} ${vm?.selectedCollateralToken?.name.toUpperCase()} and ${i18n.t("button_loan")}` : i18n.t("button_loan")}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default Loan;
