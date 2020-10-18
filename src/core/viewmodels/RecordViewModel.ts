import { observable } from "mobx";
import BaseViewModel from "./BaseViewModel";
import { IDepositRecord, ILoanRecord, IRecordUI, IToken, IViewModel, RecordType } from "./Types";
import dayjs from "dayjs";
import { calcCollateralAmount, calcCollateralRatio, getTimestampByPoolId } from "../services/Math";
import { BigNumber, utils } from "ethers";

interface IRecordViewModel extends IViewModel {
  record?: IRecordUI;
  id?: string;
}

export default class RecordViewModel extends BaseViewModel {
  @observable record?: IRecordUI;
  @observable newWithdrawCR?: string;
  @observable newDepositCR?: string;
  maxDepositCollateral?: string;
  maxWithdrawCollateral?: string;

  constructor(params: IRecordViewModel) {
    super(params);

    this.record = params.record;
    this.init(params);
  }

  private async init(params: IRecordViewModel) {
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
    console.log(ui.maxWithdrawCollateralAmount);

    this.record = {
      ...r,
      ...ui,
    } as IRecordUI;

    this.fetchTxs();
  }

  updateWithdrawCollateralAmount = (value: string) => {
    const newAmount = Number.parseFloat(this.record!.collateralAmount) - Number.parseFloat(value);
    this.newWithdrawCR = this.calcNewRatio(`${newAmount}`);
  };

  updateDepositCollateralAmount = (value: string) => {
    const newAmount = Number.parseFloat(this.record!.collateralAmount) + Number.parseFloat(value);
    this.newDepositCR = this.calcNewRatio(`${newAmount}`);
  };

  private async fetchTxs() {
    const loan = this.protocol.filters.LoanSucceed(this.account);
    const deposit = this.protocol.filters.DepositSucceed(this.account);

    console.log(await Promise.all([loan, deposit].map((f) => this.protocol.queryFilter(f))));
  }

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
      collateralToken,
      maxCollateralAmount,
      maxWithdrawCollateralAmount: maxWithdrawCollateralAmount.toString(),
    };
  }
}
