import React, { Component } from 'react';
import './History.scss';
import Currency from '../components/Currency';
import { inject } from 'mobx-react';
import { History } from 'history';

interface IProps {
  history: History;
}

@inject('history')
class HistoryPage extends Component<IProps, {}> {
  render() {
    return (
      <div className="history page">
        <div className="categories">
          <h1>History</h1>
          <div className="nav">
            <div className="item active">Active</div>
            <div className="item">Deposit</div>
            <div className="item">Borrow</div>
            <div className="item">ALL</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th className="token">
                <div>Token</div>
              </th>
              <th>Amount</th>
              <th>Interest</th>
              <th>APR</th>
              <th>Term</th>
              <th>Maturity Date</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr onClick={(_) => this.props.history.push('/record/abc')}>
              <td className="token">
                <div>
                  <Currency symbol="dai" />
                  DAI
                  <span className="lend">↓</span>
                </div>
              </td>
              <td>12,345 DAI</td>
              <td>20 DAI</td>
              <td>5%</td>
              <td>90 Days</td>
              <td>2020-09-01</td>
              <td>Matured</td>
            </tr>
            <tr>
              <td className="token">
                <div>
                  <Currency symbol="usdc" />
                  USDC
                  <span className="loan">↑</span>
                </div>
              </td>
              <td>500 USDC</td>
              <td>12 USDC</td>
              <td>8%</td>
              <td>30 Days</td>
              <td>2020-09-01</td>
              <td>Matured</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
}

export default HistoryPage;
