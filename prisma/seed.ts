import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MAKES = [
  { make: "Maruti", models: ["Swift", "Brezza", "Ertiga", "Fronx"] },
  { make: "Hyundai", models: ["i20", "Creta", "Verna", "Alcazar"] },
  { make: "Tata", models: ["Nexon", "Punch", "Harrier", "Safari"] },
  { make: "Mahindra", models: ["XUV300", "Scorpio-N", "XUV700", "Thar"] },
  { make: "Kia", models: ["Sonet", "Seltos", "Carens", "EV6"] },
  { make: "Honda", models: ["Amaze", "City", "Elevate", "WR-V"] },
  { make: "Toyota", models: ["Glanza", "Urban Cruiser", "Innova", "Fortuner"] },
  { make: "MG", models: ["Comet", "Astor", "Hector", "ZS EV"] },
];

const BODY_TYPES = ["hatchback", "sedan", "suv"] as const;
const FUEL_TYPES = ["petrol", "diesel", "electric", "cng"] as const;
const TRANSMISSIONS = ["manual", "automatic"] as const;

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const rand = seededRandom(42);

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function range(min: number, max: number): number {
  return min + rand() * (max - min);
}

function intRange(min: number, max: number): number {
  return Math.round(range(min, max));
}

interface CarSeed {
  make: string;
  model: string;
  variant: string;
  bodyType: string;
  exShowroomPrice: number;
  safetyRating: number;
  mileageKmpl: number;
  familySuitability: number;
  valueForMoney: number;
  maintenanceCost: number;
  resaleScore: number;
  availabilityScore: number;
  featureVector: string[];
  specs: {
    engineCc: number;
    powerBhp: number;
    torqueNm: number;
    transmission: string;
    fuelType: string;
    seating: number;
    bootSpaceL: number;
    airbags: number;
    adasLevel: number;
    ncapRating: number;
  };
}

function generateCar(index: number): CarSeed {
  const brand = pick(MAKES);
  const model = pick(brand.models);
  const bodyType = pick(BODY_TYPES);
  const fuelType = pick(FUEL_TYPES);
  const transmission = pick(TRANSMISSIONS);

  const segmentMultiplier =
    bodyType === "hatchback" ? 0.7 : bodyType === "sedan" ? 1 : 1.25;
  const basePrice =
    bodyType === "hatchback"
      ? range(500000, 1200000)
      : bodyType === "sedan"
        ? range(900000, 2200000)
        : range(1100000, 3500000);

  let exShowroomPrice = Math.round(basePrice * segmentMultiplier);
  if (bodyType === "suv" && exShowroomPrice > 2000000) {
    exShowroomPrice = Math.round(exShowroomPrice * 0.75);
  }
  const isEv = fuelType === "electric";
  const mileageKmpl = isEv
    ? range(12, 18)
    : fuelType === "diesel"
      ? range(18, 26)
      : range(14, 22);

  const seating = bodyType === "suv" && rand() > 0.7 ? 7 : bodyType === "suv" ? 5 : 5;
  const bootSpaceL =
    bodyType === "hatchback"
      ? intRange(268, 380)
      : bodyType === "sedan"
        ? intRange(420, 520)
        : intRange(433, 700);

  const safetyRating = range(0.55, 0.95);
  const ncapRating = range(3, 5);
  const airbags = intRange(2, 6);
  const adasLevel = rand() > 0.6 ? intRange(1, 2) : 0;

  const familySuitability =
    seating >= 7
      ? range(0.75, 0.95)
      : bootSpaceL > 500
        ? range(0.65, 0.9)
        : range(0.4, 0.75);

  const maintenanceCost = intRange(
    Math.round(exShowroomPrice * 0.02),
    Math.round(exShowroomPrice * 0.06)
  );

  const features = [
    "abs",
    "rear-camera",
    rand() > 0.5 ? "sunroof" : "no-sunroof",
    rand() > 0.4 ? "connected-car" : "basic-infotainment",
    airbags >= 4 ? "multi-airbag" : "dual-airbag",
    adasLevel > 0 ? "adas" : "no-adas",
    seating >= 7 ? "third-row" : "five-seat",
  ].filter((f) => !f.startsWith("no-"));

  return {
    make: brand.make,
    model,
    variant: `${pick(["VX", "ZX", "AX", "SX", "HTX", "ZXI", "XMS"])}${index % 10}`,
    bodyType,
    exShowroomPrice,
    safetyRating: Math.round(safetyRating * 100) / 100,
    mileageKmpl: Math.round(mileageKmpl * 10) / 10,
    familySuitability: Math.round(familySuitability * 100) / 100,
    valueForMoney: Math.round(range(0.5, 0.95) * 100) / 100,
    maintenanceCost,
    resaleScore: Math.round(range(0.5, 0.9) * 100) / 100,
    availabilityScore: Math.round(range(0.45, 0.98) * 100) / 100,
    featureVector: features,
    specs: {
      engineCc: isEv ? 0 : intRange(998, 2198),
      powerBhp: isEv ? range(80, 170) : range(65, 190),
      torqueNm: isEv ? range(110, 350) : range(95, 380),
      transmission,
      fuelType,
      seating,
      bootSpaceL,
      airbags,
      adasLevel,
      ncapRating: Math.round(ncapRating * 10) / 10,
    },
  };
}

async function main() {
  const count = 150;
  console.log(`Seeding ${count} cars...`);

  await prisma.$transaction([
    prisma.recommendationResult.deleteMany(),
    prisma.extractedPreference.deleteMany(),
    prisma.userSearch.deleteMany(),
    prisma.searchSession.deleteMany(),
    prisma.carSpec.deleteMany(),
    prisma.car.deleteMany(),
  ]);

  const cars = Array.from({ length: count }, (_, i) => generateCar(i));

  for (const car of cars) {
    await prisma.car.create({
      data: {
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
        featureVector: JSON.stringify(car.featureVector),
        specs: { create: car.specs },
      },
    });
  }

  const session = await prisma.searchSession.create({ data: {} });
  const sampleQueries = [
    "Family SUV under 15 lakh with good safety",
    "Fuel efficient hatchback for city driving under 10 lakh",
    "Automatic sedan with sunroof under 18 lakh",
  ];

  for (const q of sampleQueries) {
    await prisma.userSearch.create({
      data: { sessionId: session.id, rawQuery: q },
    });
  }

  console.log(`Seeded ${count} cars and sample session ${session.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
