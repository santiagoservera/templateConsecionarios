/*
  Warnings:

  - You are about to drop the column `fechaInicioTramite` on the `Financiamiento` table. All the data in the column will be lost.
  - You are about to drop the `CuotaFinanciamiento` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Preparacion` table. If the table is not empty, all the data it contains will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[CuotaFinanciamiento] DROP CONSTRAINT [CuotaFinanciamiento_financiamientoId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Preparacion] DROP CONSTRAINT [Preparacion_usuarioId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Preparacion] DROP CONSTRAINT [Preparacion_vehiculoId_fkey];

-- AlterTable
ALTER TABLE [dbo].[Financiamiento] DROP COLUMN [fechaInicioTramite];

-- DropTable
DROP TABLE [dbo].[CuotaFinanciamiento];

-- DropTable
DROP TABLE [dbo].[Preparacion];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
