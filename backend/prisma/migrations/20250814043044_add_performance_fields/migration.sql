-- AlterTable
ALTER TABLE "matches" ADD COLUMN "player1EloChange" INTEGER;
ALTER TABLE "matches" ADD COLUMN "player2EloChange" INTEGER;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_players" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "birthYear" INTEGER NOT NULL,
    "birthDate" DATETIME,
    "gender" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "address" TEXT,
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "eloRating" INTEGER NOT NULL DEFAULT 1200,
    "skillLevel" TEXT NOT NULL DEFAULT 'beginner',
    "confidenceIndex" REAL NOT NULL DEFAULT 0.0,
    "totalMatches" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "consistencyIndex" REAL NOT NULL DEFAULT 1.0,
    "momentumScore" REAL NOT NULL DEFAULT 0.0,
    "performanceIndex" REAL NOT NULL DEFAULT 1200.0,
    "lastFormUpdate" DATETIME,
    "lastMatchDate" DATETIME,
    "registrationDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_players" ("address", "birthYear", "confidenceIndex", "createdAt", "district", "eloRating", "email", "emergencyContact", "emergencyPhone", "gender", "id", "isActive", "lastMatchDate", "losses", "name", "notes", "phone", "province", "registrationDate", "skillLevel", "totalMatches", "updatedAt", "wins") SELECT "address", "birthYear", "confidenceIndex", "createdAt", "district", "eloRating", "email", "emergencyContact", "emergencyPhone", "gender", "id", "isActive", "lastMatchDate", "losses", "name", "notes", "phone", "province", "registrationDate", "skillLevel", "totalMatches", "updatedAt", "wins" FROM "players";
DROP TABLE "players";
ALTER TABLE "new_players" RENAME TO "players";
CREATE UNIQUE INDEX "players_email_key" ON "players"("email");
CREATE TABLE "new_tournaments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "registrationStart" DATETIME NOT NULL,
    "registrationEnd" DATETIME NOT NULL,
    "location" TEXT NOT NULL,
    "locationLat" REAL,
    "locationLng" REAL,
    "venue" TEXT NOT NULL,
    "maxParticipants" INTEGER NOT NULL DEFAULT 100,
    "minSkillLevel" INTEGER NOT NULL DEFAULT 1000,
    "maxSkillLevel" INTEGER NOT NULL DEFAULT 3000,
    "skillDiffLimit" INTEGER NOT NULL DEFAULT 200,
    "tournamentType" TEXT NOT NULL DEFAULT 'single_elimination',
    "skillLevel" TEXT NOT NULL DEFAULT 'all',
    "participantFee" INTEGER NOT NULL DEFAULT 0,
    "organizerFee" INTEGER NOT NULL DEFAULT 50000,
    "pricingTier" TEXT NOT NULL DEFAULT 'basic',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "posterImage" TEXT,
    "rulesDocument" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "bankInfo" TEXT,
    "organizerInfo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_tournaments" ("bankInfo", "category", "contactEmail", "contactPhone", "createdAt", "description", "endDate", "id", "location", "locationLat", "locationLng", "maxParticipants", "maxSkillLevel", "minSkillLevel", "name", "organizerFee", "organizerInfo", "participantFee", "posterImage", "pricingTier", "registrationEnd", "registrationStart", "rulesDocument", "skillDiffLimit", "startDate", "status", "updatedAt", "venue") SELECT "bankInfo", "category", "contactEmail", "contactPhone", "createdAt", "description", "endDate", "id", "location", "locationLat", "locationLng", "maxParticipants", "maxSkillLevel", "minSkillLevel", "name", "organizerFee", "organizerInfo", "participantFee", "posterImage", "pricingTier", "registrationEnd", "registrationStart", "rulesDocument", "skillDiffLimit", "startDate", "status", "updatedAt", "venue" FROM "tournaments";
DROP TABLE "tournaments";
ALTER TABLE "new_tournaments" RENAME TO "tournaments";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
