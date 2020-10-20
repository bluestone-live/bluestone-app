import './Home.scss';

import React, { Component } from 'react';

import { Link } from 'react-router-dom';
import { Slogan } from '../layouts';
import dai from '../assets/crypto/dai.svg';
import protect from '../assets/protect-96.png';
import requestMoney from '../assets/request-money-96.png';
import sendMoney from '../assets/send-money-96.png';
import usdc from '../assets/crypto/usdc.svg';
import usdt from '../assets/crypto/usdt.svg';

class Home extends Component {
  render() {
    return (
      <div className="home page">
        <Slogan />
        <div className="welcome" />

        <div className="content">
          <table>
            <thead>
              <tr>
                <th className="asset">Asset</th>
                <th>Lending Cap.</th>
                <th>Borrowing Amt.</th>
                <th>Best Lending Term</th>
                <th>Borrow APR</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td className="asset">
                  <div>
                    <img src={dai} alt="Dai" />
                    <span>DAI</span>
                  </div>
                </td>
                <td>11,223 DAI</td>
                <td>2,345 DAI</td>
                <td>5.4 % (30 Days)</td>
                <td>4% - 8%</td>
                <td>
                  <Link to="/lend">
                    <button>Lend</button>
                  </Link>
                  <Link to="/loan">
                    <button>Loan</button>
                  </Link>
                </td>
              </tr>
              <tr>
                <td className="asset">
                  <div>
                    <img src={usdc} alt="Dai" />
                    <span>USDC</span>
                  </div>
                </td>
                <td>11,223 USDC</td>
                <td>2,345 USDC</td>
                <td>5.4 % (30 Days)</td>
                <td>4% - 8%</td>
                <td>
                  <Link to="/lend">
                    <button>Lend</button>
                  </Link>
                  <Link to="/loan">
                    <button>Loan</button>
                  </Link>
                </td>
              </tr>
              <tr>
                <td className="asset">
                  <div>
                    <img src={usdt} alt="Dai" />
                    <span>USDT</span>
                  </div>
                </td>
                <td>11,223 USDT</td>
                <td>2,345 USDT</td>
                <td>5.4 % (30 Days)</td>
                <td>4% - 8%</td>
                <td>
                  <Link to="/lend">
                    <button>Lend</button>
                  </Link>
                  <Link to="/loan">
                    <button>Loan</button>
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="features">
          <div className="feature">
            <div className="title">
              <img src={sendMoney} alt="Borrow" />
              <span>Borrow</span>
            </div>

            <div>Choose your favorable term and lock a fixed rate</div>
          </div>

          <div className="feature">
            <div className="title">
              <img src={requestMoney} alt="Deposit" />
              <span>Deposit</span>
            </div>

            <div>Lend to the most borrowed pool and enjoy competitive APR</div>
          </div>

          <div className="feature">
            <div className="title">
              <img src={protect} alt="Security" />
              <span>No Bank Run Risk</span>
            </div>

            <div>All loans are guaranteed to be paid back</div>
          </div>
        </div>
      </div>
    );
  }
}

export default Home;
