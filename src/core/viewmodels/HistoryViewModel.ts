import { IDepositRecord, ILoanRecord, IRecordUI, IViewModel, RecordType } from "./Types";

import BaseViewModel from "./BaseViewModel";
import RecordViewModel from "./RecordViewModel";
import { ViewModelLocator } from "../ViewModelLocator";
import { observable } from "mobx";

type IRecord = IDepositRecord | ILoanRecord;
type ShowType = "active" | "closed" | "deposit" | "loan";

interface IHistoryViewModel extends IViewModel {
  locator: ViewModelLocator;
}

export default class HistoryViewModel extends BaseViewModel {
  private allRecords!: IRecordUI[];
  private depRecords!: IDepositRecord[];
  private loanRecords!: ILoanRecord[];
  private locator: ViewModelLocator;

  @observable currentRecords: IRecordUI[] = [];
  @observable type: ShowType = "active";
  @observable loading = true;

  constructor(params: IHistoryViewModel) {
    super(params);
    this.locator = params.locator;
  }

  async refresh() {
    this.loading = true;

    this.depRecords = await this.protocol.getDepositRecordsByAccount(this.account);
    this.loanRecords = await this.protocol.getLoanRecordsByAccount(this.account);

    this.allRecords = await Promise.all(
      (this.depRecords as IRecord[])
        .concat(this.loanRecords as IRecord[])
        .sort((r1: IRecord, r2: IRecord) => r2.createdAt.sub(r1.createdAt).toNumber())
        .map(async (r) => {
          const ui = (await RecordViewModel.fetchUIData(r, this.tokens)) as any;
          return {
            ...r,
            ...ui,
          } as IRecordUI;
        })
    );

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

  selectRecord = (record: IRecordUI) => {
    this.locator.selectRecord(record);
  };
}
