import "./Record.scss";

import React, { Component } from "react";
import { inject, observer } from "mobx-react";

import Button from "../components/Button";
import Loading from "../components/Loading";
import NumBox from "../components/NumBox";
import { RecordType } from "../core/viewmodels/Types";
import RecordViewModel from "../core/viewmodels/RecordViewModel";
import { RouteComponentProps } from "react-router-dom";
import { ViewModelLocator } from "../core/ViewModelLocator";
import dayjs from "dayjs";
import i18n from "../i18n";

interface IProps extends RouteComponentProps {
  locator: ViewModelLocator;
}

interface IState {
  vm?: RecordViewModel;
}

@inject("locator")
@observer
class Record extends Component<IProps, IState> {
  state: IState = {};

  componentDidMount() {
    const locator = this.props.locator;
    const id = this.props.match.params["id"];

    if (locator.recordVM) {
      this.setState({ vm: this.props.locator.recordVM });
    } else {
      this.props.locator.once("init", () => {
        locator.selectRecordById(id);
        this.setState({ vm: locator.recordVM });
      });
    }
  }

  render() {
    const { vm } = this.state;
    const record = vm?.record;
    const txs = vm?.txs;
    const closed = record?.isClosed;

    return (
      <div className="record page">
        <h1>{`${
          record ? (record.type === RecordType.Deposit ? i18n.t("record_deposit_details") : i18n.t("record_loan_details")) : i18n.t("record_title")
        }`}</h1>

        <div className="details">
          <div className="detail">
            <div className="head">
              <h3>{i18n.t("record_basic_info")}</h3>
              {closed ? <span>{i18n.t("closed")}</span> : undefined}
            </div>

            <div className="item">
              <span>{i18n.t("common_amount")}:</span>
              <span className="uppercase">{record ? `${Number.parseFloat(record?.amount ?? 0).toFixed(4)} ${record?.token}` : <Loading />}</span>
            </div>

            <div className="item">
              <span>APR:</span>
              <span>{record ? `${record.apr}%` : <Loading />}</span>
            </div>

            <div className="item">
              <span>{i18n.t("common_interest")}:</span>
              <span className="uppercase">{record ? `${record.interest} ${record.token}` : <Loading />}</span>
            </div>

            <div className="item">
              <span>{i18n.t("common_term")}:</span>
              <span>{record ? `${record.term} ${i18n.t(record.term > 1 ? "common_days" : "common_day")}` : <Loading />}</span>
            </div>

            <div className="item">
              <span>
                {i18n.t("common_maturity_date")} ({dayjs.tz.guess()}):
              </span>
              <span className="uppercase">{record ? `${record.maturityDate}` : <Loading />}</span>
            </div>

            {record?.type === RecordType.Borrow ? (
              <div className="item">
                <span>{i18n.t("common_collateralization_ratio")}:</span>
                <span>{`${record.collateralizationRatio}%`}</span>
              </div>
            ) : undefined}

            {record?.type === RecordType.Borrow ? (
              <div className="item">
                <span>{i18n.t("record_liquidated_collateral")}:</span>
                <span className="uppercase">{`${record.soldCollateralAmount} ${record.token}`}</span>
              </div>
            ) : undefined}
          </div>

          {record?.type === RecordType.Deposit && !closed ? (
            <div className="detail">
              <div className="head">
                <h3>{record.isMatured ? i18n.t("deposit_detail_button_withdraw") : i18n.t("deposit_detail_button_early_withdraw")}</h3>
                <span></span>
              </div>

              <div className="item" style={{ display: "none" }}>
                <span>{i18n.t("record_withdraw_amount")}:</span>
                <span className="uppercase">{`${Number.parseFloat(record.amount).toFixed(4)} ${record.token}`}</span>
              </div>

              <div className="form">
                <NumBox title={i18n.t("record_withdraw_amount")} maxValue={record.amount} defaultValue={record.amount} disabled />
                <Button loading={vm?.withdrawing} onClick={vm?.withdraw} loadingColor="lightgrey">
                  {i18n.t(record.isMatured ? "deposit_detail_button_withdraw" : "deposit_detail_button_early_withdraw")}
                </Button>
              </div>
            </div>
          ) : undefined}

          {record?.type === RecordType.Borrow && !closed ? (
            <div className="detail">
              <div className="head">
                <h3>{i18n.t("record_debt")}</h3>
                <span></span>
              </div>

              <div className="item">
                <span>{i18n.t("common_remaining_debt")}:</span>
                <span className="uppercase">{`${Number.parseFloat(record.remainingDebt).toFixed(4)} ${record.token}`}</span>
              </div>

              <div className="form">
                <NumBox
                  title={i18n.t("record_repay_amount")}
                  maxValue={record.remainingDebt}
                  onChange={vm?.updateRepayAmount}
                  isValid={vm?.isRepayAmountLegal ?? true}
                />
                <Button loading={vm?.repaying} onClick={vm?.repay} loadingColor="lightgrey" disabled={!vm?.isRepayAmountLegal}>
                  {i18n.t("button_repay")}
                </Button>
              </div>
            </div>
          ) : undefined}

          {record?.type === RecordType.Borrow && !closed ? (
            <div className="detail">
              <div className="head">
                <h3>{i18n.t("record_withdraw_collateral")}</h3>
                <span></span>
              </div>

              <div className="item">
                <span>{i18n.t("common_total_collateral")}:</span>
                <span className="uppercase">{`${Number.parseFloat(record.collateralAmount).toFixed(4)} ${record.collateralToken?.name}`}</span>
              </div>

              <div className="form">
                <NumBox
                  title={i18n.t("record_withdraw_amount")}
                  secondTitle={`New CCR: ${vm?.newWithdrawCR}%`}
                  onChange={vm?.updateWithdrawCollateralAmount}
                  maxValue={vm?.maxWithdrawCollateral}
                  onButtonClick={() => vm?.updateWithdrawCollateralAmount(vm!.maxWithdrawCollateral!)}
                  isValid={vm?.isWithdrawCollateralAmountLegal ?? true}
                />
                <Button
                  loading={vm?.withdrawingCollateral}
                  onClick={vm?.withdrawCollateral}
                  loadingColor="lightgrey"
                  disabled={!vm?.isWithdrawCollateralAmountLegal}
                >
                  {i18n.t("button_withdraw")}
                </Button>
              </div>
            </div>
          ) : undefined}

          {record?.type === RecordType.Borrow && !closed ? (
            <div className="detail">
              <div className="head">
                <h3>{i18n.t("record_deposit_collateral")}</h3>
                <span></span>
              </div>

              <div className="item">
                <span>{i18n.t("common_total_collateral")}:</span>
                <span className="uppercase">{`${Number.parseFloat(record.collateralAmount).toFixed(4)} ${record.collateralToken?.name}`}</span>
              </div>

              <div className="form">
                <NumBox
                  title={i18n.t("record_deposit_amount")}
                  secondTitle={`New CCR: ${vm?.newDepositCR}%`}
                  secondDesc="New Collateral Coverage Ratio"
                  onChange={vm?.updateDepositCollateralAmount}
                  maxValue={vm?.maxDepositCollateral}
                  onButtonClick={() => vm?.updateDepositCollateralAmount(vm!.maxDepositCollateral!)}
                  isValid={vm?.isDepositCollateralAmountLegal ?? true}
                />
                <Button
                  loading={vm?.depositingCollateral}
                  onClick={vm?.depositCollateral}
                  loadingColor="lightgrey"
                  disabled={!vm?.isDepositCollateralAmountLegal}
                >
                  {i18n.t("button_deposit_collateral")}
                </Button>
              </div>
            </div>
          ) : undefined}
        </div>

        <div className="transactions">
          <h3>{i18n.t("record_transactions")}</h3>
          <table>
            <thead>
              <tr>
                <th>{i18n.t("common_time")}</th>
                <th>{i18n.t("common_action")}</th>
                <th>{i18n.t("common_amount")}</th>
              </tr>
            </thead>

            <tbody>
              {txs && txs.length > 0 ? (
                txs.map((tx) => (
                  <tr key={tx.transactionHash} onClick={(_) => vm?.openTx(tx)}>
                    <td>{tx.time}</td>
                    <td>{i18n.t(`event_${tx.event}`)}</td>
                    <td className="uppercase">{`${tx.amount} ${tx.token?.name}`}</td>
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
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default Record;
