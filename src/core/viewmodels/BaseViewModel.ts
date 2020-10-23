import dayjs from 'dayjs';
import TokenPool from '../services/Pool';
import { IViewModel } from './Types';

export default class BaseViewModel {
  protected tokenPool: TokenPool;
  minDate = new Date();
  maxDate = new Date();
  protected readonly now = dayjs();

  constructor(params: IViewModel) {
    this.tokenPool = new TokenPool({ ...params });
  }
}
