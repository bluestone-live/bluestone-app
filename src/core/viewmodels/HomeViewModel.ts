import { BigNumber, utils } from "ethers";

import BaseViewModel from "./BaseViewModel";
import { IToken } from "./Types";
import { observable } from "mobx";

interface PoolOverview {
  token: IToken;
  lendingAmount: string;
  loanAmount: string;
  bestLendingApr: string;
  bestLendingTerm: number;
  lowLoanApr: string;
  highLoanApr: string;
}

export default class HomeViewModel extends BaseViewModel {
  @observable pools!: PoolOverview[];

  async refresh() {
    this.pools = await Promise.all(
      this.tokens.map(async (t) => {
        const pools = await this.tokenPool.getPools(t.address);
        const loanAmount = pools.reduce((p, c) => p.add(c.availableAmount), BigNumber.from(0));
        const lendingAmount = pools.reduce((p, c) => p.add(c.depositAmount), BigNumber.from(0));

        const bestLending = pools.sort((p1, p2) => p2.lendAPR - p1.lendAPR);

        return {
          token: t,
          lendingAmount: utils.formatUnits(lendingAmount, t.decimals),
          loanAmount: utils.formatUnits(loanAmount, t.decimals),
          bestLendingApr: (bestLending[0]?.lendAPR * 100).toFixed(2),
          bestLendingTerm: bestLending[0]?.term,
          lowLoanApr: (pools[pools.length - 1].loanAPR * 100).toFixed(2),
          highLoanApr: (pools[0].loanAPR * 100).toFixed(2),
        } as PoolOverview;
      })
    );
  }
}
