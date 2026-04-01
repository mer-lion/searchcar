export function calculateMarketValue(listings) {
  if (listings.length === 0) return 0;
  const sorted = listings.map((l) => l.price).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

export function adjustForMileage(baseValue, listingMileage, averageMileage) {
  if (averageMileage === 0) return baseValue;
  const mileageDiffPercent = (listingMileage - averageMileage) / averageMileage;
  const priceAdjustPercent = mileageDiffPercent * -0.5;
  return Math.round(baseValue * (1 + priceAdjustPercent));
}

const LOCATION_PREMIUMS = {
  İstanbul: 0.07,
  Ankara: 0.05,
  İzmir: 0.03,
};

export function adjustForLocation(baseValue, city) {
  const premium = LOCATION_PREMIUMS[city] || 0;
  return Math.round(baseValue * (1 + premium));
}
