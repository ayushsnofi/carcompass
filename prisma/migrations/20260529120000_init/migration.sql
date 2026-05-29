-- CreateTable
CREATE TABLE "SearchSession" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSearch" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "rawQuery" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtractedPreference" (
    "id" TEXT NOT NULL,
    "userSearchId" TEXT NOT NULL,
    "budgetMin" INTEGER,
    "budgetMax" INTEGER,
    "bodyType" TEXT,
    "fuelType" TEXT,
    "transmission" TEXT,
    "seatsMin" INTEGER,
    "cityUsagePercent" INTEGER,
    "highwayUsagePercent" INTEGER,
    "prioritySafety" INTEGER NOT NULL DEFAULT 5,
    "priorityMileage" INTEGER NOT NULL DEFAULT 5,
    "priorityComfort" INTEGER NOT NULL DEFAULT 5,
    "priorityPerformance" INTEGER NOT NULL DEFAULT 5,
    "priorityValue" INTEGER NOT NULL DEFAULT 5,
    "mustHaveFeatures" TEXT,
    "niceToHaveFeatures" TEXT,
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExtractedPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Car" (
    "id" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "bodyType" TEXT NOT NULL,
    "exShowroomPrice" INTEGER NOT NULL,
    "safetyRating" DOUBLE PRECISION NOT NULL,
    "mileageKmpl" DOUBLE PRECISION NOT NULL,
    "familySuitability" DOUBLE PRECISION NOT NULL,
    "valueForMoney" DOUBLE PRECISION NOT NULL,
    "maintenanceCost" INTEGER NOT NULL,
    "resaleScore" DOUBLE PRECISION NOT NULL,
    "availabilityScore" DOUBLE PRECISION NOT NULL,
    "featureVector" TEXT,

    CONSTRAINT "Car_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarSpec" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "engineCc" INTEGER,
    "powerBhp" DOUBLE PRECISION,
    "torqueNm" DOUBLE PRECISION,
    "transmission" TEXT,
    "fuelType" TEXT,
    "seating" INTEGER,
    "bootSpaceL" INTEGER,
    "airbags" INTEGER,
    "adasLevel" INTEGER,
    "ncapRating" DOUBLE PRECISION,

    CONSTRAINT "CarSpec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationResult" (
    "id" TEXT NOT NULL,
    "userSearchId" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "totalScore" DOUBLE PRECISION NOT NULL,
    "scoreBreakdown" TEXT NOT NULL,
    "tradeoffNotes" TEXT,
    "explanation" TEXT,
    "bestForTag" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserSearch_sessionId_idx" ON "UserSearch"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "ExtractedPreference_userSearchId_key" ON "ExtractedPreference"("userSearchId");

-- CreateIndex
CREATE UNIQUE INDEX "CarSpec_carId_key" ON "CarSpec"("carId");

-- CreateIndex
CREATE INDEX "RecommendationResult_userSearchId_idx" ON "RecommendationResult"("userSearchId");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationResult_userSearchId_carId_key" ON "RecommendationResult"("userSearchId", "carId");

-- AddForeignKey
ALTER TABLE "UserSearch" ADD CONSTRAINT "UserSearch_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SearchSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractedPreference" ADD CONSTRAINT "ExtractedPreference_userSearchId_fkey" FOREIGN KEY ("userSearchId") REFERENCES "UserSearch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarSpec" ADD CONSTRAINT "CarSpec_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationResult" ADD CONSTRAINT "RecommendationResult_userSearchId_fkey" FOREIGN KEY ("userSearchId") REFERENCES "UserSearch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationResult" ADD CONSTRAINT "RecommendationResult_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;
