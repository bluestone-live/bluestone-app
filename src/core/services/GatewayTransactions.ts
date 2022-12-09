import { Event, utils } from "ethers";

import { IToken } from "../viewmodels/Types";
import dayjs from "dayjs";
import { ZeroAddress } from "./Constants";

export enum Action {
  Unknown = "Unknown",
  ConvertToSGC = "Fiat to SGC",
  ConvertToFiat = "SGC to Fiat"
}

// export enum Status {
//   Succeed = "Succeed",
//   Failed = "Failed",
// }

export enum Status {
  None = -1,
  Transfering = 0,
  Verifying = 1,
  Executing = 2,
  Succeed = 3,
  Failed = 4,
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
        let status: Status;
        if (tx?.args?.from.toLowerCase() === account.toLowerCase()) {
          action = Action.ConvertToFiat;
          status = await this.getGatewayRedeemStatus(account, tx?.transactionHash);
        } else if (tx?.args?.to.toLowerCase() === account.toLowerCase()) {
          action = Action.ConvertToSGC;
          status = await this.getGatewayBuyStatus(account);
        } else {
          action = Action.Unknown;
          status = Status.Failed;
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
          status,
        } as HistoryGatewayTx;
      })
    );
  }

  async getGatewayBuyStatus(account: string) {
    // TODO
    return Status.Succeed;
  }

  async getGatewayRedeemStatus(account: string, transactionHash: string) {
    //TODO
    return Status.Succeed;
  }

  async queryGatewayHistory(token: IToken, account: string, gatewayAddress: string) {
    const gatewayTxs = await this.fetchGatewayTxs(token, account, gatewayAddress);
    return gatewayTxs.sort((t1, t2) => t2.blockNumber - t1.blockNumber);
  }
}
