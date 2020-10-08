import React, { Component } from "react";
import "./Header.scss";
import logo from "../assets/logo.svg";
import logo_blue from "../assets/logo-blue.svg";
import { Link } from "react-router-dom";

class Header extends Component {
  render() {
    const isHome = window.location.pathname?.length <= 1;
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
