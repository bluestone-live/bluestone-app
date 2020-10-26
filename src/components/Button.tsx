import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import "./Button.scss";

import React, { ButtonHTMLAttributes, Component } from "react";

import Loader from "react-loader-spinner";

interface IProps<T> extends ButtonHTMLAttributes<T> {
  loading?: any;
  loadingColor?: string;
}

class Button extends Component<IProps<HTMLButtonElement>, {}> {
  render() {
    const btn = { ...this.props };
    delete btn.loading;
    delete btn.loadingColor;
    const disabled = this.props.loading || this.props.disabled;

    return (
      <button className="button-ex" {...btn} disabled={disabled}>
        <div className="content">
          {this.props.loading ? (
            <Loader type="Puff" color={this.props.loadingColor || "white"} height={16} width={16} />
          ) : undefined}
          {this.props.children}
        </div>
      </button>
    );
  }
}

export default Button;
