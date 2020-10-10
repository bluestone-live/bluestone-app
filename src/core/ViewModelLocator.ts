import { Metamask } from "ethpay.core";
import ethers, { BigNumber, Contract } from "ethers";
import { abi as ProtocolAbi } from "../contracts/Protocol.json";
import { abi as ERC20Abi } from "../contracts/ERC20.json";
import { abi as InterestModelAbi } from "../contracts/InterestModel.json";
import { IDistributionFeeRatios, ILoanPair, IToken } from "./viewmodels/Types";
import DepositViewModel from "./viewmodels/DepositViewModel";
import LoanViewModel from "./viewmodels/LoanViewModel";
import { EventEmitter } from "events";
import { ETHAddress, MaxInt256 } from "./services/Constants";

export class ViewModelLocator extends EventEmitter {
  static readonly instance = new ViewModelLocator();

  private provider!: ethers.providers.Web3Provider;
  private signer!: ethers.providers.JsonRpcSigner;
  private initialized = false;

  initFinished = false;

  account!: string;
  balance!: BigNumber;
  protocolInfo!: IProtocolInfo;
  protocol!: Contract;
  interestModel!: Contract;
  nativeEther!: IPlainToken;
  depositTokens!: IToken[];
  loanPairs!: ILoanPair[];
  maxLoanTerm!: BigNumber;
  depositTerms!: BigNumber[];

  maxDistributorFeeRatios!: IDistributionFeeRatios;
  protocolReserveRatio!: BigNumber;

  private async watchAccount() {
    const provider = await Metamask.getProvider();
    if (!provider) return;

    provider.on("accountsChanged", (_) => {
      this.initialized = false;
      this.init();
    });
  }

  async init() {
    if (this.initialized) return true;
    if (!(await this.initApp())) return false;

    this.initialized = true;

    await this.initProtocol();
    await this.watchAccount();
    await this.initAccount();

    this.initFinished = true;
    super.emit("init");

    return true;
  }

  private async initApp() {
    const [account] = await Metamask.enable();
    if (!account) return false;
    this.account = account;

    this.provider = new ethers.providers.Web3Provider(window["ethereum"]);
    this.signer = this.provider.getSigner();

    await this.provider.getBalance(account);

    try {
      this.protocolInfo = require(`../../networks/${this.provider.network.name}`) as IProtocolInfo;
    } catch (error) {
      return false;
    }

    this.protocol = new Contract(this.protocolInfo.contracts.Protocol, ProtocolAbi as any, this.signer);

    this.interestModel = new Contract(this.protocolInfo.contracts.InterestModel, InterestModelAbi as any, this.signer);

    this.depositTokens = Object.getOwnPropertyNames(this.protocolInfo.tokens).map((t) => {
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

  private async initProtocol() {
    const enabledDepositTokens = await this.protocol.getDepositTokens();
    this.depositTokens = enabledDepositTokens.map((addr) =>
      this.depositTokens.find((t) => t.address.toLowerCase() === addr.toLowerCase())
    );

    Promise.all(
      this.depositTokens.map(async (token) => {
        token.allowance = await token.contract?.allowance(this.account, this.protocol.address);
        token.balance = await token.contract?.balanceOf(this.account);
        token.decimals = await token.contract?.decimals();
        token.interestParams = await this.interestModel.getLoanParameters(token.address);
        token.price = await this.protocol.getTokenPrice(token.address);
      })
    );

    const eth = this.depositTokens.find((t) => t.name.toLowerCase() === "eth");
    if (eth) {
      eth.balance = await this.provider.getBalance(this.account);
      eth.decimals = 18;
      eth.allowance = MaxInt256;
    }

    console.log(this.depositTokens);

    const pairs = await this.protocol.getLoanAndCollateralTokenPairs();
    const loanPairs: any[] = [];

    for (let p of pairs) {
      // Remove duplicate loan tokens
      if (loanPairs.find((lp) => lp.loanTokenAddress === p.loanTokenAddress)) continue;
      loanPairs.push(p);
    }

    this.loanPairs = loanPairs.map((p) => {
      return {
        loanToken: this.depositTokens.find((t) => t.address.toLowerCase() === p.loanTokenAddress.toLowerCase()),
        collateralTokens: this.depositTokens.filter(
          (t) => t.address.toLowerCase() === p.collateralTokenAddress.toLowerCase()
        ),
        ...p,
      };
    });

    console.log(this.loanPairs);

    this.maxLoanTerm = await this.protocol.getMaxLoanTerm();
    this.depositTerms = await this.protocol.getDepositTerms();
    this.maxDistributorFeeRatios = await this.protocol.getMaxDistributorFeeRatios();
    this.protocolReserveRatio = await this.protocol.getProtocolReserveRatio();
  }

  private async initAccount() {
    this.balance = await this.provider.getBalance(this.account);
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
      interestModel: this.interestModel,
    });

    return this._lendVM;
  }

  private _loanVM?: LoanViewModel;
  get loanVM() {
    if (this._loanVM) {
      return this._loanVM;
    }

    if (!this.depositTerms) return undefined;

    const maxTerm = this.depositTerms.map((t) => t.toNumber()).sort()[this.depositTerms.length - 1];
    this._loanVM = new LoanViewModel({
      account: this.account,
      protocol: this.protocol,
      loanPairs: this.loanPairs,
      distributionFeeRatios: this.maxDistributorFeeRatios,
      protocolReserveRatio: this.protocolReserveRatio,
      maxTerm: maxTerm,
      interestModel: this.interestModel,
    });
    return this._loanVM;
  }
}

export default ViewModelLocator.instance;

interface IProtocolInfo {
  contracts: {
    Protocol: string;
    InterestModel: string;
  };

  tokens: { [key: string]: IPlainToken };
}

interface IPlainToken {
  name: string;
  address: string;
  priceOracleAddress: string;
}
