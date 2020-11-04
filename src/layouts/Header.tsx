import "./Header.scss";

import React, { Component } from "react";

import { Link } from "react-router-dom";
import i18n from "../i18n";
import logo from "../assets/logo.svg";
import logo_blue from "../assets/logo-blue.svg";

interface IProps {
  isHome?: boolean;
}

class Header extends Component<IProps, {}> {
  render() {
    const { isHome } = this.props;
    console.log("isHome", isHome);
    
    return (
      <header>
        <Link to="/">
          <img className="logo" src={isHome ? logo : logo_blue} alt="Bluestone" />
        </Link>
        {isHome ? undefined : (
          <div className="links">
            <Link to="/lend">{i18n.t("header_deposit")}</Link>
            <Link to="/borrow">{i18n.t("header_borrow")}</Link>
            <Link to="/history">{i18n.t("header_history")}</Link>
          </div>
        )}
      </header>
    );
  }
}

export default Header;
