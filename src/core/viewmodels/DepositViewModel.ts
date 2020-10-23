import { BigNumber, ethers } from "ethers";
import { DistributorAddress, ETHAddress } from "../services/Constants";
import { IPool, IToken, IViewModel } from "./Types";

import BaseViewModel from "./BaseViewModel";
import dayjs from "dayjs";
import history from "../services/History";
import { observable } from "mobx";

interface IDepositViewModel extends IViewModel {
  depositTerms: BigNumber[];
}

export default class DepositViewModel extends BaseViewModel {
  private params: IDepositViewModel;

  @observable selectedDays = 1;
  @observable apr = 0;
  @observable term = 0;
  @observable maturityDate = dayjs().format("YYYY-MM-DD");
  @observable currentToken!: IToken;
  @observable recommends: { days: number; apr: number }[] = [];
  @observable loading = true;
  @observable sending = false;
  @observable selectedPool?: IPool;
  @observable inputValue?: string;
  readonly terms: number[];
  readonly tokenSymbols: string[];

  private selectedDate?: Date;

  constructor(params: IDepositViewModel) {
    super(params);

    this.params = params;
    this.terms = params.depositTerms.map((t) => t.toNumber()).sort();
    this.tokenSymbols = params.tokens.map((t) => t.name);

    this.maxDate.setDate(new Date().getDate() + this.terms[this.terms.length - 1]);

    this.selectToken(params.tokens[0].name);
  }

  selectToken = async (name: string) => {
    this.currentToken = this.params.tokens.find((t) => t.name.toLowerCase() === name.toLowerCase())!;

    if (this.currentToken.pools) return;
    this.loading = true;

    this.currentToken.pools = await this.tokenPool.getPools(this.currentToken.address);

    if (this.selectedPool && this.selectedDate) {
      this.selectTerm(this.selectedDate);
    } else {
      this.peekTerm(this.minDate);
    }

    this.recommends = this.currentToken.pools
      .sort((p1, p2) => p1.lendAPR - p2.lendAPR)
      .map((p) => {
        return { days: p.term, apr: p.lendAPR };
      })
      .splice(0, 2);

    this.loading = false;
  };

  peekTerm = (date: Date) => {
    if (this.minDate === date) return;
    const term = dayjs(date).diff(this.now, "d");
    const accurate = dayjs(date).diff(this.now, "minute");

    const targetPool = this.currentToken?.pools?.[term];

    this.term = accurate > 0 ? targetPool?.term ?? 0 : 0;
    this.apr = targetPool?.lendAPR ?? 0;
    this.maturityDate = dayjs(date).format("YYYY-MM-DD");

    return targetPool;
  };

  restoreTerm = () => {
    if (this.selectedDate) {
      this.peekTerm(this.selectedDate);
    }
  };

  selectTerm = (date: Date) => {
    this.selectedDate = date;
    const targetPool = this.peekTerm(date);
    this.selectedPool = targetPool;
  };

  inputBalance = (value: string) => {
    this.inputValue = value;
  };

  deposit = async () => {
    const { protocol } = this.params;
    const token = this.currentToken;
    const tokenWei = ethers.utils.parseUnits(this.inputValue ?? "0", token.decimals).toString();

    if (!token.allowance?.gte(tokenWei)) {
      await token.contract?.approve(
        protocol.address,
        "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      );
    }

    const isETH = token.address === ETHAddress;

    const tx = await protocol.deposit(
      token.address,
      isETH ? "0" : tokenWei,
      this.selectedPool!.term.toString(),
      DistributorAddress,
      {
        value: isETH ? tokenWei : "0",
      }
    );

    this.sending = true;

    const receipt = await tx.wait();

    const event = receipt.events.find((e) => e.event === "DepositSucceed");
    const id = event.args.recordId;

    this.sending = false;

    history.push(`/record/${id}`);
  };
}
