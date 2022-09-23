import "./Faucet.scss";
import React, { Component } from "react";
import i18n from "../i18n";
import NumBox from "../components/NumBox";
import sgcPath from "../assets/crypto/sgc.svg"
import xbtcPath from "../assets/crypto/xbtc.svg"
import { ViewModelLocator } from "../core/ViewModelLocator";
import { inject, observer } from "mobx-react";
import FaucetViewModel from "../core/viewmodels/FaucetViewModel";
import Button from "../components/Button";
import Skeleton from "react-loading-skeleton";

interface IProps {
    locator: ViewModelLocator;
}

interface IState {
    vm?: FaucetViewModel;
}

@inject("locator")
@observer
class Faucet extends Component<IProps, IState> {
    state: IState = {
        vm: undefined
    };
    componentDidMount() {
        this.setState({ vm: this.props.locator.faucetVM });
        this.props.locator.once("init", () => this.setState({ vm: this.props.locator.faucetVM }));
    }

    getFaucetHref = () => {
        const linkElem = document.getElementById("faucetlink");
        if (linkElem) {
            linkElem.onclick = () => { return true };
        } else {
            return
        }
        switch (this.props.locator.network) {
            case "goerli":
                return "https://goerlifaucet.com/";
            case "kovan":
                return "https://faucets.chain.link/";
            case "rinkeby":
                return "https://rinkebyfaucet.com/";
            default:
                linkElem.onclick = () => { return false };
                break;
        }
    }

    onMaxClickStable = () => {
        const { vm } = this.state;
        vm?.inputStable(vm?.maxStableCoinAmount);
    }

    onMaxClickCollateral = () => {
        const { vm } = this.state;
        vm?.inputCollateral(vm?.maxCollateralCoinAmount);
    }

    render() {
        const { vm } = this.state;
        const loading = !vm || vm?.loading;
        const buttonStableDisabled = loading || vm?.stableMinting || !vm?.inputStableCoinLegal;
        const buttonCollateralDisabled = loading || vm?.collateralMinting || !vm?.inputCollateralCoinLegal;

        return (
            <div className="faucet page">
                <h1 className="legend">{i18n.t("faucet_title")}</h1>
                <div className="content">
                    <div className="testnet-eth">
                        <a id="faucetlink" className="img-container typing-effect" href={this.getFaucetHref()} target="_blank" rel="noopener noreferrer">
                            {i18n.t("faucet_testnet_eth_text")}
                        </a>
                    </div>
                    <div className="testnet-token">
                        <div>
                            <h2>{i18n.t("faucet_sgc_label")}</h2>
                            <img src={sgcPath} alt="SGC icon"></img>
                            <div className="input-area">
                                <NumBox
                                    title={i18n.t("faucet_sgc_amount")}
                                    onChange={vm?.inputStable}
                                    maxValue={vm?.maxStableCoinAmount}
                                    onButtonClick={this.onMaxClickStable}
                                    isValid={vm?.inputStableCoinLegal ?? true}
                                    errorMsg={vm?.stableCoinErrorMsg}
                                />
                                <div className="inner-space" />
                                {loading ? (
                                    <Skeleton height={37} />
                                ) : (
                                    <Button disabled={buttonStableDisabled} onClick={vm?.mintStableCoin} loading={vm?.stableMinting}>
                                        {i18n.t("faucet_mint")}
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div>
                            <h2>{i18n.t("faucet_xbtc_label")}</h2>
                            <img src={xbtcPath} alt="xBTC icon"></img>
                            <div className="input-area">
                                <NumBox
                                    title={i18n.t("faucet_xbtc_amount")}
                                    onChange={vm?.inputCollateral}
                                    maxValue={vm?.maxCollateralCoinAmount}
                                    onButtonClick={this.onMaxClickCollateral}
                                    isValid={vm?.inputCollateralCoinLegal ?? true}
                                    errorMsg={vm?.collateralCoinErrorMsg}
                                />
                                <div className="inner-space" />
                                {loading ? (
                                    <Skeleton height={37} />
                                ) : (
                                    <Button disabled={buttonCollateralDisabled} onClick={vm?.mintCollateralCoin} loading={vm?.collateralMinting}>
                                        {i18n.t("faucet_mint")}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default Faucet;