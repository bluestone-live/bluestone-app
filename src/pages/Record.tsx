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

    return (
      <div className="record page">
        <h1>{`${record?.type === RecordType.Deposit ? "Deposit Details" : "Loan Details"}`}</h1>

        <div className="details">
          <div className="detail">
            <div className="head">
              <h3>Basic Info</h3>
            </div>

            <div className="item">
              <span>Amount:</span>
              <span className="uppercase">{record ? `${record?.amount} ${record?.token}` : <Loading />}</span>
            </div>

            <div className="item">
              <span>APR:</span>
              <span>{record ? `${record.apr}%` : <Loading />}</span>
            </div>

            <div className="item">
              <span>Interest:</span>
              <span className="uppercase">{record ? `${record.interest} ${record.token}` : <Loading />}</span>
            </div>

            <div className="item">
              <span>Term:</span>
              <span>{record ? `${record.term} Days` : <Loading />}</span>
            </div>

            <div className="item">
              <span>Maturity Date:</span>
              <span className="uppercase">{record ? `${record.maturityDate}` : <Loading />}</span>
            </div>

            {record?.type === RecordType.Borrow ? (
              <div className="item">
                <span>Collateralization Ratio:</span>
                <span>{`${record.collateralizationRatio}%`}</span>
              </div>
            ) : undefined}

            {record?.type === RecordType.Borrow ? (
              <div className="item">
                <span>Liquidated Collateral:</span>
                <span className="uppercase">{`${record.soldCollateralAmount} ${record.token}`}</span>
              </div>
            ) : undefined}
          </div>

          {record?.type === RecordType.Deposit ? (
            <div className="detail">
              <div className="head">
                <h3>{record.isMatured ? "Withdraw" : "Early withdraw"}</h3>
                <span></span>
              </div>

              <div className="item">
                <span>Withdraw Amount:</span>
                <span className="uppercase">{`${record.amount} ${record.token}`}</span>
              </div>

              <div className="form">
                <NumBox title="Withdraw Amount" maxValue={record.amount} defaultValue={record.amount} disabled />
                <Button loading={vm?.withdrawing} onClick={vm?.withdraw}>
                  Withdraw
                </Button>
              </div>
            </div>
          ) : undefined}

          {record?.type === RecordType.Borrow ? (
            <div className="detail">
              <div className="head">
                <h3>Debt</h3>
                <span></span>
              </div>

              <div className="item">
                <span>Remaining Debt:</span>
                <span className="uppercase">{`${record.remainingDebt} ${record.token}`}</span>
              </div>

              <div className="form">
                <NumBox title="Repay Amount" maxValue={record.remainingDebt} onChange={vm?.updateRepayAmount} />
                <Button loading={vm?.repaying} onClick={vm?.repay}>
                  Repay
                </Button>
              </div>
            </div>
          ) : undefined}

          {record?.type === RecordType.Borrow ? (
            <div className="detail">
              <div className="head">
                <h3>Withdraw Collateral</h3>
                <span></span>
              </div>

              <div className="item">
                <span>Total Collateral:</span>
                <span className="uppercase">{`${record.collateralAmount} ${record.collateralToken?.name}`}</span>
              </div>

              <div className="form">
                <NumBox
                  title="Withdraw Amount"
                  secondTitle={`New CCR: ${vm?.newWithdrawCR}%`}
                  onChange={vm?.updateWithdrawCollateralAmount}
                  maxValue={vm?.maxWithdrawCollateral}
                  onButtonClick={() => vm?.updateWithdrawCollateralAmount(vm!.maxWithdrawCollateral!)}
                />
                <Button loading={vm?.withdrawingCollateral} onClick={vm?.withdrawCollateral}>
                  Withdraw
                </Button>
              </div>
            </div>
          ) : undefined}

          {record?.type === RecordType.Borrow ? (
            <div className="detail">
              <div className="head">
                <h3>Deposit Collateral</h3>
                <span></span>
              </div>

              <div className="item">
                <span>Total Collateral:</span>
                <span className="uppercase">{`${record.collateralAmount} ${record.collateralToken?.name}`}</span>
              </div>

              <div className="form">
                <NumBox
                  title="Deposit Amount"
                  secondTitle={`New CCR: ${vm?.newDepositCR}%`}
                  secondDesc="New Collateral Coverage Ratio"
                  onChange={vm?.updateDepositCollateralAmount}
                  maxValue={vm?.maxDepositCollateral}
                  onButtonClick={() => vm?.updateDepositCollateralAmount(vm!.maxDepositCollateral!)}
                />
                <Button loading={vm?.depositingCollateral} onClick={vm?.depositCollateral}>
                  Deposit
                </Button>
              </div>
            </div>
          ) : undefined}
        </div>

        <div className="transactions">
          <h3>Transactions</h3>
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th>Amount</th>
              </tr>
            </thead>

            <tbody>
              {txs && txs.length > 0 ? (
                txs.map((tx) => (
                  <tr key={tx.transactionHash}>
                    <td>{tx.time}</td>
                    <td>{tx.event}</td>
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
