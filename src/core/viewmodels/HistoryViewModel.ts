import { BigNumber, ethers } from "ethers";
import { observable } from "mobx";
import BaseViewModel from "./BaseViewModel";
import { IDepositRecord, ILoanRecord, IRecordUI, RecordType } from "./Types";
import dayjs from "dayjs";
import { getTimestampByPoolId } from "../services/Math";

type IRecord = IDepositRecord | ILoanRecord;
type ShowType = "active" | "closed" | "deposit" | "loan";

export default class HistoryViewModel extends BaseViewModel {
  private allRecords!: IRecordUI[];
  private depRecords!: IDepositRecord[];
  private loanRecords!: ILoanRecord[];

  @observable currentRecords: IRecordUI[] = [];
  @observable type: ShowType = "active";
  @observable loading = true;

  async refresh() {
    this.loading = true;

    this.depRecords = await this.protocol.getDepositRecordsByAccount(this.account);
    this.loanRecords = await this.protocol.getLoanRecordsByAccount(this.account);

    this.allRecords = (this.depRecords as IRecord[])
      .concat(this.loanRecords as IRecord[])
      .sort((r1: IRecord, r2: IRecord) => r2.createdAt.sub(r1.createdAt).toNumber())
      .map((r) => {
        const token = this.tokens.find(
          (t) =>
            t.address.toLowerCase() === (r as ILoanRecord).loanTokenAddress?.toLowerCase() ||
            t.address.toLowerCase() === (r as IDepositRecord).tokenAddress?.toLowerCase()
        )!;

        const apr = r["annualInterestRate"]
          ? Number.parseFloat(ethers.utils.formatUnits(r["annualInterestRate"].mul(100), 18))
          : ((r.interest as unknown) as BigNumber)
              .div(
                ((((r as IDepositRecord).depositAmount ||
                  (r as ILoanRecord).remainingDebt) as unknown) as BigNumber).div(
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

        return {
          ...r,
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
        } as IRecordUI;
      });

    this.switch(this.type);

    this.loading = false;
  }

  switch(type: ShowType) {
    this.type = type;

    switch (type) {
      case "active":
        this.currentRecords = this.allRecords.filter((r) =>
          r.type === RecordType.Deposit ? !(r as IDepositRecord).isWithdrawn : !(r as ILoanRecord).isClosed
        );
        break;
      case "deposit":
        this.currentRecords.splice(0, this.currentRecords.length);
        this.currentRecords = this.allRecords.filter((r) => r.type === RecordType.Deposit);
        break;
      case "loan":
        this.currentRecords = this.allRecords.filter((r) => r.type === RecordType.Borrow);
        break;
      case "closed":
        this.currentRecords = this.allRecords.filter((r) =>
          r.type === RecordType.Deposit ? (r as IDepositRecord).isWithdrawn : (r as ILoanRecord).isClosed
        );
        break;
    }
  }
}
