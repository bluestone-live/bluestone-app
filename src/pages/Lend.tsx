import "./Lend.scss";

import React, { Component } from "react";
import { inject, observer } from "mobx-react";

import Button from "../components/Button";
import Calendar from "../components/Calendar";
import DepositViewModel from "../core/viewmodels/DepositViewModel";
import Loading from "../components/Loading";
import NumBox from "../components/NumBox";
import Skeleton from "react-loading-skeleton";
import TokenSelector from "../components/TokenSelector";
import { ViewModelLocator } from "../core/ViewModelLocator";
import dayjs from "dayjs";
import { ethers } from "ethers";
import i18n from "../i18n";

interface Props {
  locator: ViewModelLocator;
}

interface State {
  vm?: DepositViewModel;
  preview: Date;
  ranges: { startDate: Date; endDate: Date; key: "selection" }[];

  maxBalance?: string;
}

@inject("locator")
@observer
class Lend extends Component<Props, State> {
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

  private numbox!: NumBox;

  componentDidMount() {
    this.setState({ vm: this.props.locator.lendVM });
    this.props.locator.once("init", () => this.setState({ vm: this.props.locator.lendVM }));
  }

  onMaxClick = () => {
    const { vm } = this.state;
    const token = vm?.currentToken;
    const value = token ? ethers.utils.formatUnits(token.balance ?? "0", token.decimals ?? 18) : "0";

    this.setState({ maxBalance: value });
    this.numbox.setValue(value);
    vm?.inputBalance(value);
  };

  render() {
    const { vm } = this.state;
    const loading = !vm || vm?.loading;
    const sending = vm?.sending;
    const buttonDisabled = (vm && vm.term && vm.selectedPool && vm.inputValue ? false : true) || vm?.sending || !vm?.inputLegal;

    return (
      <div className="lend page">
        <div>
          <h1>{i18n.t("lend_title")}</h1>
        </div>
        <div className="content">
          <Calendar
            months={1.33}
            maxDate={vm?.maxDate}
            minDate={vm?.minDate}
            recommends={vm?.recommends}
            onPreview={vm?.peekTerm}
            onSelect={vm?.selectTerm}
            onMouseOut={vm?.restoreTerm}
          />

          <div className="form">
            <div className="items">
              <div className="item">
                <TokenSelector title={i18n.t("lend_deposit_token")} tokens={vm?.tokenSymbols} onChange={(token) => vm?.selectToken(token)} />
              </div>

              <div className="item input">
                <NumBox
                  ref={(e) => (this.numbox = e!)}
                  onChange={vm?.inputBalance}
                  defaultValue={this.state.maxBalance}
                  onButtonClick={this.onMaxClick}
                  title={i18n.t("lend_deposit_amount")}
                  isValid={vm?.inputLegal ?? true}
                />
              </div>

              <div className="item">
                <span>{i18n.t("common_term")}:</span>
                <span>{loading ? <Loading /> : `${vm!.term} ${vm!.term > 1 ? i18n.t("common_days") : i18n.t("common_day")}`}</span>
              </div>

              <div className="item">
                <span>APR:</span>
                <span>{loading ? <Loading /> : `${(vm!.apr * 100).toFixed(2)}%`}</span>
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
              <Button disabled={buttonDisabled} onClick={vm?.deposit} loading={sending}>
                {vm?.currentToken.allowance?.eq(0) ? `${i18n.t("button_approve")} & ${i18n.t("button_deposit")}` : i18n.t("button_deposit")}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default Lend;
