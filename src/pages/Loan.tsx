import "./Lend.scss";
import { BigNumber, utils } from "ethers";
import { Component } from "react";
import { inject, observer } from "mobx-react";

import Button from "../components/Button";
import Calendar from "../components/Calendar";
import DateSelector from "../components/DateSelector";
import LendNavMobile from "../components/LendNavMobile";
import Loading from "../components/Loading";
import DateLoading from "../components/DateLoading";
import LoanViewModel from "../core/viewmodels/LoanViewModel";
import NumBox from "../components/NumBox";
import Skeleton from "react-loading-skeleton";
import TokenSelector from "../components/TokenSelector";
import { ViewModelLocator } from "../core/ViewModelLocator";
import dayjs from "dayjs";
import i18n from "../i18n";
import { InterestRateModelType } from "../core/viewmodels/Types";

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
    const interestRateType = vm?.interestRateModelType;
    let dateComponent;
    if (!loading) {
      if (interestRateType === InterestRateModelType.Linear) {
        dateComponent = <Calendar
          months={1.33}
          onPreview={vm?.peekTerm}
          maxDate={vm?.maxDate}
          minDate={vm?.minDate}
          onSelect={vm?.selectTerm}
          onMouseOut={vm?.restoreTerm}
          type="Borrow"
        />;
      } else {
        const interestParams = JSON.parse(JSON.stringify(vm?.loanToken.interestParams));
        const termStringList = interestParams[0].map((term: BigNumber) => utils.formatUnits(term, 0));
        const interestRateStringList = interestParams[1].map((interestRate: BigNumber) => parseFloat(utils.formatEther(interestRate)) * 100);
        dateComponent = <DateSelector
          termList={termStringList}
          interestRateList={interestRateStringList}
          onPreview={vm?.peekTerm}
          maxDate={vm?.maxDate}
          minDate={vm?.minDate}
          onSelect={vm?.selectTerm}
        />;
      }
    }
    const buttonDisabled =
      (vm && vm.term && vm.selectedPool && vm.inputLoanValue && vm.inputCollateralValue ? false : true) ||
      vm?.sending ||
      !vm?.inputLoanValueLegal ||
      !vm?.inputCollateralValueLegal;

    return (
      <div className="loan page">
        <LendNavMobile type="borrow" />
        <h1 className="legend">{i18n.t("loan_title")}</h1>

        <div className="content">
          {
            loading ? <DateLoading /> : dateComponent
          }
          <div className="form">
            <div className="items">
              <div className="item">
                <TokenSelector
                  title={i18n.t("loan_loan_token")}
                  tokens={vm?.loanTokens}
                  onChange={vm?.selectLoanToken}
                />
              </div>
              <div className="item">
                <NumBox
                  title={i18n.t("common_amount")}
                  onChange={vm?.inputLoan}
                  maxValue={vm?.maxLoanAmount}
                  onButtonClick={this.onLoanMaxClick}
                  isValid={vm?.inputLoanValueLegal ?? true}
                  errorMsg={vm?.loanValueErrorMsg}
                />
              </div>
              <div className="item">
                <TokenSelector
                  title={i18n.t("loan_collateral_token")}
                  tokens={vm?.collateralTokens}
                  onChange={vm?.selectCollateralToken}
                />
              </div>
              <div className="item">
                <NumBox
                  title={i18n.t("loan_collateral_amount")}
                  onChange={vm?.inputCollateral}
                  maxValue={vm?.maxCollateralAmount}
                  onButtonClick={this.onCollateralMaxClick}
                  isValid={vm?.inputCollateralValueLegal ?? true}
                  errorMsg={vm?.collateralValueErrorMsg}
                />
              </div>

              <div className="item">
                <span>
                  {loading ? "~/~:" : `${vm!.selectedCollateralToken.name!.toUpperCase()}/USD:`}
                </span>
                <span>{loading ? <Loading /> : `${Number(utils.formatUnits(vm!.selectedCollateralToken.price!.toString(), vm!.selectedCollateralToken.decimals)).toFixed(4)} $`}</span>
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
                <span>{loading ? i18n.t("common_collateralization_ratio") : `${i18n.t("common_collateralization_ratio")}(≥${vm!.currentLoanPair.minCollateralCoverageRatio.div(BigNumber.from(10).pow(16)).toNumber()}%)`}:</span>
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
