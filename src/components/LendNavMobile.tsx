import "./LendNavMobile.scss";

import React, { Component } from "react";

import { Link } from "react-router-dom";
import i18n from "../i18n";

interface Props {
  type: "lend" | "borrow";
}

class LendNavMobile extends Component<Props, {}> {
  render() {
    return (
      <div className="lendnav_mobile">
        <div>
          <Link className={`${this.props.type === "lend" ? "active" : ""}`} to="/lend">
            {i18n.t("lend_title")}
          </Link>
          <span>|</span>
          <Link className={`${this.props.type === "borrow" ? "active" : ""}`} to="/borrow">
            {i18n.t("loan_title")}
          </Link>
        </div>

        <div>
          <Link to="/history">{i18n.t("header_history")}</Link>
        </div>
      </div>
    );
  }
}

export default LendNavMobile;
