import "./NumBox.scss";

import React, { Component } from "react";

interface IProps {
  title?: string;
  secondTitle?: string;
  secondDesc?: string;
  onChange?: (value: string) => void;
  isValid?: boolean;
  buttonTitle?: string;
  defaultValue?: string;
  maxValue?: string;
  onButtonClick?: () => void;
  disabled?: boolean;
}

class NumBox extends Component<IProps, {}> {
  private input!: HTMLInputElement;

  onButtonClick = () => {
    this.props.onButtonClick?.();
    this.input.value = this.props.maxValue || this.input.value;
    this.props.onChange?.(this.input.value);
  };

  render() {
    return (
      <div className="numbox">
        <div className="title">
          <span>{this.props.title || "Deposit Amount"}</span>
          <span title={this.props.secondDesc}>{this.props.secondTitle}</span>
        </div>
        <div className="input-area">
          <input
            className={`${this.props.isValid ? "" : "illegal"}`}
            ref={(e) => (this.input = e!)}
            placeholder="0.00"
            defaultValue={this.props.defaultValue}
            disabled={this.props.disabled}
            onChange={(e) => this.props.onChange?.(e.target.value)}
          />
          <button onClick={() => this.onButtonClick()}>{this.props.buttonTitle || "MAX"}</button>
        </div>
      </div>
    );
  }

  setValue(value: string) {
    this.input.value = value;
  }
}

export default NumBox;
