import { BigNumber, utils } from "ethers";
import { IDepositRecord, ILoanRecord, IRecordUI, IToken, IViewModel, RecordType } from "./Types";
import UserTransactions, { HistoryTx } from "../services/UserTransactions";
import { calcCollateralAmount, calcCollateralRatio, getTimestampByPoolId } from "../services/Math";

import BaseViewModel from "./BaseViewModel";
import { ETHAddress } from "../services/Constants";
import dayjs from "dayjs";
import { observable } from "mobx";

interface IRecordViewModel extends IViewModel {
  record?: IRecordUI;
  id?: string;
}

export default class RecordViewModel extends BaseViewModel {
  @observable record?: IRecordUI;
  @observable newWithdrawCR?: string;
  @observable newDepositCR?: string;
  @observable txs: HistoryTx[] = [];
  maxDepositCollateral?: string;
  maxWithdrawCollateral?: string;

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

    const id = params.id;
    let r = params.record;

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
    console.log(this.txs);
  }

  updateWithdrawCollateralAmount = (value: string) => {
    const newAmount = Number.parseFloat(this.record!.collateralAmount) - Number.parseFloat(value);
    this.newWithdrawCR = this.calcNewRatio(`${newAmount}`);
    this._userInputWithdrawCollateralAmount = value;
  };

  updateDepositCollateralAmount = (value: string) => {
    const newAmount = Number.parseFloat(this.record!.collateralAmount) + Number.parseFloat(value);
    this.newDepositCR = this.calcNewRatio(`${newAmount}`);
    this._userInputDepositCollateralAmount = value;
  };

  updateRepayAmount = (amount: string) => {
    this._userInputRepayAmount = amount;
  };

  withdraw = async () => {
    if (this.record?.isMatured) {
      await this.protocol.withdraw(this.record!.id);
    } else {
      await this.protocol.earlyWithdraw(this.record!.id);
    }

    await this.forceRefresh();
  };

  repay = async () => {
    const amount = utils.parseUnits(this._userInputRepayAmount, this.record!.mainToken.decimals);
    await this.protocol.repayLoan(this.record!.id, amount.toString());
    await this.forceRefresh();
  };

  withdrawCollateral = async () => {
    const amount = utils.parseUnits(this._userInputWithdrawCollateralAmount, this.record!.collateralToken?.decimals);
    await this.protocol.subtractCollateral(this.record!.id, amount.toString());
    await this.forceRefresh();
  };

  depositCollateral = async () => {
    const collateralToken = this.record!.collateralToken!;
    const isETH = collateralToken.address === ETHAddress;
    const amount = utils.parseUnits(this._userInputDepositCollateralAmount, collateralToken.decimals);
    await this.protocol.addCollateral(this.record!.id, isETH ? "0" : amount.toString(), {
      value: isETH ? amount.toString() : "0",
    });
    await this.forceRefresh();
  };

  private calcNewRatio(value: string) {
    const debt = this.record!.remainingDebt;

    const loanToken = this.tokens.find(
      (t) =>
        t.address.toLowerCase() === this.record?.loanTokenAddress?.toLowerCase() ||
        t.address.toLowerCase() === this.record?.tokenAddress?.toLowerCase()
    )!;

    const collateralToken = this.tokens.find(
      (t) => t.address.toLowerCase() === this.record?.collateralTokenAddress?.toLowerCase()
    );

    return calcCollateralRatio(value, `${debt || 1}`, collateralToken?.price!, loanToken.price!).toFixed(2);
  }

  static fetchUIData(r: ILoanRecord | IDepositRecord, tokens: IToken[]) {
    const token = tokens.find(
      (t) =>
        t.address.toLowerCase() === (r as ILoanRecord).loanTokenAddress?.toLowerCase() ||
        t.address.toLowerCase() === (r as IDepositRecord).tokenAddress?.toLowerCase()
    )!;

    const collateralToken = tokens.find(
      (t) => t.address.toLowerCase() === (r as ILoanRecord).collateralTokenAddress?.toLowerCase()
    );

    const apr = r["annualInterestRate"]
      ? Number.parseFloat(utils.formatUnits(r["annualInterestRate"].mul(100), 18))
      : ((r.interest as unknown) as BigNumber)
          .div(
            ((((r as IDepositRecord).depositAmount || (r as ILoanRecord).remainingDebt) as unknown) as BigNumber).div(
              (((r as IDepositRecord).depositTerm || (r as ILoanRecord).loanTerm) as unknown) as BigNumber
            )
          )
          .mul(365)
          .mul(100)
          .toNumber();

    const isLoan = r["collateralTokenAddress"] ? true : false;

    let maturityDate = "";
    if (isLoan) {
      maturityDate = dayjs((r as ILoanRecord).dueAt.mul(1000).toNumber(), { utc: true }).format("YYYY-MM-DD HH:mm");
    } else {
      const poolId = (r as IDepositRecord).poolId;
      maturityDate = dayjs.utc(getTimestampByPoolId(poolId)).local().format("YYYY-MM-DD HH:mm");
    }

    const collateralizationRatio = isLoan
      ? Number.parseFloat(utils.formatUnits(r["collateralCoverageRatio"].mul(100), 18)).toFixed(2)
      : "0";

    const soldCollateralAmount = isLoan ? utils.formatUnits(r["soldCollateralAmount"], token.decimals) : "0";

    const remainingDebt = isLoan ? utils.formatUnits(r["remainingDebt"], token.decimals) : "0";

    const collateralAmount = isLoan ? utils.formatUnits(r["collateralAmount"], collateralToken?.decimals ?? 18) : "0";

    const maxCollateralAmount = collateralToken
      ? utils.formatUnits(collateralToken.balance ?? "0", collateralToken.decimals)
      : "0";

    const maxWithdrawCollateralAmount = collateralToken
      ? Number.parseFloat(collateralAmount) -
        calcCollateralAmount("151", remainingDebt, collateralToken.price!, token.price!)
      : "0";

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
    };
  }
}
