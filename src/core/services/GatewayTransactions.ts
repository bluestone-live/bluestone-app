import { Event, utils } from "ethers";

import { IToken } from "../viewmodels/Types";
import dayjs from "dayjs";
import { ZeroAddress } from "./Constants";

enum Action {
    Unknown = "Unknown",
    Buy = "Buy",
    Sell = "Sell"
}

enum Status {
    Pending = "Pending",
    Succeed = "Succeed",
    Failed = "Failed"
}

export interface HistoryGatewayTx extends Event {
  time: string;
  action: Action;
  token?: IToken;
  amount?: string;
  status?: Status;
}

export default class GatewayTransactions {
  private async fetchGatewayTxs(token: IToken, account: string, gatewayAddress: string) {
    const mintToAccount = token.contract?.filters.Transfer(ZeroAddress, account);
    const transferToGateway = token.contract?.filters.Transfer(account, gatewayAddress);

    const events = [
      mintToAccount,
      transferToGateway
    ];

    const txs = (await Promise.all(events.map((f) => token.contract?.queryFilter(f!)))).flat();

    return Promise.all(
      txs.map(async (tx) => {
        const timestamp = (await tx!.getBlock()).timestamp;
        const amount = tx!.args?.value;
        let action: Action;
        if(tx?.args?.from.toLowerCase() === account.toLowerCase()) {
            action = Action.Sell;
        } else if (tx?.args?.to.toLowerCase() === account.toLowerCase()) {
            action = Action.Buy;
        } else {
            action = Action.Unknown;
        }

        return {
          ...tx,
          time: dayjs
            .utc(timestamp * 1000)
            .local()
            .format("YYYY-MM-DD HH:mm"),
          token,
          action,
          amount: utils.formatUnits(amount, token.decimals),
          status: Status.Succeed,
        } as HistoryGatewayTx;
      })
    );
  }

  async queryGatewayHistory(token: IToken, account: string, gatewayAddress: string) {
    const gatewayTxs = await this.fetchGatewayTxs(token, account, gatewayAddress);
    return gatewayTxs.sort((t1, t2) => t2.blockNumber - t1.blockNumber);
  }
}
