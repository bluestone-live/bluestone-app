import React, { Component } from 'react';
import './Lend.scss';
import TokenSelector from '../components/TokenSelector';
import NumBox from '../components/NumBox';
import Calendar from '../components/Calendar';
import { inject, observer } from 'mobx-react';
import { ViewModelLocator } from '../core/ViewModelLocator';
import DepositViewModel from '../core/viewmodels/DepositViewModel';
import Skeleton from 'react-loading-skeleton';
import Loading from '../components/Loading';
import { ethers } from 'ethers';

interface Props {
  locator: ViewModelLocator;
}

interface State {
  vm?: DepositViewModel;
  preview: Date;
  ranges: { startDate: Date; endDate: Date; key: 'selection' }[];

  maxBalance?: string;
}

@inject('locator')
@observer
class Lend extends Component<Props, State> {
  state: State = {
    ranges: [
      {
        startDate: new Date(),
        endDate: new Date(),
        key: 'selection',
      },
    ],
    preview: new Date(),
  };

  private numbox!: NumBox;

  componentDidMount() {
    this.setState({ vm: this.props.locator.lendVM });
    this.props.locator.once('init', () => this.setState({ vm: this.props.locator.lendVM }));
  }

  onMaxClick = () => {
    const { vm } = this.state;
    const token = vm?.currentToken;
    const value = token
      ? ethers.utils.formatUnits(token.balance ?? '0', token.decimals ?? 18)
      : '0';

    this.setState({ maxBalance: value });
    this.numbox.setValue(value);
    vm?.inputBalance(value);
  };

  render() {
    const { vm } = this.state;
    const loading = !vm || vm?.loading;
    const buttonDisabled =
      (vm && vm.term && vm.selectedPool && vm.inputValue ? false : true) || vm?.sending;

    return (
      <div className="lend page">
        <div>
          <h1>Deposit</h1>
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
                <TokenSelector
                  title="Deposit Token"
                  tokens={vm?.tokenSymbols}
                  onChange={(token) => vm?.selectToken(token)}
                />
              </div>

              <div className="item input">
                <NumBox
                  ref={(e) => (this.numbox = e!)}
                  onChange={vm?.inputBalance}
                  defaultValue={this.state.maxBalance}
                  onButtonClick={this.onMaxClick}
                />
              </div>

              <div className="item">
                <span>Term:</span>
                <span>{loading ? <Loading /> : `${vm!.term} Days`}</span>
              </div>

              <div className="item">
                <span>APR:</span>
                <span>{loading ? <Loading /> : `${(vm!.apr * 100).toFixed(2)}%`}</span>
              </div>

              <div className="item">
                <span>Maturity Date:</span>
                <span>{loading ? <Loading /> : vm!.maturityDate}</span>
              </div>
            </div>

            {loading ? (
              <Skeleton height={37} />
            ) : (
              <button disabled={buttonDisabled} onClick={vm?.deposit}>
                {vm?.currentToken.allowance?.eq(0) ? 'Approve & Deposit' : 'Deposit'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default Lend;
