import { BigNumber, utils } from "ethers";

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
