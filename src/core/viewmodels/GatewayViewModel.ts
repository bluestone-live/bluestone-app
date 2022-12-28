import { BigNumber, ethers } from "ethers";
import { observable } from "mobx";

import BaseViewModel from "./BaseViewModel";
import Notification from "../services/Notify";
import { checkNumber } from "../services/InputChecker";
import { ErrorMsg, InputErrorMsg } from "../services/ErrorMsg";
import { IViewModel } from "./Types";
import type { IToken } from "./Types";
import GatewayTransactions, { HistoryGatewayTx, Status } from "../services/GatewayTransactions";

interface IGatewayViewModel extends IViewModel {
    tokens: IToken[]
}

export default class GatewayViewModel extends BaseViewModel {
    private params: IGatewayViewModel;

    @observable gatewayAddress = "0x8CA7D5c07d658D7275C891119C762C7f82A875E2";
    @observable bankAccount?: string;
    @observable activeBuyStep = Status.Transfering;
    @observable failedBuyStep = Status.None;
    @observable activeRedeemStep = Status.Transfering;
    @observable failedRedeemStep = Status.None;
    @observable allowance?: BigNumber;      // transfer from account to gateway wallet
    @observable loading = false;
    @observable currentToken!: IToken;
    @observable inputAmount?: string;
    @observable inputAmountLegal?: boolean;
    @observable transferLoading = false;
    @observable inputAmountErrorMsg?: string;
    @observable maxAvailableAmount?: string;
    @observable txs: HistoryGatewayTx[] = [];
    private _gatewayTxs = new GatewayTransactions();
    readonly tokenSymbols: string[];

    constructor(params: IGatewayViewModel) {
        super(params);
        this.params = params;

        this.tokenSymbols = params.tokens.map((t) => t.name);
        this.selectToken(params.tokens[0].name);
        this.queryBankAccountInfo().then((v) => {
            this.bankAccount = v;
        });
        this._gatewayTxs.queryGatewayHistory(this.currentToken, this.account, this.gatewayAddress).then((v) => {
            this.txs = v;
        });
        // this.listenBuyStatusFromGateway();
    }

    setActiveBuyStep(step: number) {
        this.activeBuyStep = step;
    }

    selectToken = async (name: string) => {
        this.currentToken = this.params.tokens.find((t) => t.name.toLowerCase() === name.toLowerCase())!;
        this.maxAvailableAmount = ethers.utils.formatUnits(this.currentToken.balance ?? "0", this.currentToken.decimals ?? 18);
        this.allowance = await this.currentToken.contract?.allowance(this.account, this.gatewayAddress);
        this.loading = false;
    };

    // TODO
    queryBankAccountInfo = async () => {
        return "**4152";
    }

    inputAmountCheck = (value?: string) => {
        this.failedRedeemStep = Status.None;

        if (!value) {
            this.inputAmountLegal = false;
            this.inputAmountErrorMsg = InputErrorMsg.NONE;
            return;
        }
        this.inputAmount = value;

        if (checkNumber(value)) {
            if (Number.parseFloat(value) > 0) {
                if (Number.parseFloat(value) <= Number.parseFloat(this.maxAvailableAmount ?? "")) {
                    if (value.toString().indexOf(".") > 0 && value.toString().indexOf(".") < value.toString().length - 3) {
                        this.inputAmountLegal = false;
                        this.inputAmountErrorMsg = InputErrorMsg.VALUE_DECIMAL_NUMBER_INVALID;
                    } else {
                        this.inputAmountLegal = true;
                        this.inputAmountErrorMsg = InputErrorMsg.NONE;
                    }
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

    transferToGateway = async () => {
        this.activeRedeemStep = Status.Transfering;
        const inputAmountWei = ethers.utils.parseUnits(this.inputAmount!, this.currentToken.decimals);
        if (inputAmountWei.gte(this.allowance!)) {
            try {
                this.transferLoading = true;
                const tx = await this.currentToken.contract?.approve(this.gatewayAddress, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
                Notification.track(tx.hash);
                await tx.wait();
                this.allowance = BigNumber.from("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
            } catch (error) {
                Notification.showErrorMessage(ErrorMsg.filterRevertMsg((error as any).message));
                return;
            } finally {
                this.transferLoading = false;
            }
        }
        try {
            this.transferLoading = true;
            const tx = await this.currentToken.contract?.transfer(
                this.gatewayAddress,
                inputAmountWei
            )
            Notification.track(tx.hash);
            try {
                await tx.wait();
            } catch (e) {
                this.failedRedeemStep = this.activeRedeemStep;
                throw e;
            }
            this.activeRedeemStep = Status.Verifying;
            this.listenRedeemStatusFromGateway(tx.hash);
            this.txs = await this._gatewayTxs.queryGatewayHistory(this.currentToken, this.account, this.gatewayAddress);
        } catch (error) {
            Notification.showErrorMessage(ErrorMsg.filterRevertMsg((error as any).message));
        } finally {
            this.transferLoading = false;
        }
    };

    // TODO
    listenRedeemStatusFromGateway = async (txHash: any) => {
        var step = this.activeRedeemStep;
        while (step !== Status.Succeed) {
            step = await this._gatewayTxs.getGatewayRedeemStatus(this.account, txHash)
            if (step === Status.Failed) {
                this.failedRedeemStep = this.activeRedeemStep;
                break;
            }
            if (step !== this.activeRedeemStep) {
                this.activeRedeemStep = step;
            }
        }
    }

    // TODO
    listenBuyStatusFromGateway = async () => {
        var step = this.activeBuyStep;
        while (step !== Status.Succeed) {
            step = await this._gatewayTxs.getGatewayBuyStatus(this.account);
            if (step === Status.Failed) {
                this.failedBuyStep = this.activeBuyStep;
                break;
            }
            if (step !== this.activeBuyStep) {
                this.activeBuyStep = step;
            }
        }
    }

    openTx = (tx: HistoryGatewayTx) => {
        window.open(`https://${this.locator.network}.etherscan.io/tx/${tx.transactionHash}`, "_blank");
    };
}
