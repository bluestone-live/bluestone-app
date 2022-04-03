import React, { Component } from "react";
import eth from "../assets/crypto/eth.svg";
import dai from "../assets/crypto/dai.svg";
import usdc from "../assets/crypto/usdc.svg";
import usdt from "../assets/crypto/usdt.svg";
import sgc from "../assets/crypto/sgc.svg";
import xbtc from "../assets/crypto/xbtc.svg";

const icons = new Map([
  ["eth", eth],
  ["dai", dai],
  ["usdc", usdc],
  ["usdt", usdt],
  ["sgc", sgc],
  ["xbtc", xbtc],
]);

interface IProps {
  symbol?: string;
}

class Currency extends Component<IProps, {}> {
  render() {
    return <img src={icons.get(this.props.symbol || "dai")} alt={this.props.symbol} />;
  }
}

export default Currency;
