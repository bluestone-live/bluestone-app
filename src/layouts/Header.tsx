import "./Header.scss";

import React, { Component } from "react";

import { Link } from "react-router-dom";
import logo from "../assets/logo.svg";
import logo_blue from "../assets/logo-blue.svg";

interface IProps {
  isHome?: boolean;
}

class Header extends Component<IProps, {}> {
  render() {
    const { isHome } = this.props;
    return (
      <header>
        <img className="logo" src={isHome ? logo : logo_blue} alt="Bluestone" />
        {isHome ? undefined : (
          <div className="links">
            <Link to="/lend">Deposit</Link>
            <Link to="/loan">Borrow</Link>
            <Link to="/history">History</Link>
          </div>
        )}
      </header>
    );
  }
}

export default Header;
