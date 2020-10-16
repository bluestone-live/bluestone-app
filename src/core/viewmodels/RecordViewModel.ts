import { observable } from "mobx";
import BaseViewModel from "./BaseViewModel";
import { IDepositRecord, ILoanRecord, IRecordUI, IToken, IViewModel, RecordType } from "./Types";
import dayjs from "dayjs";
import { getTimestampByPoolId } from "../services/Math";
import { BigNumber, ethers } from "ethers";

interface IRecordViewModel extends IViewModel {
  record?: IRecordUI;
  id?: string;
}

export default class RecordViewModel extends BaseViewModel {
  @observable record?: IRecordUI;

  constructor(params: IRecordViewModel) {
    super(params);

    this.record = params.record;
    if (params.id) {
      this.init(params.id);
    }
  }

  private async init(id: string) {
    let r!: IDepositRecord | ILoanRecord;
    try {
      r = await this.protocol.getDepositRecordById(id);
    } catch (error) {
      try {
        r = await this.protocol.getLoanRecordById(id);
      } catch (error) {}
    }

    if (!r) return;
    console.log(r);

    const ui = RecordViewModel.fetchUIData(r, this.tokens);
    this.record = {
      ...r,
      ...ui,
    } as IRecordUI;
  }

  static fetchUIData(r: ILoanRecord | IDepositRecord, tokens: IToken[]) {
    const token = tokens.find(
      (t) =>
        t.address.toLowerCase() === (r as ILoanRecord).loanTokenAddress?.toLowerCase() ||
        t.address.toLowerCase() === (r as IDepositRecord).tokenAddress?.toLowerCase()
    )!;

    const apr = r["annualInterestRate"]
      ? Number.parseFloat(ethers.utils.formatUnits(r["annualInterestRate"].mul(100), 18))
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
      ? Number.parseFloat(ethers.utils.formatUnits(r["collateralCoverageRatio"].mul(100), 18)).toFixed(2)
      : "0";

    const soldCollateralAmount = isLoan
      ? Number.parseFloat(ethers.utils.formatUnits(r["soldCollateralAmount"], token.decimals)).toFixed(2)
      : "0";

    return {
      id: r["depositId"] || r["loanId"],
      token: token.name,
      amount: ethers.utils.formatUnits(
        (r as ILoanRecord).loanAmount || (r as IDepositRecord).depositAmount,
        token.decimals
      ),
      type: isLoan ? RecordType.Borrow : RecordType.Deposit,
      interest: Number.parseFloat(ethers.utils.formatUnits(r.interest, token.decimals)).toFixed(4),
      apr: apr.toFixed(2),
      term: (r as IDepositRecord).depositTerm?.toNumber() || (r as ILoanRecord).loanTerm?.toNumber(),
      maturityDate,
      collateralizationRatio,
      soldCollateralAmount,
    };
  }

  refresh() {}
}
