import { Dayjs } from 'dayjs';
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

export interface ITerm {
  text: string;
  value: number;
}

export enum RecordType {
  Deposit = 'deposit',
  Borrow = 'borrow',
}

export interface IDepositRecord {
  recordId: string;
  tokenAddress: string;
  depositTerm: ITerm;
  depositAmount: string;
  poolId: string;
  createdAt: Dayjs;
  withdrewAt: Dayjs;
  isMatured: boolean;
  isWithdrawn: boolean;
  interest: string;
  recordType: RecordType;
  isEarlyWithdrawable?: boolean;
}
