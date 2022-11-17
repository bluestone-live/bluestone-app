import "./Gateway.scss";
import React, { Component } from "react";
import i18n from "../i18n";
import NumBox from "../components/NumBox";
import { ViewModelLocator } from "../core/ViewModelLocator";
import { inject, observer } from "mobx-react";
import GatewayViewModel from "../core/viewmodels/GatewayViewModel";
import Button from "../components/Button";
import Skeleton from "react-loading-skeleton";
import TokenSelector from "../components/TokenSelector";
import Loading from "../components/Loading";

interface IProps {
  locator: ViewModelLocator;
}

interface IState {
  vm?: GatewayViewModel;
}

@inject("locator")
@observer
class Gateway extends Component<IProps, IState> {
  state: IState = {
    vm: undefined
  };
  componentDidMount() {
    this.setState({ vm: this.props.locator.gatewayVM });
    this.props.locator.once("init", () => this.setState({ vm: this.props.locator.gatewayVM }));
  }

  addToWallet = async (tokenName: string) => {
    const { vm } = this.state;
    await vm?.addTokenToWallet(tokenName);
  }

  transfer = async () => {
    const { vm } = this.state;
    await vm?.transfer();
  }

  onMaxAmountClick = () => {
    const { vm } = this.state;
    vm?.inputAmountCheck(vm?.maxAvailableAmount);
  }

  render() {
    const { vm } = this.state;
    const loading = !vm || vm?.loading;
    const transferDisabled = loading || vm?.transferLoading || !vm?.inputAmountLegal;
    const txs = [];

    return (
      <div className="gateway page">
        <h1 className="legend">{i18n.t("gateway_title")}</h1>
        <div className="content">
          <div>
            <h2>Buy</h2>
            Please contact bank.
          </div>
          <div>
            <h2>Sell</h2>
            <div className="items">
              <div className="item">
                <TokenSelector
                  title={i18n.t("gateway_token")}
                  tokens={vm?.tokenSymbols}
                  onChange={(token) => vm?.selectToken(token)}
                />
              </div>

              <div className="item">
                <NumBox
                  title={i18n.t("gateway_token_amount")}
                  onChange={vm?.inputAmountCheck}
                  maxValue={vm?.maxAvailableAmount}
                  onButtonClick={this.onMaxAmountClick}
                  isValid={vm?.inputAmountLegal ?? true}
                  errorMsg={vm?.inputAmountErrorMsg}
                />
              </div>

              {loading ? (
                <Skeleton height={37} />
              ) : (
                <Button disabled={transferDisabled} onClick={() => this.transfer()}>
                  {i18n.t("gateway_transfer")}
                </Button>
              )}
            </div>
          </div>

        </div>

        <div className="transactions">
          <h3>{i18n.t("record_transactions")}</h3>
          <table>
            <thead>
              <tr>
                <th>{i18n.t("common_time")}</th>
                <th>{i18n.t("common_action")}</th>
                <th>{i18n.t("common_amount")}</th>
                <th>{i18n.t("common_status")}</th>
              </tr>
            </thead>

            <tbody>
              {txs && txs.length > 0 ? (
                txs
              ) : (
                <tr>
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
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }
}

export default Gateway;