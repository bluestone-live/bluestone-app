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
    VALUE_NOT_NUMBER = "Must be number.",
    VALUE_LESS_THAN_ZERO = "Must be greater than 0.",
    VALUE_OVER_MAXIMUM = "Exceeds the maximum amount.",
    VALUE_OVER_POOL_MAXIMUM = "Exceeds the maximum amount of pools.",
    VALUE_OVER_COLLATERAL_MAXIMUM = "Exceeds the total collateral.",
    VALUE_OVER_REMAINING_DEBT = "Exceeds the remaining debt.",
    VALUE_OVER_ACCOUNT_BALANCE = "Exceeds the balance of account.",
    COLLATERALIZATION_RATIO_TOO_LOW = "Collateralization Ratio is too low.",
}