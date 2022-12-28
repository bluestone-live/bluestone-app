import { Contract, ethers } from "ethers";
import { observable } from "mobx";

import BaseViewModel from "./BaseViewModel";
import Notification from "../services/Notify";
import { checkNumber } from "../services/InputChecker";
import { ErrorMsg, InputErrorMsg } from "../services/ErrorMsg";
import { IToken, IViewModel } from "./Types";
import { ViewModelLocator } from "../ViewModelLocator";

interface IFaucetViewModel extends IViewModel {
    locator: ViewModelLocator;
}

export default class FaucetViewModel extends BaseViewModel {
    @observable loading = false;
    @observable inputStableCoin?: string;
    @observable inputStableCoinLegal?: boolean;
    @observable stableMinting = false;
    @observable collateralMinting = false;
    @observable inputCollateralCoin?: string;
    @observable inputCollateralCoinLegal?: boolean;
    @observable stableCoinErrorMsg?: string;
    @observable collateralCoinErrorMsg?: string;
    @observable maxStableCoinAmount?: string = "100000";
    @observable maxCollateralCoinAmount?: string = "10";

    constructor(params: IFaucetViewModel) {
        super(params);
        this.locator = params.locator;
    }

    inputStable = (value?: string) => {
        if (!value) {
            this.inputStableCoinLegal = false;
            this.stableCoinErrorMsg = InputErrorMsg.NONE;
            return;
        }
        this.inputStableCoin = value;

        if (checkNumber(value)) {
            if (Number.parseFloat(value) > 0) {
                if (Number.parseFloat(value) <= Number.parseFloat(this.maxStableCoinAmount ?? "")) {
                    this.inputStableCoinLegal = true;
                    this.stableCoinErrorMsg = InputErrorMsg.NONE;
                } else {
                    this.inputStableCoinLegal = false;
                    this.stableCoinErrorMsg = InputErrorMsg.VALUE_OVER_MAXIMUM;
                }
            } else {
                this.inputStableCoinLegal = false;
                this.stableCoinErrorMsg = InputErrorMsg.VALUE_LESS_THAN_ZERO;
            }
        } else {
            this.inputStableCoinLegal = false;
            this.stableCoinErrorMsg = InputErrorMsg.VALUE_NOT_NUMBER;
        }
    };

    inputCollateral = (value?: string) => {
        if (!value) {
            this.inputCollateralCoinLegal = false;
            this.collateralCoinErrorMsg = InputErrorMsg.NONE;
            return;
        }
        this.inputCollateralCoin = value;

        if (checkNumber(value)) {
            if (Number.parseFloat(value) > 0) {
                if (Number.parseFloat(value) <= Number.parseFloat(this.maxCollateralCoinAmount ?? "")) {
                    this.inputCollateralCoinLegal = true;
                    this.collateralCoinErrorMsg = InputErrorMsg.NONE;
                } else {
                    this.inputCollateralCoinLegal = false;
                    this.collateralCoinErrorMsg = InputErrorMsg.VALUE_OVER_MAXIMUM;
                }
            } else {
                this.inputCollateralCoinLegal = false;
                this.collateralCoinErrorMsg = InputErrorMsg.VALUE_LESS_THAN_ZERO;
            }
        } else {
            this.inputCollateralCoinLegal = false;
            this.collateralCoinErrorMsg = InputErrorMsg.VALUE_NOT_NUMBER;
        }
    };

    addTokenToWallet = async (tokenName: string) => {
        let tokenDetail: IToken | undefined;
        for (let index in this.locator.tokens) {
            if (this.locator.tokens[index].name === tokenName) {
                tokenDetail = this.locator.tokens[index];
                break;
            }
        }
        if (!tokenDetail) { return };
        try {
            await (window as any).ethereum
                .request({
                    method: 'wallet_watchAsset',
                    params: {
                        type: 'ERC20',
                        options: {
                            address: tokenDetail.address,
                            symbol: tokenDetail.name,
                            decimals: tokenDetail.decimals,
                        },
                    },
                });
        } catch (error) {
            console.error(error)
        }
    };

    mintStableCoin = async () => {
        let erc20Instance: Contract;
        let index: any;
        for (index in this.locator.tokens) {
            if (this.locator.tokens[index].name === "sgc") {
                erc20Instance = this.locator.tokens[index].contract!;
                break;
            }
        }
        try {
            this.stableMinting = true;
            const tx = await erc20Instance!.mint(
                this.account,
                ethers.utils.parseUnits(this.inputStableCoin!, this.locator.tokens[index].decimals)
            )

            Notification.track(tx.hash);
            await tx.wait();
        } catch (error) {
            Notification.showErrorMessage(ErrorMsg.filterRevertMsg((error as any).message));
        } finally {
            this.stableMinting = false;
        }
    };

    mintCollateralCoin = async () => {
        let erc20Instance: Contract;
        let index: any;
        for (index in this.locator.tokens) {
            if (this.locator.tokens[index].name === "xbtc") {
                erc20Instance = this.locator.tokens[index].contract!;
                break;
            }
        }
        try {
            this.collateralMinting = true;
            const tx = await erc20Instance!.mint(
                this.account,
                ethers.utils.parseUnits(this.inputCollateralCoin!, this.locator.tokens[index].decimals)
            )

            Notification.track(tx.hash);
            await tx.wait();
        } catch (error) {
            Notification.showErrorMessage(ErrorMsg.filterRevertMsg((error as any).message));
        } finally {
            this.collateralMinting = false;
        }
    };
}
