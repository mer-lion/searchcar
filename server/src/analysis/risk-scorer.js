const EXPECTED_KM_PER_YEAR = 15_000;

export function calculateMileageAgeConsistency(mileage, modelYear, currentYear) {
  const age = Math.max(1, currentYear - modelYear);
  const expectedKm = age * EXPECTED_KM_PER_YEAR;
  const ratio = mileage / expectedKm;
  if (ratio <= 1.2) return 90;
  if (ratio <= 1.5) return 70;
  if (ratio <= 2.0) return 50;
  if (ratio <= 3.0) return 30;
  return 10;
}

const DAMAGE_SCORES = {
  Belirtilmemiş: 0,
  "Tramer Kaydı Yok": 0,
  Boyalı: 30,
  "Lokal Boyalı": 20,
  Değişen: 50,
  "Ağır Hasar Kayıtlı": 90,
};

export function calculateDamageRisk(damageRecord) {
  if (!damageRecord) return 0;
  return DAMAGE_SCORES[damageRecord] ?? 40;
}

export function calculateSellerReliability(sellerType) {
  if (sellerType === "sahibinden") return 70;
  if (sellerType === "galeri") return 50;
  return 40;
}

const POPULAR_BRANDS = {
  Volkswagen: 80, Toyota: 85, Honda: 80, Hyundai: 75,
  Renault: 70, Fiat: 70, Ford: 70, BMW: 65,
  "Mercedes - Benz": 65, Audi: 60, Opel: 65, Skoda: 70,
  Dacia: 65, Peugeot: 60, Citroen: 55, Kia: 70, Nissan: 60,
};

export function calculateLiquidityScore(brand, model) {
  return POPULAR_BRANDS[brand] ?? 35;
}

export function getRiskLevel(damageRisk) {
  if (damageRisk <= 30) return "DÜŞÜK";
  if (damageRisk <= 60) return "ORTA";
  return "YÜKSEK";
}
