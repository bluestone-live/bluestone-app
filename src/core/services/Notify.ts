import Notify, { API } from "bnc-notify";

const keys = ["7cc489c8-c528-4a91-b06d-86066dd8e4ca", "ec50d08d-a283-4f0f-a8b7-c2ca6b48843c"];

export default class Notification {
  static notify: API;

  static register(networkId: number) {
    Notification.notify = Notify({
      dappId: keys[Date.now() % 2], // [String] The API key created by step one above
      networkId, // [Integer] The Ethereum network ID your Dapp uses.
    });

    this.notify.config({ desktopPosition: "topRight", mobilePosition: "top" });
  }

  static track(hash: string) {
    Notification.notify.hash(hash);
  }
}
