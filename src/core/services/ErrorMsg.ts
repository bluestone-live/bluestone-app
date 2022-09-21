export class ErrorMsg {
    static filterRevertMsg(msg: string): string {
        let indexStart = msg.indexOf(`(reason="`);
        if (indexStart === -1) {
            return msg;
        }

        indexStart += 9;
        let indexEnd = msg.indexOf(`", method=`);
        return msg.slice(indexStart, indexEnd);
    }
}

export enum InputErrorMsg {
    NONE = "",
    VALUE_NOT_NUMBER = "Input value must be number.",
    VALUE_LESS_THAN_ZERO = "Input number be greater than 0.",
    VALUE_OVER_POOL_MAXIMUM = "Input value exceeds the maximum amount of pools.",
    VALUE_OVER_COLLATERAL_MAXIMUM = "Input value exceeds the total collateral.",
    VALUE_OVER_REMAINING_DEBT = "Input value exceeds the remaining debt.",
    VALUE_OVER_ACCOUNT_BALANCE = "Input value exceeds the balance of account.",
    COLLATERALIZATION_RATIO_TOO_LOW = "Collateralization Ratio is too low.",
}