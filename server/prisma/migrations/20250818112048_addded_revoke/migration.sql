-- AlterTable
ALTER TABLE "public"."EmailOTP" ADD COLUMN     "revoked" BOOLEAN NOT NULL DEFAULT false;
