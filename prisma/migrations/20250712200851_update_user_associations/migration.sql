/*
  Warnings:

  - You are about to drop the column `associated_entity_id` on the `users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_associated_entity_id_service_provider_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_associated_entity_id_store_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "associated_entity_id",
ADD COLUMN     "associated_provider_id" TEXT,
ADD COLUMN     "associated_store_id" TEXT;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_associated_store_id_fkey" FOREIGN KEY ("associated_store_id") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_associated_provider_id_fkey" FOREIGN KEY ("associated_provider_id") REFERENCES "service_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
