import { IDepositRecord, ILoanRecord, IRecordUI, IToken, IViewModel, RecordType } from "./Types";
import UserTransactions, { HistoryTx } from "../services/UserTransactions";
import { calcCollateralAmount, calcCollateralRatio, getTimestampByPoolId } from "../services/Math";

import BaseViewModel from "./BaseViewModel";
import { ETHAddress } from "../services/Constants";
import Notification from "../services/Notify";
import { checkNumber } from "../services/InputChecker";
import dayjs from "dayjs";
import { observable } from "mobx";
import { utils } from "ethers";

interface IRecordViewModel extends IViewModel {
  record?: IRecordUI;
  id?: string;
}

export default class RecordViewModel extends BaseViewModel {
  @observable record?: IRecordUI;
  @observable newWithdrawCR?: string;
  @observable newDepositCR?: string;
  @observable txs: HistoryTx[] = [];
  @observable withdrawing = false;
  @observable withdrawingCollateral = false;
  @observable depositingCollateral = false;
  @observable repaying = false;
  maxDepositCollateral?: string;
  maxWithdrawCollateral?: string;

  @observable isRepayAmountLegal?: boolean;
  @observable isWithdrawCollateralAmountLegal?: boolean;
  @observable isDepositCollateralAmountLegal?: boolean;

  private _userInputRepayAmount!: string;
  private _userInputWithdrawCollateralAmount!: string;
  private _userInputDepositCollateralAmount!: string;
  private _params: IRecordViewModel;
  private _userTxs: UserTransactions;

  isClosed() {
    return this.record?.isWithdrawn || this.record?.isClosed;
  }

  constructor(params: IRecordViewModel) {
    super(params);

    this._params = params;
    this._userTxs = new UserTransactions(params);
    this.record = params.record;
    this.refresh();
    this._userTxs.queryHistory(this.account, (params.record?.id || params.id)!).then((v) => {
      this.txs = v;
    });
  }

  private async refresh() {
    const params = this._params;

    const id = params.id || params.record?.id;
    let r!: IRecordUI;

    if (id) {
      try {
        r = await this.protocol.getDepositRecordById(id);
      } catch (error) {
        try {
          r = await this.protocol.getLoanRecordById(id);
        } catch (error) {}
      }
    }

    if (!r) return;

    const ui = RecordViewModel.fetchUIData(r, this.tokens);

    this.newWithdrawCR = this.newDepositCR = ui.collateralizationRatio;
    this.maxDepositCollateral = ui.maxCollateralAmount;
    this.maxWithdrawCollateral = ui.maxWithdrawCollateralAmount;

    this.record = {
      ...r,
      ...ui,
    } as IRecordUI;
  }

  private async forceRefresh() {
    while (true) {
      try {
        await this.refresh();
        break;
      } catch {
        continue;
      }
    }

    this.txs = await this._userTxs.queryHistory(this.account, this.record!.id);
  }

  updateWithdrawCollateralAmount = (value: string) => {
    const newAmount = Number.parseFloat(this.record!.collateralAmount) - Number.parseFloat(value);
    this.newWithdrawCR = this.calcNewRatio(`${newAmount}`);
    this._userInputWithdrawCollateralAmount = value;
    this.isWithdrawCollateralAmountLegal =
      checkNumber(value) && Number.parseFloat(value) > 0 && Number.parseFloat(value) <= Number.parseFloat(this.maxWithdrawCollateral || "0");
  };

  updateDepositCollateralAmount = (value: string) => {
    const newAmount = Number.parseFloat(this.record!.collateralAmount) + Number.parseFloat(value);
    this.newDepositCR = this.calcNewRatio(`${newAmount}`);
    this._userInputDepositCollateralAmount = value;
    this.isDepositCollateralAmountLegal =
      checkNumber(value) && Number.parseFloat(value) > 0 && Number.parseFloat(value) <= Number.parseFloat(this.maxDepositCollateral || "0");
  };

  updateRepayAmount = (amount: string) => {
    this._userInputRepayAmount = amount;
    this.isRepayAmountLegal = checkNumber(amount) && Number.parseFloat(amount) > 0;
  };

  withdraw = async () => {
    try {
      this.withdrawing = true;
      let tx: any;

      if (this.record?.isMatured) {
        tx = await this.protocol.withdraw(this.record!.id);
      } else {
        tx = await this.protocol.earlyWithdraw(this.record!.id);
      }

      Notification.track(tx.hash);
      await tx.wait();
    } finally {
      this.withdrawing = false;
    }

    await this.forceRefresh();
  };

  repay = async () => {
    try {
      this.repaying = true;
      const amount = utils.parseUnits(this._userInputRepayAmount, this.record!.mainToken.decimals);
      const tx = await this.protocol.repayLoan(this.record!.id, amount.toString());
      Notification.track(tx.hash);

      await tx.wait();
    } finally {
      this.repaying = false;
    }

    await this.forceRefresh();
  };

  withdrawCollateral = async () => {
    try {
      this.withdrawingCollateral = true;
      const amount = utils.parseUnits(this._userInputWithdrawCollateralAmount, this.record!.collateralToken?.decimals);
      const tx = await this.protocol.subtractCollateral(this.record!.id, amount.toString());
      Notification.track(tx.hash);

      await tx.wait();
    } finally {
      this.withdrawingCollateral = false;
    }

    await this.forceRefresh();
  };

  depositCollateral = async () => {
    try {
      this.depositingCollateral = true;
      const collateralToken = this.record!.collateralToken!;
      const isETH = collateralToken.address === ETHAddress;
      const amount = utils.parseUnits(this._userInputDepositCollateralAmount, collateralToken.decimals);
      const tx = await this.protocol.addCollateral(this.record!.id, isETH ? "0" : amount.toString(), {
        value: isETH ? amount.toString() : "0",
      });
      Notification.track(tx.hash);

      await tx.wait();
    } finally {
      this.depositingCollateral = false;
    }

    await this.forceRefresh();
  };

  private calcNewRatio(value: string) {
    const debt = this.record!.remainingDebt;

    const loanToken = this.tokens.find(
      (t) =>
        t.address.toLowerCase() === this.record?.loanTokenAddress?.toLowerCase() ||
        t.address.toLowerCase() === this.record?.tokenAddress?.toLowerCase()
    )!;

    const collateralToken = this.tokens.find((t) => t.address.toLowerCase() === this.record?.collateralTokenAddress?.toLowerCase());

    return calcCollateralRatio(value, `${debt || 1}`, collateralToken?.price!, loanToken.price!).toFixed(2);
  }

  openTx = (tx: HistoryTx) => {
    window.open(`https://${this.locator.network}.etherscan.io/tx/${tx.transactionHash}`, "_blank");
  };

  static fetchUIData(r: ILoanRecord | IDepositRecord, tokens: IToken[]) {
    const token = tokens.find(
      (t) =>
        t.address.toLowerCase() === (r as ILoanRecord).loanTokenAddress?.toLowerCase() ||
        t.address.toLowerCase() === (r as IDepositRecord).tokenAddress?.toLowerCase()
    )!;

    const collateralToken = tokens.find((t) => t.address.toLowerCase() === (r as ILoanRecord).collateralTokenAddress?.toLowerCase());

    const apr = r["annualInterestRate"]
      ? Number.parseFloat(utils.formatUnits(r["annualInterestRate"].mul(100), 18))
      : (Number.parseFloat(utils.formatUnits(r.interest, token.decimals)) /
          Number.parseFloat(utils.formatUnits(r["depositAmount"] || r["remainingDebt"], token.decimals)) /
          Number.parseFloat(utils.formatUnits(r["depositTerm"] || r["loanTerm"], 0))) *
        365 *
        100;

    const isLoan = r["collateralTokenAddress"] ? true : false;

    let maturityDate = "";
    if (isLoan) {
      maturityDate = dayjs((r as ILoanRecord).dueAt.mul(1000).toNumber(), { utc: true })
        .local()
        .format("YYYY-MM-DD HH:mm");
    } else {
      const poolId = (r as IDepositRecord).poolId;
      maturityDate = dayjs.utc(getTimestampByPoolId(poolId)).local().format("YYYY-MM-DD HH:mm");
    }

    const collateralizationRatio = isLoan ? Number.parseFloat(utils.formatUnits(r["collateralCoverageRatio"].mul(100), 18)).toFixed(2) : "0";

    const soldCollateralAmount = isLoan ? utils.formatUnits(r["soldCollateralAmount"], token.decimals) : "0";

    const remainingDebt = isLoan ? utils.formatUnits(r["remainingDebt"], token.decimals) : "0";

    const collateralAmount = isLoan ? utils.formatUnits(r["collateralAmount"], collateralToken?.decimals ?? 18) : "0";

    const maxCollateralAmount = collateralToken ? utils.formatUnits(collateralToken.balance ?? "0", collateralToken.decimals) : "0";

    let maxWithdrawCollateralAmount = collateralToken
      ? Number.parseFloat(collateralAmount) - calcCollateralAmount("151", remainingDebt, collateralToken!.price!, token.price!)
      : 0;

    maxWithdrawCollateralAmount = maxWithdrawCollateralAmount < 0.0000001 ? 0 : maxWithdrawCollateralAmount;

    const isClosed = r["isClosed"] || r["isWithdrawn"] || r["withdrewAt"]?.gt(0);

    const isMatured = dayjs(maturityDate).isBefore(dayjs());

    return {
      id: r["depositId"] || r["loanId"],
      token: token.name,
      amount: utils.formatUnits((r as ILoanRecord).loanAmount || (r as IDepositRecord).depositAmount, token.decimals),
      type: isLoan ? RecordType.Borrow : RecordType.Deposit,
      interest: Number.parseFloat(utils.formatUnits(r.interest, token.decimals)).toFixed(4),
      apr: apr.toFixed(2),
      term: (r as IDepositRecord).depositTerm?.toNumber() || (r as ILoanRecord).loanTerm?.toNumber(),
      maturityDate,
      collateralizationRatio,
      soldCollateralAmount,
      remainingDebt,
      collateralAmount,
      mainToken: token,
      collateralToken,
      maxCollateralAmount,
      maxWithdrawCollateralAmount: maxWithdrawCollateralAmount.toString(),
      isClosed,
      isMatured,
    };
  }
}
