import { BigNumber, utils } from "ethers";
import dayjs from "dayjs";

export function calcCollateralRatio(
  collateralAmount: string,
  debt: string,
  collateralPrice: BigNumber,
  loanPrice: BigNumber
) {
  
  const ratio =
    ((Number.parseFloat(collateralAmount) * Number.parseFloat(utils.formatUnits(collateralPrice, 18))) /
      Number.parseFloat(utils.formatUnits(loanPrice, 18)) /
      Number.parseFloat(debt)) *
    100;

  return ratio;
}

export function calcCollateralAmount(
  collateralRatio: string,
  debt: string,
  collateralPrice: BigNumber,
  loanPrice: BigNumber
) {
  const amount = BigNumber.from(collateralRatio).mul(BigNumber.from(debt)).mul(loanPrice).div(collateralPrice);

  return amount;
}

export const getCurrentPoolId = () => getPoolIdByTimestamp(new Date().valueOf());

export const getPoolIdByTimestamp = (timestamp: number) => Math.floor(timestamp / 1000 / 3600 / 24);

export const getTimestampByPoolId = (poolId: string) =>
  dayjs
    .utc(Number.parseInt(poolId, 10) * 3600 * 1000 * 24)
    .endOf("day")
    .local()
    .valueOf();
