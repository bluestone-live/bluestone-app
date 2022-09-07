import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import "./WalletSelector.scss";
import { WalletType } from "../core/viewmodels/Types"
import { ViewModelLocator } from "../core/ViewModelLocator";

import React, { Component } from "react";
import { inject, observer } from "mobx-react";

const IconPath = {
    "Disconnect": require("../assets/wallet/disconnect.svg"),
    "MetaMask": require("../assets/wallet/metamask.svg"),
    "WalletConnect": require("../assets/wallet/walletconnect.svg")
}

interface IProps {
    locator?: ViewModelLocator;
}

interface IState {
    wallet: WalletType;
}

@inject("locator")
@observer
class WalletSelector extends Component<IProps, IState> {
    state: IState = {
        wallet: WalletType.Disconnect
    };

    constructor(props: IProps) {
        super(props);
        this.state = {
            wallet: this.props.locator!.wallet
        }
    }

    changeWallet = async (value: WalletType) => {
        if (this.state.wallet === WalletType.WalletConnect && value === WalletType.Disconnect) {
            console.log("disconnect wallect connect.")
            await this.props.locator?.wallletconnectProvider.disconnect();
        }
        this.setState({
            wallet: value
        });
        window.localStorage.setItem("wallet", value);
        window.location.reload();
    }

    render() {
        const { wallet } = this.state;

        return (
            <div className="Wallet">
                <span className="dropdown-title">
                    <img src={IconPath[wallet]} alt="selected wallet"></img>
                </span>

                <span className="dropdown-content" style={wallet === WalletType.MetaMask ? { display: 'none' } : {}} onClick={() => this.changeWallet(WalletType.MetaMask)}>
                    <img src={IconPath[WalletType.MetaMask]} alt="metamask"></img>
                </span>
                <span className="dropdown-content" style={wallet === WalletType.WalletConnect ? { display: 'none' } : {}} onClick={() => this.changeWallet(WalletType.WalletConnect)}>
                    <img src={IconPath[WalletType.WalletConnect]} alt="walletconnect"></img>
                </span>
                <span className="dropdown-content" style={wallet === WalletType.Disconnect ? { display: 'none' } : {}} onClick={() => this.changeWallet(WalletType.Disconnect)}>
                    <img src={IconPath[WalletType.Disconnect]} alt="disconnect"></img>
                </span>
            </div>
        );
    }
}

export default WalletSelector;