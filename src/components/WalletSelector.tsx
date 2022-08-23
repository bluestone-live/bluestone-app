import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import "./WalletSelector.scss";

import React, { Component } from "react";

enum WalletType {
    Disconnect = "Disconnect",
    MetaMask = "MetaMask",
    WalletConnect = "WalletConnect"
}

const IconPath = {
    "Disconnect": require("../assets/wallet/disconnect.svg"),
    "MetaMask": require("../assets/wallet/metamask.svg"),
    "WalletConnect": require("../assets/wallet/walletconnect.svg")
} 

interface IProps {
    // loading?: any;
    // loadingColor?: string;
    // connected?: WalletSelector;
    // color: string;
}

interface IState {
    wallet: WalletType;
}

class WalletSelector extends Component<IProps, IState> {
    state: IState = {
        wallet: WalletType.MetaMask
    };

    changeWallet = (value: WalletType) => {
        console.log("[Before]: this.state=", this.state);
        this.state.wallet = value;
        console.log("[After]: this.state=", this.state);
    }

    render() {
        const { wallet } = this.state;

        return (
            <div className="Wallet">
                <span className="dropdown-title">
                    <img src={IconPath[wallet]}></img>
                </span>
                <span className="dropdown-content" onClick={() => this.changeWallet(WalletType.MetaMask)}>
                    <img src={IconPath[WalletType.MetaMask]} alt="metamask"></img>
                </span>
                <span className="dropdown-content" onClick={() => this.changeWallet(WalletType.WalletConnect)}>
                    <img src={IconPath[WalletType.WalletConnect]} alt="walletconnect"></img>
                </span>
                <span className="dropdown-content" onClick={() => this.changeWallet(WalletType.Disconnect)}>
                    <img src={IconPath[WalletType.Disconnect]} alt="disconnect"></img>
                </span>
            </div>
        );
    }
}

export default WalletSelector;