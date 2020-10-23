import { BigNumber, Contract, ethers } from "ethers";
import { IBasePool, IDistributionFeeRatios, IInterestModelParameters, IPool } from "../viewmodels/Types";

interface IConstruct {
  protocol: Contract;
  interestModel: Contract;
  distributionFeeRatios: IDistributionFeeRatios;
  protocolReserveRatio: BigNumber;
}

export default class TokenPool {
  private protocol: Contract;
  private interestModel: Contract;
  private params: IConstruct;

  constructor(params: IConstruct) {
    this.protocol = params.protocol;
    this.interestModel = params.interestModel;
    this.params = params;
  }

  async getPools(tokenAddress: string): Promise<IPool[]> {
    const pools = [...((await this.protocol.getPoolsByToken(tokenAddress)) as IBasePool[])];
    const maxTerm = pools.length - 1;

    const params = (await this.interestModel.getLoanParameters(tokenAddress)) as IInterestModelParameters;

    const interests = this.getLoanInterestRates(
      params.loanInterestRateLowerBound,
      params.loanInterestRateUpperBound,
      maxTerm
    ).map((i) => ethers.utils.formatUnits(i, 18));
    interests.unshift("0"); // padding

    const computedPools = pools.map((pool, index) => {
      let apr: any = pool.totalDepositWeight.eq(0)
        ? BigNumber.from(0)
        : this.calcLendingAPR(pool, this.params.distributionFeeRatios, this.params.protocolReserveRatio);

      apr = Number.parseFloat(ethers.utils.formatEther(apr));
      const loanAPR = Number.parseFloat(interests[index]);

      return {
        ...pool,
        tokenAddress,
        term: index,
        lendAPR: apr,
        loanAPR,
        totalDeposit: pool.depositAmount,
      };
    });

    computedPools.shift(); // Remove 1st pool
    
    return computedPools;
  }

  calcLendingAPR(pool: IBasePool, distributionFeeRatios: IDistributionFeeRatios, protocolReserveRatio: BigNumber) {
    const base = BigNumber.from("1000000000000000000");
    const year = BigNumber.from(365);

    const apr = pool.loanInterest
      .mul(
        base
          .sub(distributionFeeRatios.depositDistributorFeeRatio)
          .sub(distributionFeeRatios.loanDistributorFeeRatio)
          .sub(protocolReserveRatio)
      )
      .div(pool.totalDepositWeight)
      .mul(year);
    return apr;
  }

  getLoanInterestRate = (lowerBound: BigNumber, upperBound: BigNumber, loanTerm: number, maxLoanTerm: number) => {
    const H = BigNumber.from(upperBound);
    const L = BigNumber.from(lowerBound);

    return H.sub(H.sub(L).mul(BigNumber.from(loanTerm)).div(BigNumber.from(maxLoanTerm)));
  };

  getLoanInterestRates = (lowerBound: BigNumber, upperBound: BigNumber, maxLoanTerm: number) => {
    const interests = Array.from(new Array(maxLoanTerm))
      .map((_, i) => i + 1)
      .map((term: number) => this.getLoanInterestRate(lowerBound, upperBound, term, maxLoanTerm));

    return interests;
  };
}
