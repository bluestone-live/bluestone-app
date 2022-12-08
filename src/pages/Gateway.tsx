import "./Gateway.scss";
import React, { Component } from "react";
import { Button as MaButton, Box, Stepper, Step, StepLabel, Typography, StepContent, Paper } from '@mui/material';
import i18n from "../i18n";
import NumBox from "../components/NumBox";
import { ViewModelLocator } from "../core/ViewModelLocator";
import { inject, observer } from "mobx-react";
import GatewayViewModel from "../core/viewmodels/GatewayViewModel";
import Button from "../components/Button";
import Skeleton from "react-loading-skeleton";
import TokenSelector from "../components/TokenSelector";
import Loading from "../components/Loading";
import { shortenAddress } from "../core/services/Account";

interface IProps {
  locator: ViewModelLocator;
}

interface IState {
  vm?: GatewayViewModel;
}

// const progressSteps = [
//   'Transfered',
//   'Pending',
//   'Succeed',
// ];

const getSteps = (bankAccount?: string, account?: string) => {
  return [
    {
      label: 'Transfer USD to fiat gateway',
      description: `Please transfer USD from your verified bank account ${bankAccount ? bankAccount : "******"} to the Gateway bank account.`,
    },
    {
      label: 'Verify',
      description:
        'Waiting for fiat gateway verifying...',
    },
    {
      label: 'Mint SGC to wallet',
      description: `Gateway will mint tokens to your wallet ${account ? shortenAddress(account) : "0x****...****"} soon.`,
    },
  ]
}

const redeemSteps = [
  'Transfer SGC to fiat gateway',
  'Waiting for fiat gateway verifying...',
  'Redeem SGC to your verified bank account'
]

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
    await vm?.transferToGateway();
  }

  onMaxAmountClick = () => {
    const { vm } = this.state;
    vm?.inputAmountCheck(vm?.maxAvailableAmount);
  }

  render() {
    const { vm } = this.state;
    const loading = !vm || vm?.loading;
    const transferDisabled = loading || vm?.transferLoading || !vm?.inputAmountLegal;
    const steps = getSteps(vm?.bankAccount, this.props.locator.account);
    const txs = vm?.txs;

    return (
      <div className="gateway page">
        <h1 className="legend">{i18n.t("gateway_title")}</h1>
        <div className="content">
          <div>
            <h2>{i18n.t("gateway_buy")}</h2>
            <div className="left-space">
              <div className="steps-space">
                <Stepper activeStep={vm?.activeBuyStep} orientation="vertical">
                  {steps.map((step, index) => (
                    <Step key={step.label} onClick={() => { vm?.setActiveBuyStep(index) }}>
                      <StepLabel className="clickable" >
                        {step.label}
                      </StepLabel>
                      <StepContent>
                        <Typography>{step.description}</Typography>
                        <Box sx={{ mb: 2 }}>
                        </Box>
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>
                <Paper square elevation={0} sx={{ p: 3 }}>
                  {
                    vm?.activeBuyStep === steps.length ?
                      <MaButton
                        onClick={() => { vm?.setActiveBuyStep(0) }}
                        sx={{ mt: 2, mb: 2 }}
                      >
                        {i18n.t("gateway_reset")}
                      </MaButton>
                      : undefined
                  }
                </Paper>
              </div>
            </div>
            {loading ? (
              <Skeleton height={37} />
            ) : (
              <Button
                onClick={() => { this.addToWallet("sgc") }}
              >
                {i18n.t("common_add_to_wallet", { tokenName: "SGC" })}
              </Button>)}
          </div>
          <div>
            <h2>{i18n.t("gateway_sell")}</h2>
            <div className="right-space">
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

              <div className="item amount-count">
                <h1>{`${vm?.inputAmountLegal ? vm?.inputAmount : "0"} USD`}</h1>
              </div>

              <Box sx={{ mb: 3 }}>
                <Stepper activeStep={vm?.activeRedeemStep} orientation="vertical">
                  {redeemSteps.map((step) => (
                    <Step key={step}>
                      <StepLabel>
                        {step}
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Box>
            </div>
            {loading ? (
              <Skeleton height={37} />
            ) : (
              <Button disabled={transferDisabled} onClick={() => this.transfer()} loading={vm?.transferLoading}>
                {vm?.allowance?.eq(0) ? `${i18n.t("button_approve")} ${vm?.currentToken?.name.toUpperCase()} & ${i18n.t("button_transfer")}` : i18n.t("button_transfer")}
              </Button>
            )}
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
              {txs ? (
                txs.map((tx) => (
                  <tr key={tx.transactionHash} onClick={(_) => vm?.openTx(tx)}>
                    <td>{tx.time}</td>
                    <td>{tx.action}</td>
                    <td className="uppercase">{`${Number.parseFloat(tx.amount || "0").toLocaleString()} ${tx.token?.name}`}</td>
                    <td>{tx.status}</td>
                    {/* <td>{
                      <Box>
                        <Stepper activeStep={tx.status} alternativeLabel>
                          {progressSteps.map((label) => (
                            <Step key={label}>
                              <StepLabel>{label}</StepLabel>
                            </Step>
                          ))}
                        </Stepper>
                      </Box>
                    }
                    </td> */}
                  </tr>
                ))
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