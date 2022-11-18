import { Contract, ethers } from "ethers";
import { observable } from "mobx";

import BaseViewModel from "./BaseViewModel";
import Notification from "../services/Notify";
import { checkNumber } from "../services/InputChecker";
import { ErrorMsg, InputErrorMsg } from "../services/ErrorMsg";
import { IViewModel } from "./Types";
import type { IToken } from "./Types";

interface IGatewayViewModel extends IViewModel {
    tokens: IToken[]
}

export default class GatewayViewModel extends BaseViewModel {
    private params: IGatewayViewModel;

    @observable loading = false;
    @observable currentToken!: IToken;
    @observable inputAmount?: string;
    @observable inputAmountLegal?: boolean;
    @observable transferLoading = false;
    @observable inputAmountErrorMsg?: string;
    @observable maxAvailableAmount?: string;
    readonly tokenSymbols: string[];

    constructor(params: IGatewayViewModel) {
        super(params);
        this.params = params;

        this.tokenSymbols = params.tokens.map((t) => t.name);
        this.selectToken(params.tokens[0].name);
    }

    selectToken = async (name: string) => {
        this.currentToken = this.params.tokens.find((t) => t.name.toLowerCase() === name.toLowerCase())!;
        this.maxAvailableAmount = ethers.utils.formatUnits(this.currentToken.balance ?? "0", this.currentToken.decimals ?? 18);
        this.loading = false;
    };

    inputAmountCheck = (value?: string) => {
        if (!value) {
            this.inputAmountLegal = false;
            this.inputAmountErrorMsg = InputErrorMsg.NONE;
            return;
        }
        this.inputAmount = value;

        if (checkNumber(value)) {
            if (Number.parseFloat(value) > 0) {
                if (Number.parseFloat(value) <= Number.parseFloat(this.maxAvailableAmount ?? "")) {
                    this.inputAmountLegal = true;
                    this.inputAmountErrorMsg = InputErrorMsg.NONE;
                } else {
                    this.inputAmountLegal = false;
                    this.inputAmountErrorMsg = InputErrorMsg.VALUE_OVER_MAXIMUM;
                }
            } else {
                this.inputAmountLegal = false;
                this.inputAmountErrorMsg = InputErrorMsg.VALUE_LESS_THAN_ZERO;
            }
        } else {
            this.inputAmountLegal = false;
            this.inputAmountErrorMsg = InputErrorMsg.VALUE_NOT_NUMBER;
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

    transfer = async () => {
        let erc20Instance: Contract;
        let index: any;
        for (index in this.locator.tokens) {
            if (this.locator.tokens[index].name === "sgc") {
                erc20Instance = this.locator.tokens[index].contract!;
                break;
            }
        }
        try {
            this.transferLoading = true;
            const tx = await erc20Instance!.mint(
                this.account,
                ethers.utils.parseUnits(this.inputAmount!, this.locator.tokens[index].decimals)
            )

            Notification.track(tx.hash);
            await tx.wait();
        } catch (error) {
            Notification.showErrorMessage(ErrorMsg.filterRevertMsg((error as any).message));
        } finally {
            this.transferLoading = false;
        }
    };

}
