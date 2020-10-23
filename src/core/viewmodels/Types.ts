import { BigNumber, Contract } from 'ethers';

export interface IToken {
  name: string;
  address: string;
  contract?: Contract;
  allowance?: BigNumber;
  decimals?: number;
  balance?: BigNumber;
  interestParams?: IInterestModelParameters;
  pools?: IPool[];
  price?: BigNumber;
}

export interface IViewModel {
  account: string;
  protocol: Contract;
  interestModel: Contract;
  distributionFeeRatios: IDistributionFeeRatios;
  protocolReserveRatio: BigNumber;
}

export interface IInterestModelParameters {
  loanInterestRateUpperBound: BigNumber;
  loanInterestRateLowerBound: BigNumber;
}

export interface IBasePool {
  availableAmount: BigNumber;
  depositAmount: BigNumber;
  loanInterest: BigNumber;
  poolId: BigNumber;
  totalDepositWeight: BigNumber;
}

export interface IPool extends IBasePool {
  tokenAddress: string;
  term: number;
  lendAPR: number;
  loanAPR: number;
}

export interface IDistributionFeeRatios {
  depositDistributorFeeRatio: BigNumber;
  loanDistributorFeeRatio: BigNumber;
}

export interface ILoanPair {
  loanToken: IToken;
  collateralTokens: IToken[];
  minCollateralCoverageRatio: BigNumber;
}
