import Notify, { API, CustomNotificationObject } from "bnc-notify";
// import { init, useNotifications } from '@web3-onboard/react'
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

const keys = ["7cc489c8-c528-4a91-b06d-86066dd8e4ca", "ec50d08d-a283-4f0f-a8b7-c2ca6b48843c"];
// init({
//   notify: {
//     transactionHandler: transaction => {
//       console.log({ transaction });
//       if (transaction.eventCode === 'txPool') {
//         return {
//           // autoDismiss set to zero will persist the notification until the user excuses it
//           autoDismiss: 0,
//           // message: `Your transaction is pending, click <a href="https://rinkeby.etherscan.io/tx/${transaction.hash}" rel="noopener noreferrer" target="_blank">here</a> for more info.`,
//           // or you could use onClick for when someone clicks on the notification itself
//           onClick: () => window.open(`https://rinkeby.etherscan.io/tx/${transaction.hash}`)
//         };
//       }
//     }
//   },
//   wallets: [],
//   chains: []
// })

// const [notifications, customNotification, updateNotify] = useNotifications();

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
  
  static showErrorMessage(msgStr: string) {
    const notificationObject = {
      type: "error",
      autoDismiss: 10000,
      message: msgStr,
    } as CustomNotificationObject;
    
    Notification.notify.notification(notificationObject)
  }
}
