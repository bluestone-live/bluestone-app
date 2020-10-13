import { observable } from "mobx";
import BaseViewModel from "./BaseViewModel";
import { IDepositRecord, ILoanRecord, IRecordUI, RecordType } from "./Types";

type IRecord = IDepositRecord | ILoanRecord;
type ShowType = "active" | "closed" | "deposit" | "loan";

export default class HistoryViewModel extends BaseViewModel {
  private allRecords!: IRecordUI[];
  private depRecords!: IDepositRecord[];
  private loanRecords!: ILoanRecord[];

  @observable currentRecords!: IRecordUI[];
  @observable type: ShowType = "active";
  @observable loading = false;

  async refresh() {
    this.loading = true;

    this.depRecords = await this.protocol.getDepositRecordsByAccount(this.account);
    this.loanRecords = await this.protocol.getLoanRecordsByAccount(this.account);

    this.allRecords = (this.depRecords as IRecord[])
      .concat(this.loanRecords as IRecord[])
      .sort((r1: IRecord, r2: IRecord) => r1.createdAt.valueOf() - r2.createdAt.valueOf())
      .map((r) => {
        return {
          token: this.tokens.find(
            (t) =>
              t.address.toLowerCase() === (r as ILoanRecord).loanTokenAddress?.toLowerCase() ||
              t.address.toLowerCase() === (r as IDepositRecord).tokenAddress?.toLowerCase()
          )?.name,
          ...r,
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
          r.recordType === RecordType.Deposit ? !(r as IDepositRecord).isWithdrawn : !(r as ILoanRecord).isClosed
        );
        break;
      case "deposit":
        this.currentRecords = this.allRecords.filter((r) => r.recordType === RecordType.Deposit);
        break;
      case "loan":
        this.currentRecords = this.allRecords.filter((r) => r.recordType === RecordType.Borrow);
        break;
      case "closed":
        this.currentRecords = this.allRecords.filter((r) =>
          r.recordType === RecordType.Deposit ? (r as IDepositRecord).isWithdrawn : (r as ILoanRecord).isClosed
        );
        break;
    }
  }
}
