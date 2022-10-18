import { BigNumber, ethers, utils } from "ethers";
import { DistributorAddress, ETHAddress } from "../services/Constants";
import type { ILoanPair, IPool, IToken, IViewModel } from "./Types";
import { InterestRateModelType } from "./Types";
import { computed, observable } from "mobx";

import BaseViewModel from "./BaseViewModel";
import Notification from "../services/Notify";
import { calcCollateralRatio } from "../services/Math";
import { checkNumber } from "../services/InputChecker";
import dayjs from "dayjs";
import history from "../services/History";
import { ErrorMsg, InputErrorMsg } from "../services/ErrorMsg";

interface ILoanViewModel extends IViewModel {
  loanPairs: ILoanPair[];
  maxTerm: number;
}

export default class LoanViewModel extends BaseViewModel {
  private params: ILoanViewModel;

  @observable interestRateModelType: InterestRateModelType;
  @observable loading = false;
  @observable term = 0;
  @observable apr = 0;
  @observable interest = 0;
  @observable debt = 0;
  @observable collateralization = 0;
  @observable maturityDate = dayjs().format("YYYY-MM-DD");
  @observable currentLoanPair!: ILoanPair;
  @observable selectedCollateralToken!: IToken;
  @observable loanTokens: string[];
  @observable collateralTokens!: string[];
  @observable selectedPool?: IPool;
  @observable inputLoanValue?: string;
  @observable inputLoanValueLegal?: boolean;
  @observable inputCollateralValue?: string;
  @observable inputCollateralValueLegal?: boolean;
  @observable loanValueErrorMsg?: string;
  @observable collateralValueErrorMsg?: string;
  @observable sending = false;
  @observable maxCollateralAmount?: string;
  @observable maxLoanAmount?: string;

  @computed get loanToken() {
    return this.currentLoanPair?.loanToken;
  }

  private selectedDate?: Date;
  private peekPool?: IPool;

  constructor(params: ILoanViewModel) {
    super(params);

    this.params = params;

    this.interestRateModelType = params.interestRateModelType;

    this.maxDate.setDate(new Date().getDate() + params.maxTerm);

    this.loanTokens = params.loanPairs.map((p) => p.loanToken.name);

    this.selectLoanToken(params.loanPairs[0].loanToken.name);

    this.now = dayjs().add(0, "d").hour(0).minute(0).second(0).toDate();
  }

  selectLoanToken = async (name: string) => {
    this.currentLoanPair = this.params.loanPairs.find(
      (p) => p.loanToken.name.toLowerCase() === name.toLowerCase()
    )!;

    this.selectCollateralToken(this.currentLoanPair.collateralTokens[0].name);

    if (this.currentLoanPair.loanToken.pools) return;
    this.loading = true;

    this.currentLoanPair.loanToken.pools = await this.tokenPool.getPools(this.currentLoanPair.loanToken.address);

    this.collateralTokens = this.currentLoanPair.collateralTokens.map((t) => t.name);

    this.loading = false;
  };

  selectCollateralToken = (name: string) => {
    this.selectedCollateralToken =
      this.currentLoanPair.collateralTokens.find((t) => t.name.toLowerCase() === name.toLowerCase()) || this.selectedCollateralToken;

    let max = this.selectedCollateralToken.balance!;
    const gasFee = utils.parseEther("0.05");
    if (this.selectedCollateralToken.address === ETHAddress && max.gt(gasFee)) {
      max = max.sub(gasFee);
    }

    this.maxCollateralAmount = utils.formatUnits(max, this.selectedCollateralToken.decimals!);
  };

  peekTerm = (date: Date) => {
    if (this.minDate === date) return;
    const term = dayjs(date).diff(this.now, "d");
    const accurate = dayjs(date).diff(this.now, "minute");

    const loanToken = this.currentLoanPair.loanToken;
    const targetPool = loanToken.pools?.[term];
    this.peekPool = targetPool;

    const remaining = loanToken.pools?.slice(term);

    const maxloan = remaining?.reduce((p, c) => p.add(c.availableAmount), BigNumber.from(0)) ?? BigNumber.from(0);
    this.maxLoanAmount = utils.formatUnits(maxloan, loanToken.decimals);

    this.term = accurate > 0 ? targetPool?.term ?? 0 : 0;
    this.apr = targetPool?.loanAPR ?? 0;

    this.maturityDate = dayjs(date).hour(dayjs().hour()).minute(dayjs().minute()).format("YYYY-MM-DD HH:mm");

    this.inputLoan(this.inputLoanValue);

    return targetPool;
  };

  selectTerm = (date: Date) => {
    this.selectedDate = date;
    const targetPool = this.peekTerm(date);
    this.selectedPool = targetPool;

    this.inputLoan(this.inputLoanValue);
  };

  restoreTerm = () => {
    if (this.selectedDate) {
      this.peekTerm(this.selectedDate);
    }
  };

  inputLoan = (value?: string) => {
    if (!value) return;
    this.inputLoanValue = value;

    if (checkNumber(value)) {
      if (Number.parseFloat(value) > 0) {
        if (Number.parseFloat(value) <= Number.parseFloat(this.maxLoanAmount ?? "")) {
          this.inputLoanValueLegal = true;
          this.loanValueErrorMsg = InputErrorMsg.NONE;
        } else {
          this.inputLoanValueLegal = false;
          this.loanValueErrorMsg = InputErrorMsg.VALUE_OVER_POOL_MAXIMUM;
        }
      } else {
        this.inputLoanValueLegal = false;
        this.loanValueErrorMsg = InputErrorMsg.VALUE_LESS_THAN_ZERO;
      }
    } else {
      this.inputLoanValueLegal = false;
      this.loanValueErrorMsg = InputErrorMsg.VALUE_NOT_NUMBER;
    }

    if (!this.peekPool) return;
    if(this.interestRateModelType === InterestRateModelType.Linear) {
      this.debt = Number.parseFloat(value) * (1 + (this.peekPool.loanAPR / 365) * this.peekPool.term);
    } else if(this.interestRateModelType === InterestRateModelType.Mapping) {
      this.debt = Number.parseFloat(value) * (1 + this.peekPool.loanAPR);
    }
    this.interest = this.debt - Number.parseFloat(value);

    this.inputCollateral(this.inputCollateralValue);
  };

  inputCollateral = (value?: string) => {
    if (!value) {
      this.collateralization = 0;
      return;
    }

    this.inputCollateralValue = value;

    if (checkNumber(value)) {
      if (Number.parseFloat(value) > 0) {
        if (utils.parseUnits(value, this.selectedCollateralToken.decimals).lte(this.selectedCollateralToken.balance || BigNumber.from("0"))) {
          this.inputCollateralValueLegal = true;
          this.collateralValueErrorMsg = InputErrorMsg.NONE;
        } else {
          this.inputCollateralValueLegal = false;
          this.collateralValueErrorMsg = InputErrorMsg.VALUE_OVER_ACCOUNT_BALANCE;
        }
      } else {
        this.inputCollateralValueLegal = false;
        this.collateralValueErrorMsg = InputErrorMsg.VALUE_LESS_THAN_ZERO;
      }
    } else {
      this.inputCollateralValueLegal = false;
      this.collateralValueErrorMsg = InputErrorMsg.VALUE_NOT_NUMBER;
    }

    if (!value || !this.inputLoanValue) {
      this.collateralization = 0;
      return;
    }

    this.collateralization = calcCollateralRatio(
      value,
      `${this.debt || 1}`,
      this.selectedCollateralToken.price!,
      this.currentLoanPair.loanToken.price!
    );


    if (this.collateralization < this.currentLoanPair.minCollateralCoverageRatio.div(BigNumber.from(10).pow(16)).toNumber()) {
      this.inputCollateralValueLegal = false;
      this.collateralValueErrorMsg = InputErrorMsg.COLLATERALIZATION_RATIO_TOO_LOW;
    }
  };

  loan = async () => {
    const { protocol } = this.params;

    try {
      this.sending = true;

      const loanToken = this.currentLoanPair.loanToken;
      const loanAmount = ethers.utils.parseUnits(this.inputLoanValue!, loanToken.decimals);
      const collateralToken = this.selectedCollateralToken;
      const isEtherCollateral = collateralToken.address === ETHAddress;
      const collateralAmount = ethers.utils.parseUnits(this.inputCollateralValue!, collateralToken.decimals).toString();
      const tokenWei = ethers.utils.parseUnits(this.inputLoanValue ?? "0", loanToken.decimals).toString();

      if (!collateralToken.allowance?.gte(tokenWei)) {
        const appTx = await collateralToken.contract?.approve(protocol.address, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

        Notification.track(appTx.hash);

        await appTx.wait();
        collateralToken.allowance = BigNumber.from("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
      }

      const tx = await protocol.loan(
        loanToken.address,
        collateralToken.address,
        loanAmount.toString(),
        collateralAmount,
        this.selectedPool!.term.toString(),
        DistributorAddress,
        {
          value: isEtherCollateral ? collateralAmount : "0",
        }
      );

      Notification.track(tx.hash);
      const receipt = await tx.wait();

      const event = receipt.events.find((e) => e.event === "LoanSucceed");
      const id = event.args.recordId;

      this.locator.selectRecordById(id);
      history.push(`/record/${id}`);
    } catch (error) {
      Notification.showErrorMessage(ErrorMsg.filterRevertMsg((error as any).message));
    } finally {
      this.sending = false;
    }
  };
}
