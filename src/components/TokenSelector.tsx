import React, { Component } from "react";
import Select, { ValueType } from "react-select";
import "./TokenSelector.scss";

const tokens = [
  { value: "dai", label: "DAI" },
  { value: "usdc", label: "USDC" },
  { value: "usdt", label: "USDT" },
  { value: "eth", label: "ETH" },
];

const icon = (symbol = "dai") => ({
  alignItems: "center",
  display: "flex",

  ":before": {
    backgroundImage: `url('/assets/crypto/${symbol}.svg')`,
    backgroundSize: "cover",
    content: '" "',
    display: "block",
    marginRight: 8,
    height: 19,
    width: 19,
  },
});

const customStyles = {
  option: (provided, state) => {
    return {
      ...provided,
      ...icon(state.value),
    };
  },
  singleValue: (provided, state) => {
    const opacity = state.isDisabled ? 0.5 : 1;
    const transition = "opacity 300ms";
    return { ...provided, opacity, transition, ...icon(state.data.value) };
  },
};

interface IProps {
  tokens?: string[];
  title?: string;
  onChange?: (token: string) => void;
}

interface IState {
  selected: ValueType<{ value: string; label: string }>;
}

class TokenSelector extends Component<IProps, IState> {
  private tokens: { value: string; label: string }[] = [];

  constructor(props: IProps) {
    super(props);

    this.tokens = props.tokens?.map((t) => tokens.find((token) => token.value === t.toLowerCase())!)! || tokens;

    this.state = {
      selected: this.tokens[0],
    };
  }

  render() {
    return (
      <div className="tokens-selector">
        <span className="title">{this.props.title}</span>
        <Select
          options={this.tokens}
          styles={customStyles}
          defaultValue={this.state.selected}
          isClearable={false}
          isSearchable={false}
          onChange={(item) => this.props.onChange?.(item!["value"])}
        />
      </div>
    );
  }
}

export default TokenSelector;
