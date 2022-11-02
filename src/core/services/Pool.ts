import { BigNumber, Contract, ethers } from "ethers";
import { IBasePool, IDistributionFeeRatios, ILinearInterestModelParameters, IMappingInterestRates, InterestRateModelType, IPool } from "../viewmodels/Types";

interface IConstruct {
  protocol: Contract;
  interestRateModel: Contract;
  interestRateModelType: InterestRateModelType;
  distributionFeeRatios: IDistributionFeeRatios;
  protocolReserveRatio: BigNumber;
}

export default class TokenPool {
  private protocol: Contract;
  private interestRateModel: Contract;
  private interestRateModelType: InterestRateModelType;
  private params: IConstruct;

  constructor(params: IConstruct) {
    this.protocol = params.protocol;
    this.interestRateModel = params.interestRateModel;
    this.interestRateModelType = params.interestRateModelType;
    this.params = params;
  }

  async getPools(tokenAddress: string): Promise<IPool[]> {
    const pools = [...((await this.protocol.getPoolsByToken(tokenAddress)) as IBasePool[])];
    const maxTerm = pools.length - 1;

    let interests: string[];
    let availableTerms;
    if (this.interestRateModelType === InterestRateModelType.Linear) {
      const params: ILinearInterestModelParameters = await this.interestRateModel.getLoanParameters(tokenAddress);

      interests = this.getLoanInterestRates(
        params.loanInterestRateLowerBound,
        params.loanInterestRateUpperBound,
        maxTerm
      ).map((i) => ethers.utils.formatUnits(i, 18));
      interests.unshift("0"); // padding
    } else if (this.interestRateModelType === InterestRateModelType.Mapping) {
      const interestDetail: IMappingInterestRates = await this.interestRateModel.getAllRates(tokenAddress);

      availableTerms = interestDetail.termList.map((i) => i.toNumber());
      interests = interestDetail.interestRateList.map((i) => ethers.utils.formatUnits(i, 18));
    }

    const computedPools = pools.map((pool, index) => {
      let apr: any = pool.totalDepositWeight.eq(0)
        ? BigNumber.from(0)
        : this.calcLendingAPR(pool, this.params.distributionFeeRatios, this.params.protocolReserveRatio);

      apr = Number.parseFloat(ethers.utils.formatEther(apr));
      let loanAPR;
      if (this.interestRateModelType === InterestRateModelType.Linear) {
        loanAPR = Number.parseFloat(interests[index]);
      } else if (this.interestRateModelType === InterestRateModelType.Mapping) {
        const pos = availableTerms.indexOf(index);
        if (pos >= 0) {
          loanAPR = Number.parseFloat(interests[pos]);
        } else {
          loanAPR = Number.parseFloat("0");
        };
      }

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
