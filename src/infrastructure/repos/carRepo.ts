import { prisma } from "@/src/infrastructure/db/prisma";
import type { CarForScoring } from "@/src/domain/recommendation/types";

function parseFeatures(raw: string | null): string[] | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return undefined;
  }
}

export async function getAllCarsForScoring(): Promise<CarForScoring[]> {
  const cars = await prisma.car.findMany({ include: { specs: true } });
  return cars.map((car) => ({
    id: car.id,
    make: car.make,
    model: car.model,
    variant: car.variant,
    bodyType: car.bodyType,
    exShowroomPrice: car.exShowroomPrice,
    safetyRating: car.safetyRating,
    mileageKmpl: car.mileageKmpl,
    familySuitability: car.familySuitability,
    valueForMoney: car.valueForMoney,
    maintenanceCost: car.maintenanceCost,
    resaleScore: car.resaleScore,
    availabilityScore: car.availabilityScore,
    featureVector: parseFeatures(car.featureVector),
    specs: car.specs,
  }));
}
