import React, { Component } from "react";
import "./Record.scss";
import NumBox from "../components/NumBox";
import { inject, observer } from "mobx-react";
import { ViewModelLocator } from "../core/ViewModelLocator";
import RecordViewModel from "../core/viewmodels/RecordViewModel";
import Loading from "../components/Loading";
import { RouteComponentProps } from "react-router-dom";
import { RecordType } from "../core/viewmodels/Types";

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
                <NumBox title="Repay Amount" />
                <button>Repay</button>
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
                />
                <button>Withdraw</button>
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
                />
                <button>Deposit</button>
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
              <tr>
                <td>{new Date().toLocaleString()}</td>
                <td>Deposit</td>
                <td>12, 345 DAI</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default Record;
