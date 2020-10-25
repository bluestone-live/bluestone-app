import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import "./Button.scss";

import React, { ButtonHTMLAttributes, Component } from "react";

import Loader from "react-loader-spinner";

interface IProps<T> extends ButtonHTMLAttributes<T> {
  loading?: any;
}

class Button extends Component<IProps<HTMLButtonElement>, {}> {
  render() {
    const btn = { ...this.props };
    delete btn.loading;

    return (
      <button className="button-ex" {...btn}>
        <div className="content">
          {this.props.loading ? <Loader type="Puff" color="white" height={16} width={16} /> : undefined}
          {this.props.children}
        </div>
      </button>
    );
  }
}

export default Button;
