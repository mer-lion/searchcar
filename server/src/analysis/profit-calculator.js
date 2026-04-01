const WEIGHTS = {
  priceBelow: 0.4,
  liquidity: 0.25,
  mileageAge: 0.15,
  damage: 0.1,
  seller: 0.1,
};

export function calculateProfitScore({
  priceDiffPercent,
  liquidityScore,
  mileageAgeConsistency,
  damageRisk,
  sellerReliability,
}) {
  const priceBelowScore = Math.min(100, Math.max(0, priceDiffPercent * -2));
  const damageScore = 100 - damageRisk;

  const raw =
    priceBelowScore * WEIGHTS.priceBelow +
    liquidityScore * WEIGHTS.liquidity +
    mileageAgeConsistency * WEIGHTS.mileageAge +
    damageScore * WEIGHTS.damage +
    sellerReliability * WEIGHTS.seller;

  return Math.round(Math.min(100, Math.max(0, raw)));
}

export function getDecision(score) {
  if (score >= 65) return "AL";
  if (score >= 40) return "DÜŞÜN";
  return "REDDET";
}
