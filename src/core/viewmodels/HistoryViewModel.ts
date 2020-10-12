import BaseViewModel from './BaseViewModel';
import { IDepositRecord } from './Types';

export default class HistoryViewModel extends BaseViewModel {
  records!: IDepositRecord[];

  async init() {
    this.records = await this.protocol.getDepositRecordsByAccount(this.account);
  }
}
