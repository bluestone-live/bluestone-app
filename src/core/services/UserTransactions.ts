import { Contract, Event, utils } from "ethers";

import { IToken } from "../viewmodels/Types";
import dayjs from "dayjs";

export interface HistoryTx extends Event {
  time: string;
  token?: IToken;
  amount?: string;
}

export default class UserTransactions {
  protocol: Contract;
  tokens: IToken[];

  constructor(params: { protocol: Contract; tokens: IToken[] }) {
    this.protocol = params.protocol;
    this.tokens = params.tokens;
  }

  private async fetchTxs(account: string) {
    const loan = this.protocol.filters.LoanSucceed(account);
    const repayLoan = this.protocol.filters.RepayLoanSucceed(account);
    const addCollateralSucceed = this.protocol.filters.AddCollateralSucceed(account);
    const subtractCollateralSucceed = this.protocol.filters.SubtractCollateralSucceed(account);
    const deposit = this.protocol.filters.DepositSucceed(account);
    const withdrawSucceed = this.protocol.filters.WithdrawSucceed(account);
    const earlyWithdrawSucceed = this.protocol.filters.EarlyWithdrawSucceed(account);
    const liquidateLoanSucceed = this.protocol.filters.LiquidateLoanSucceed(account);

    const events = [
      loan,
      repayLoan,
      addCollateralSucceed,
      subtractCollateralSucceed,
      deposit,
      withdrawSucceed,
      earlyWithdrawSucceed,
      liquidateLoanSucceed,
    ];

    const addressMap = new Map([
      ["LoanSucceed", "loanTokenAddress"],
      ["RepayLoanSucceed", "loanTokenAddress"],
      ["AddCollateralSucceed", "collateralTokenAddress"],
      ["SubtractCollateralSucceed", "collateralTokenAddress"],
      ["DepositSucceed", "depositTokenAddress"],
      ["WithdrawSucceed", "depositTokenAddress"],
      ["EarlyWithdrawSucceed", "depositTokenAddress"],
      ["LiquidateLoanSucceed", "loanTokenAddress"],
    ]);

    const amountMap = new Map([
      ["LoanSucceed", "loanAmount"],
      ["RepayLoanSucceed", "repayAmount"],
      ["AddCollateralSucceed", "collateralAmount"],
      ["SubtractCollateralSucceed", "collateralAmount"],
      ["DepositSucceed", "amount"],
      ["WithdrawSucceed", "amount"],
      ["EarlyWithdrawSucceed", "amount"],
      ["LiquidateLoanSucceed", "liquidateAmount"],
    ]);

    const txs = (await Promise.all(events.map((f) => this.protocol.queryFilter(f)))).flat();
    return Promise.all(
      txs.map(async (tx) => {
        const tokenAddress = tx.args?.[addressMap.get(tx.event!) || ""];
        const timestamp = (await tx.getBlock()).timestamp;
        const token = this.tokens.find((t) => t.address.toLowerCase() === tokenAddress.toLowerCase());
        const amount = tx.args?.[amountMap.get(tx.event!) || "0"];

        return {
          ...tx,
          time: dayjs
            .utc(timestamp * 1000)
            .local()
            .format("YYYY-MM-DD HH:mm"),
          token,
          amount: utils.formatUnits(amount, token?.decimals),
        } as HistoryTx;
      })
    );
  }

  async queryHistory(account: string, recordId: string) {
    const txs = await this.fetchTxs(account);
    const filtered = txs.filter((f) => f.args?.recordId === recordId);

    return filtered.sort((t1, t2) => t2.blockNumber - t1.blockNumber);
  }
}
