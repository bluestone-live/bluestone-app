import "./Header.scss";

import React, { Component } from "react";
import WalletSelector from "../components/WalletSelector";
import { ViewModelLocator } from "../core/ViewModelLocator";
import { Link } from "react-router-dom";
import i18n from "../i18n";
import logo from "../assets/logo-large.svg";
import logo_blue from "../assets/logo-blue.svg";
import { inject } from "mobx-react";


interface IProps {
  isHome?: boolean;
  locator?: ViewModelLocator;
}

interface IState {
  isHome?: boolean;
}

@inject("locator")
class Header extends Component<IProps, IState> {
  state: IState = { isHome: true };

  componentDidMount() {
    setInterval(() => {
      this.setState({ isHome: window.location.pathname.length < 2 });
    }, 1000);
  }

  render() {
    const { locator } = this.props;
    const { isHome } = this.state;
    return (
      <header>
        <Link to="/">
          <img className="logo" src={isHome ? logo : logo_blue} alt="Bluestone" />
        </Link>
        <div className="header-right-container">
          <div className={`links ${isHome ? "" : "grey"}`}>
            {locator!.network === "goerli" || locator!.network === "kovan" ? <Link to="/faucet"><span className="faucet">{i18n.t("header_faucet")}</span></Link> : <span />}
            <Link to="/lend">{i18n.t("header_deposit")}</Link>
            <Link to="/borrow">{i18n.t("header_borrow")}</Link>
            <Link to="/history">{i18n.t("header_history")}</Link>
          </div>

          <WalletSelector />
        </div>
      </header>
    );
  }
}

export default Header;
