import { BigNumber, Contract } from "ethers";

import { ViewModelLocator } from "../ViewModelLocator";

export interface IToken {
  name: string;
  address: string;
  contract?: Contract;
  allowance?: BigNumber;
  decimals?: number;
  balance?: BigNumber;
  interestParams?: ILinearInterestModelParameters | IMappingInterestRates;
  pools?: IPool[];
  price?: BigNumber;
  minCollateralCoverageRatio?: BigNumber;
}

export enum WalletType {
  Disconnect = "Disconnect",
  MetaMask = "MetaMask",
  WalletConnect = "WalletConnect"
}

export interface IViewModel {
  account: string;
  protocol: Contract;
  interestRateModel: Contract;
  interestRateModelType: InterestRateModelType;
  distributionFeeRatios: IDistributionFeeRatios;
  protocolReserveRatio: BigNumber;
  tokens: IToken[];
  locator: ViewModelLocator;
}

export enum InterestRateModelType {
  Linear,
  Mapping,
}

export interface ILinearInterestModelParameters {
  loanInterestRateUpperBound: BigNumber;
  loanInterestRateLowerBound: BigNumber;
}

export interface IMappingInterestRates {
  termList: BigNumber[],
  interestRateList: BigNumber[],
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
  collateralizationRatio: string;
  collateralToken?: IToken;
  mainToken: IToken;
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
