/*
  Warnings:

  - Added the required column `telefone` to the `Resultado` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `resultado` ADD COLUMN `telefone` VARCHAR(191) NOT NULL;
