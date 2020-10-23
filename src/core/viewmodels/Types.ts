import { BigNumber, Contract } from "ethers";

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
  tokens: IToken[];
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

export enum RecordType {
  Deposit = "deposit",
  Borrow = "borrow",
}

export interface IRecordUI extends IDepositRecord, ILoanRecord {
  token: string;
  amount: string;
  apr: string;
  term: number;
  maturityDate: string;
  type: string;
  id: string;
}

export interface IDepositRecord {
  tokenAddress: string;
  depositTerm: BigNumber;
  depositAmount: string;
  poolId: string;
  createdAt: BigNumber;
  withdrewAt: BigNumber;
  isMatured: boolean;
  isWithdrawn: boolean;
  interest: string;
  isEarlyWithdrawable?: boolean;
}

export interface ILoanRecord {
  loanTokenAddress: string;
  collateralTokenAddress: string;
  loanAmount: string;
  collateralAmount: string;
  loanTerm: BigNumber;
  annualInterestRate: string;
  interest: string;
  collateralCoverageRatio: string;
  minCollateralCoverageRatio: string;
  alreadyPaidAmount: string;
  soldCollateralAmount: string;
  liquidatedAmount: string;
  remainingDebt: string;
  createdAt: BigNumber;
  dueAt: BigNumber;
  isOverDue: boolean;
  isClosed: boolean;
}
