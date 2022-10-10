import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import "./WalletSelector.scss";
import { WalletType } from "../core/viewmodels/Types";
import { shortenAddress } from "../core/services/Account";
import { ViewModelLocator } from "../core/ViewModelLocator";
import Notification from "../core/services/Notify";

import { Component } from "react";
import { inject, observer } from "mobx-react";

import Disconnect from "../assets/wallet/disconnect.svg";
import MetaMask from "../assets/wallet/metamask.svg";
import WalletConnect from "../assets/wallet/walletconnect.svg";

const IconPath = {
    "Disconnect": Disconnect,
    "MetaMask": MetaMask,
    "WalletConnect": WalletConnect
}

interface IProps {
    locator?: ViewModelLocator;
}

interface IState {
    wallet: WalletType;
    account: string | undefined;
}

@inject("locator")
@observer
class WalletSelector extends Component<IProps, IState> {
    state: IState = {
        wallet: WalletType.Disconnect,
        account: undefined,
    };

    constructor(props: IProps) {
        super(props);
        this.state = {
            wallet: this.props.locator!.wallet,
            account: this.props.locator!.account,
        }
    }

    componentDidMount() {
        setInterval(() => {
            this.setState({
                wallet: this.props.locator!.wallet,
                account: this.props.locator!.account,
            });
        }, 1000);
    }

    changeWallet = async (value: WalletType) => {
        if (this.state.wallet === WalletType.WalletConnect && value === WalletType.Disconnect) {
            await this.props.locator?.walletconnectProvider.disconnect();
        }
        this.setState({
            wallet: value
        });
        window.localStorage.setItem("wallet", value);
        window.location.reload();
    }

    clickWalletIcon = () => {
        let walletElem = document.getElementById("wallet");
        walletElem!.style.overflow = walletElem!.style.overflow === "hidden" ? "visible" : "hidden";
    }

    clickWalletText = () => {
        const { account } = this.state;
        if (account) {
            let oInput = document.createElement("input");
            oInput.value = account;
            document.body.appendChild(oInput);
            oInput.select();
            document.execCommand("Copy");
            document.body.removeChild(oInput);

            Notification.showSuccessMessage("Account address copied.");
        } else {
            this.clickWalletIcon();
        }
    }

    render() {
        const { wallet } = this.state;
        const { account } = this.state;

        return (
            <div id="wallet" className="Wallet">
                <span className="dropdown-title">
                    <img src={IconPath[wallet]} alt="selected wallet" onClick={() => this.clickWalletIcon()}></img>
                    <span onClick={() => this.clickWalletText()}>{account ? shortenAddress(account) : "Connect Wallet"}</span>
                </span>

                <span className="dropdown-content" onClick={() => this.changeWallet(WalletType.MetaMask)}>
                    <img src={IconPath[WalletType.MetaMask]} alt="metamask"></img><span>{WalletType.MetaMask}</span>
                </span>
                <span className="dropdown-content" onClick={() => this.changeWallet(WalletType.WalletConnect)}>
                    <img src={IconPath[WalletType.WalletConnect]} alt="walletconnect"></img><span>{WalletType.WalletConnect}</span>
                </span>
                <span className="dropdown-content bottom-radius" onClick={() => this.changeWallet(WalletType.Disconnect)}>
                    <img src={IconPath[WalletType.Disconnect]} alt="disconnect"></img><span>{WalletType.Disconnect}</span>
                </span>
            </div>
        );
    }
}

export default WalletSelector;