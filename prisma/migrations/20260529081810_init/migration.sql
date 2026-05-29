-- CreateTable
CREATE TABLE "SearchSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UserSearch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "rawQuery" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserSearch_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SearchSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExtractedPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "confidence" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExtractedPreference_userSearchId_fkey" FOREIGN KEY ("userSearchId") REFERENCES "UserSearch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Car" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "bodyType" TEXT NOT NULL,
    "exShowroomPrice" INTEGER NOT NULL,
    "safetyRating" REAL NOT NULL,
    "mileageKmpl" REAL NOT NULL,
    "familySuitability" REAL NOT NULL,
    "valueForMoney" REAL NOT NULL,
    "maintenanceCost" INTEGER NOT NULL,
    "resaleScore" REAL NOT NULL,
    "availabilityScore" REAL NOT NULL,
    "featureVector" TEXT
);

-- CreateTable
CREATE TABLE "CarSpec" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "carId" TEXT NOT NULL,
    "engineCc" INTEGER,
    "powerBhp" REAL,
    "torqueNm" REAL,
    "transmission" TEXT,
    "fuelType" TEXT,
    "seating" INTEGER,
    "bootSpaceL" INTEGER,
    "airbags" INTEGER,
    "adasLevel" INTEGER,
    "ncapRating" REAL,
    CONSTRAINT "CarSpec_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecommendationResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userSearchId" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "totalScore" REAL NOT NULL,
    "scoreBreakdown" TEXT NOT NULL,
    "tradeoffNotes" TEXT,
    "explanation" TEXT,
    "bestForTag" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecommendationResult_userSearchId_fkey" FOREIGN KEY ("userSearchId") REFERENCES "UserSearch" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RecommendationResult_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
