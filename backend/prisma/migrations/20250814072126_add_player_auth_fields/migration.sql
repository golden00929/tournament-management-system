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
    "password" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifyToken" TEXT,
    "verifyTokenExpiry" DATETIME,
    "passwordResetToken" TEXT,
    "passwordResetExpiry" DATETIME,
    "lastLoginAt" DATETIME,
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
INSERT INTO "new_players" ("address", "birthDate", "birthYear", "confidenceIndex", "consistencyIndex", "createdAt", "district", "eloRating", "email", "emergencyContact", "emergencyPhone", "gender", "id", "isActive", "lastFormUpdate", "lastMatchDate", "losses", "momentumScore", "name", "notes", "performanceIndex", "phone", "province", "registrationDate", "skillLevel", "totalMatches", "updatedAt", "wins") SELECT "address", "birthDate", "birthYear", "confidenceIndex", "consistencyIndex", "createdAt", "district", "eloRating", "email", "emergencyContact", "emergencyPhone", "gender", "id", "isActive", "lastFormUpdate", "lastMatchDate", "losses", "momentumScore", "name", "notes", "performanceIndex", "phone", "province", "registrationDate", "skillLevel", "totalMatches", "updatedAt", "wins" FROM "players";
DROP TABLE "players";
ALTER TABLE "new_players" RENAME TO "players";
CREATE UNIQUE INDEX "players_email_key" ON "players"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
