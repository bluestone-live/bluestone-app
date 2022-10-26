import { BigNumber, ethers, utils } from "ethers";

import BaseViewModel from "./BaseViewModel";
import { IMappingInterestModelParameters, InterestRateModelType, IToken } from "./Types";
import { observable } from "mobx";

interface PoolOverview {
  token: IToken;
  lendingAmount: string;
  loanAmount: string;
  lowestLendingApr: string;
  bestLendingApr: string;
  bestLendingTerm: number;
  lowLoanApr: string;
  highLoanApr: string;
}

export default class HomeViewModel extends BaseViewModel {
  @observable pools!: PoolOverview[];

  async refresh() {
    const interestRateModelType = this.locator.interestRateModelType;
    this.pools = await Promise.all(
      this.tokens.map(async (t) => {
        const pools = await this.tokenPool.getPools(t.address);
        const loanAmount = pools.reduce((p, c) => p.add(c.availableAmount), BigNumber.from(0));
        const lendingAmount = pools.reduce((p, c) => p.add(c.depositAmount), BigNumber.from(0));

        const bestLending = pools.sort((p1, p2) => p2.lendAPR - p1.lendAPR);
        let lowLoanApr, highLoanApr;
        if (interestRateModelType === InterestRateModelType.Linear) {
          lowLoanApr = (pools[pools.length - 1].loanAPR * 100).toFixed(2);
          highLoanApr = (pools[0].loanAPR * 100).toFixed(2);
        }
        else if (interestRateModelType === InterestRateModelType.Mapping) {
          const params = (await this.locator.interestRateModel.getLoanParameters(t.address)) as IMappingInterestModelParameters;

          // const availableTerms = params.termList.map((i) => i.toNumber());
          const interests = params.interestRateList.map((i) => ethers.utils.formatUnits(i, 18));

          lowLoanApr = (parseFloat(interests[0]) * 100).toFixed(2);
          highLoanApr = (parseFloat(interests[interests.length-1]) * 100).toFixed(2);
        }

        return {
          token: t,
          lendingAmount: Number.parseFloat(utils.formatUnits(lendingAmount, t.decimals)).toFixed(4),
          loanAmount: Number.parseFloat(utils.formatUnits(loanAmount, t.decimals)).toFixed(4),
          lowestLendingApr: (bestLending[bestLending.length - 1]?.lendAPR * 100).toFixed(2),
          bestLendingApr: (bestLending[0]?.lendAPR * 100).toFixed(2),
          bestLendingTerm: bestLending[0]?.term,
          lowLoanApr,
          highLoanApr,
        } as PoolOverview;
      })
    );
  }
}
