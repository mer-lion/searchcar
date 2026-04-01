import { supabase } from "../db/supabase.js";
import { calculateMarketValue, adjustForMileage, adjustForLocation } from "./price-analyzer.js";
import { calculateProfitScore, getDecision } from "./profit-calculator.js";
import {
  calculateMileageAgeConsistency,
  calculateDamageRisk,
  calculateSellerReliability,
  calculateLiquidityScore,
  getRiskLevel,
} from "./risk-scorer.js";

const CURRENT_YEAR = new Date().getFullYear();

async function getComparables(brand, model, year) {
  const { data } = await supabase
    .from("listings")
    .select("price, mileage, location_city")
    .eq("brand", brand)
    .eq("model", model)
    .gte("year", year - 1)
    .lte("year", year + 1)
    .eq("is_active", true);

  return data || [];
}

export async function analyzeListing(listing) {
  const comparables = await getComparables(listing.brand, listing.model, listing.year);

  let marketValue = calculateMarketValue(comparables);
  if (marketValue === 0) marketValue = listing.price;

  const avgMileage =
    comparables.length > 0
      ? Math.round(comparables.reduce((sum, l) => sum + (l.mileage || 0), 0) / comparables.length)
      : listing.mileage;

  marketValue = adjustForMileage(marketValue, listing.mileage, avgMileage);
  marketValue = adjustForLocation(marketValue, listing.location_city);

  const mileageAgeConsistency = calculateMileageAgeConsistency(
    listing.mileage,
    listing.year,
    CURRENT_YEAR
  );
  const damageRisk = calculateDamageRisk(listing.damage_record);
  const sellerReliability = calculateSellerReliability(listing.seller_type);
  const liquidityScore = calculateLiquidityScore(listing.brand, listing.model);

  const priceDiffPercent =
    marketValue > 0 ? ((listing.price - marketValue) / marketValue) * 100 : 0;

  const confidenceScore = calculateProfitScore({
    priceDiffPercent,
    liquidityScore,
    mileageAgeConsistency,
    damageRisk,
    sellerReliability,
  });

  const estimatedProfit = marketValue - listing.price;
  const decision = getDecision(confidenceScore);
  const riskLevel = getRiskLevel(damageRisk);

  return {
    listing_id: listing.id,
    decision,
    confidence_score: confidenceScore,
    market_value: marketValue,
    estimated_profit: estimatedProfit,
    risk_level: riskLevel,
    factors: {
      priceDiffPercent: Math.round(priceDiffPercent),
      liquidityScore,
      mileageAgeConsistency,
      damageRisk,
      sellerReliability,
      comparableCount: comparables.length,
    },
  };
}

export async function analyzeAllNewListings() {
  const { data: listings } = await supabase
    .from("listings")
    .select("*")
    .eq("is_active", true)
    .order("scraped_at", { ascending: false })
    .limit(500);

  if (!listings || listings.length === 0) return [];

  const buyOpportunities = [];

  for (const listing of listings) {
    const result = await analyzeListing(listing);

    await supabase.from("analysis_results").upsert(
      { ...result, analyzed_at: new Date().toISOString() },
      { onConflict: "listing_id" }
    );

    if (result.decision === "AL") {
      buyOpportunities.push({ listing, analysis: result });
    }
  }

  return buyOpportunities;
}
