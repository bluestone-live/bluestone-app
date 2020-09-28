import React, { Component } from "react";
import "./NumBox.scss";

interface IProps {
  title?: string;
  secondTitle?: string;
  secondDesc?: string;
  onChange?: (value: string) => void;
  isValid?: (value: string) => boolean;
  buttonTitle?: string;
  defaultValue?: string;
  onButtonClick?: () => void;
}

class NumBox extends Component<IProps, {}> {
  private input!: HTMLInputElement;

  render() {
    return (
      <div className="numbox">
        <div className="title">
          <span>{this.props.title || "Deposit Amount"}</span>
          <span title={this.props.secondDesc}>{this.props.secondTitle}</span>
        </div>
        <div className="input-area">
          <input
            ref={(e) => (this.input = e!)}
            placeholder="0.00"
            defaultValue={this.props.defaultValue}
            onChange={(e) => this.props.onChange?.(e.target.value)}
          />
          <button onClick={() => this.props.onButtonClick?.()}>{this.props.buttonTitle || "MAX"}</button>
        </div>
      </div>
    );
  }

  setValue(value: string) {
    this.input.value = value;
  }
}

export default NumBox;
