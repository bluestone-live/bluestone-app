import dayjs from "dayjs";
import { Contract } from "ethers";
import TokenPool from "../services/Pool";
import { IToken, IViewModel } from "./Types";

export default class BaseViewModel {
  protected tokenPool: TokenPool;
  minDate = new Date();
  maxDate = new Date();
  protected readonly now = dayjs();
  protected protocol!: Contract;
  protected account!: string;
  protected tokens!: IToken[];

  constructor(params: IViewModel) {
    this.tokenPool = new TokenPool({ ...params });
    this.protocol = params.protocol;
    this.account = params.account;
    this.tokens = params.tokens;
  }
}
