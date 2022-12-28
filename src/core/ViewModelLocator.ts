import * as _ from "lodash";
import { ETHAddress, MaxInt256 } from "./services/Constants";
import { IDistributionFeeRatios, ILoanPair, IRecordUI, IToken, InterestRateModelType } from "./viewmodels/Types";
import { ethers, BigNumber, Contract } from "ethers";

import WalletConnectProvider from "@walletconnect/web3-provider";

import DepositViewModel from "./viewmodels/DepositViewModel";
import GatewayViewModel from "./viewmodels/GatewayViewModel";
import HistoryViewModel from "./viewmodels/HistoryViewModel";
import HomeViewModel from "./viewmodels/HomeViewModel";
import RecordViewModel from "./viewmodels/RecordViewModel";
import FaucetViewModel from "./viewmodels/FaucetViewModel";

import { abi as ERC20Abi } from "../contracts/ERC20Mock.json";
import { EventEmitter } from "events";
import { abi as MappingInterestRateModelAbi } from "../contracts/MappingInterestRateModel.json";
import { abi as LinearInterestRateModelAbi } from "../contracts/LinearInterestRateModel.json";
import LoanViewModel from "./viewmodels/LoanViewModel";
import Notification from "./services/Notify";
import { abi as ProtocolAbi } from "../contracts/Protocol.json";
import { WalletType } from "../core/viewmodels/Types"

export class ViewModelLocator extends EventEmitter {
  static readonly instance = new ViewModelLocator();

  infuraId: string;
  walletconnectProvider!: WalletConnectProvider;
  provider!: ethers.providers.Web3Provider;
  private signer!: ethers.providers.JsonRpcSigner;
  private initialized = false;

  initFinished = false;

  wallet!: WalletType;
  account!: string;
  balance!: BigNumber;
  protocolInfo!: IProtocolInfo;
  protocol!: Contract;
  interestRateModel!: Contract;
  interestRateModelType!: InterestRateModelType;
  nativeEther!: IPlainToken;
  tokens!: IToken[];
  depositTokens!: IToken[];
  loanPairs!: ILoanPair[];
  maxLoanTerm!: BigNumber;
  depositTerms!: BigNumber[];

  maxDistributorFeeRatios!: IDistributionFeeRatios;
  protocolReserveRatio!: BigNumber;
  network?: string;

  constructor() {
    super();
    this.infuraId = "82d79956c4c14b268e820d06681d9cda";
  }

  private async watchChanged() {
    (this.provider as any).provider.on("accountsChanged", () => {
      console.log("account changed....")
      window.location.reload();
    });
    (this.provider as any).provider.on("chainChanged", () => {
      console.log("chain changed....")
      window.location.reload();
    });
  }

  async init() {
    if (this.initialized) return true;
    if (!(await this.initApp())) return false;
    this.initialized = true;

    await this.initProtocol();
    await this.initAccount();

    this.initFinished = true;
    super.emit("init");

    return true;
  }

  private async initApp() {
    this.initWallet();
    if (this.wallet === WalletType.MetaMask) {
      this.provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const [account] = await this.provider.send("eth_requestAccounts", []);
      if (!account) return false;
      this.account = account;
    } else if (this.wallet === WalletType.WalletConnect) {
      this.walletconnectProvider = new WalletConnectProvider({
        infuraId: this.infuraId,
      });
      this.provider = new ethers.providers.Web3Provider(this.walletconnectProvider);
      const [account] = await this.walletconnectProvider.enable();
      if (!account) return false;
      this.account = account;
    } else {
      return false;
    }

    this.watchChanged();

    this.signer = this.provider.getSigner();

    const network = await this.provider.getNetwork();
    Notification.register(network.chainId);
    this.network = network.name;
    console.log("network:", this.network);
    if (network.chainId === 9527) {
      this.network = 'rangersdev';
    }

    await this.provider.getBalance(this.account);

    try {
      this.protocolInfo = require(`../../networks/${this.network}`) as IProtocolInfo;
    } catch (error) {
      Notification.showErrorMessage(`Network error, [${this.network}] is not support. (${(error as any).message})`);
      return false;
    }

    this.protocol = new Contract(this.protocolInfo.contracts.Protocol, ProtocolAbi as any, this.signer);

    const interestRateModelAddress = await this.protocol.getInterestRateModelAddress();

    if (this.protocolInfo.contracts.LinearInterestRateModel && interestRateModelAddress.toLowerCase() === this.protocolInfo.contracts.LinearInterestRateModel.toLowerCase()) {
      this.interestRateModelType = InterestRateModelType.Linear;
      this.interestRateModel = new Contract(interestRateModelAddress, LinearInterestRateModelAbi as any, this.signer);
    } else if (this.protocolInfo.contracts.MappingInterestRateModel && interestRateModelAddress.toLowerCase() === this.protocolInfo.contracts.MappingInterestRateModel.toLowerCase()) {
      this.interestRateModelType = InterestRateModelType.Mapping;
      this.interestRateModel = new Contract(interestRateModelAddress, MappingInterestRateModelAbi as any, this.signer);
    } else {
      Notification.showErrorMessage("Interest Rate Model set error in network file");
      return false;
    }

    this.tokens = Object.getOwnPropertyNames(this.protocolInfo.tokens).map((t) => {
      const token = this.protocolInfo.tokens[t];

      return {
        name: t.toLowerCase(),
        address: token.address,
        contract: token.address === ETHAddress ? undefined : new Contract(token.address, ERC20Abi, this.signer),
      };
    });

    this.nativeEther = this.protocolInfo.tokens["ETH"];
    return true;
  }

  private initWallet() {
    let wallet = window.localStorage.getItem("wallet");
    switch (wallet) {
      case WalletType.MetaMask:
        this.wallet = WalletType.MetaMask;
        break;
      case WalletType.WalletConnect:
        this.wallet = WalletType.WalletConnect;
        break;
      default:
        this.wallet = WalletType.Disconnect;
        break;
    }
  }

  private async initProtocol() {
    await Promise.all(
      this.tokens.map(async (token) => {
        token.allowance = await token.contract?.allowance(this.account, this.protocol.address);
        token.balance = await token.contract?.balanceOf(this.account);
        token.decimals = await token.contract?.decimals();
        token.interestParams = this.interestRateModelType === InterestRateModelType.Linear ? await this.interestRateModel.getLoanParameters(token.address) : await this.interestRateModel.getAllRates(token.address);
        token.price = await this.protocol.getTokenPrice(token.address);
        token.minCollateralCoverageRatio = await this.initMinCollateralCoverageRatio(token.address);
      })
    );

    const enabledDepositTokens = await this.protocol.getDepositTokens();
    this.depositTokens = enabledDepositTokens.map((addr: string) => this.tokens.find((t: IToken) => t.address.toLowerCase() === addr.toLowerCase()));

    const eth = this.tokens.find((t) => t.name.toLowerCase() === "eth");
    if (eth) {
      eth.balance = await this.provider.getBalance(this.account);
      eth.decimals = 18;
      eth.allowance = MaxInt256;
    }

    const tokensByAddr = _.keyBy(this.tokens, 'address');
    const pairs = await this.protocol.getLoanAndCollateralTokenPairs();
    const loanPairsByLoanTokenAddr = pairs.reduce((res, pair) => {
      const loanToken = tokensByAddr[pair.loanTokenAddress];
      const collateralToken = tokensByAddr[pair.collateralTokenAddress];

      if (!res[loanToken.address]) {
        res[loanToken.address] = {
          loanToken,
          collateralTokens: [collateralToken],
          ...pair,
        }
      } else {
        res[loanToken.address].collateralTokens.push(collateralToken);
      }
      return res;
    }, {});
    this.loanPairs = Object.values(loanPairsByLoanTokenAddr);

    this.maxLoanTerm = await this.protocol.getMaxLoanTerm();
    this.depositTerms = await this.protocol.getDepositTerms();
    this.maxDistributorFeeRatios = await this.protocol.getMaxDistributorFeeRatios();
    this.protocolReserveRatio = await this.protocol.getProtocolReserveRatio();
  }

  private async initAccount() {
    this.balance = await this.provider.getBalance(this.account);
  }

  private async initMinCollateralCoverageRatio(tokenAddress: string) {
    const filter = await this.protocol.filters.SetLoanAndCollateralTokenPairSucceed();
    const loanEvents = await this.protocol.queryFilter(filter);
    for (let i = loanEvents.length - 1; i >= 0; i--) {
        if (loanEvents[i]?.args!.collateralTokenAddress.toLowerCase() === tokenAddress.toLowerCase()) {
            return loanEvents[i]?.args!.minCollateralCoverageRatio;
        }
    };
    return BigNumber.from("0");
  }

  private _homeVM?: HomeViewModel;
  get homeVM() {
    if (this._homeVM) {
      return this._homeVM;
    }

    if (!this.initFinished) return undefined;

    this._homeVM = new HomeViewModel({
      account: this.account,
      protocol: this.protocol,
      tokens: this.depositTokens,
      distributionFeeRatios: this.maxDistributorFeeRatios,
      protocolReserveRatio: this.protocolReserveRatio,
      interestRateModel: this.interestRateModel,
      interestRateModelType: this.interestRateModelType,
      locator: this,
    });

    return this._homeVM;
  }

  private _faucetVM?: FaucetViewModel;
  get faucetVM() {
    if (this._faucetVM) {
      return this._faucetVM;
    }

    if (!this.initFinished) return undefined;

    this._faucetVM = new FaucetViewModel({
      account: this.account,
      protocol: this.protocol,
      tokens: this.depositTokens,
      distributionFeeRatios: this.maxDistributorFeeRatios,
      protocolReserveRatio: this.protocolReserveRatio,
      interestRateModel: this.interestRateModel,
      interestRateModelType: this.interestRateModelType,
      locator: this,
    });

    return this._faucetVM;
  }

  private _lendVM?: DepositViewModel;
  get lendVM() {
    if (this._lendVM) {
      return this._lendVM;
    }

    if (!this.initFinished) return undefined;

    this._lendVM = new DepositViewModel({
      account: this.account,
      protocol: this.protocol,
      tokens: this.depositTokens,
      depositTerms: this.depositTerms,
      distributionFeeRatios: this.maxDistributorFeeRatios,
      protocolReserveRatio: this.protocolReserveRatio,
      interestRateModel: this.interestRateModel,
      interestRateModelType: this.interestRateModelType,
      locator: this,
    });

    return this._lendVM;
  }

  private _loanVM?: LoanViewModel;
  get loanVM() {
    if (this._loanVM) {
      return this._loanVM;
    }

    if (!this.depositTerms) return undefined;

    const maxTerm = this.depositTerms
      .map((t) => t.toNumber())
      .sort((a, b) => a - b)
    [this.depositTerms.length - 1];
    this._loanVM = new LoanViewModel({
      account: this.account,
      protocol: this.protocol,
      loanPairs: this.loanPairs,
      distributionFeeRatios: this.maxDistributorFeeRatios,
      protocolReserveRatio: this.protocolReserveRatio,
      maxTerm,
      interestRateModel: this.interestRateModel,
      interestRateModelType: this.interestRateModelType,
      tokens: this.tokens,
      locator: this,
    });
    return this._loanVM;
  }

  private _historyVM?: HistoryViewModel;
  get historyVM() {
    if (this._historyVM) return this._historyVM;

    if (!this.initFinished) return undefined;

    this._historyVM = new HistoryViewModel({
      account: this.account,
      protocol: this.protocol,
      distributionFeeRatios: this.maxDistributorFeeRatios,
      protocolReserveRatio: this.protocolReserveRatio,
      interestRateModel: this.interestRateModel,
      interestRateModelType: this.interestRateModelType,
      tokens: this.tokens,    // this.depositTokens
      locator: this,
    });
    return this._historyVM;
  }

  private _gatewayVM?: GatewayViewModel;
  get gatewayVM() {
    if (this._gatewayVM) return this._gatewayVM;

    if (!this.initFinished) return undefined;

    this._gatewayVM = new GatewayViewModel({
      account: this.account,
      protocol: this.protocol,
      distributionFeeRatios: this.maxDistributorFeeRatios,
      protocolReserveRatio: this.protocolReserveRatio,
      interestRateModel: this.interestRateModel,
      interestRateModelType: this.interestRateModelType,
      tokens: this.depositTokens,    
      locator: this,
    });
    return this._gatewayVM;
  }

  recordVM?: RecordViewModel;

  selectRecord(record: IRecordUI) {
    this.recordVM = new RecordViewModel({
      account: this.account,
      protocol: this.protocol,
      distributionFeeRatios: this.maxDistributorFeeRatios,
      protocolReserveRatio: this.protocolReserveRatio,
      interestRateModel: this.interestRateModel,
      interestRateModelType: this.interestRateModelType,
      tokens: this.tokens,    // this.depositTokens
      record,
      locator: this,
    });
  }

  selectRecordById(id: string) {
    this.recordVM = new RecordViewModel({
      account: this.account,
      protocol: this.protocol,
      distributionFeeRatios: this.maxDistributorFeeRatios,
      protocolReserveRatio: this.protocolReserveRatio,
      interestRateModel: this.interestRateModel,
      interestRateModelType: this.interestRateModelType,
      tokens: this.tokens,    // this.depositTokens
      locator: this,
      id,
    });
  }
}

export default ViewModelLocator.instance;

interface IProtocolInfo {
  contracts: {
    Protocol: string;
    LinearInterestRateModel: string;
    MappingInterestRateModel: string;
  };

  tokens: { [key: string]: IPlainToken };
}

interface IPlainToken {
  name: string;
  address: string;
  priceOracleAddress: string;
}
