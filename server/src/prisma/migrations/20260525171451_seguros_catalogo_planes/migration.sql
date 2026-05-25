/*
  Warnings:

  - You are about to drop the column `monto` on the `Seguro` table. All the data in the column will be lost.
  - You are about to drop the column `numeroPoliza` on the `Seguro` table. All the data in the column will be lost.
  - You are about to drop the column `observaciones` on the `Seguro` table. All the data in the column will be lost.
  - You are about to drop the column `vigenciaDesde` on the `Seguro` table. All the data in the column will be lost.
  - You are about to drop the column `vigenciaHasta` on the `Seguro` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- DropIndex
ALTER TABLE [dbo].[Seguro] DROP CONSTRAINT [Seguro_numeroPoliza_key];

-- AlterTable
ALTER TABLE [dbo].[Seguro] DROP COLUMN [monto],
[numeroPoliza],
[observaciones],
[vigenciaDesde],
[vigenciaHasta];
ALTER TABLE [dbo].[Seguro] ADD [aplicaA] NVARCHAR(1000) NOT NULL CONSTRAINT [Seguro_aplicaA_df] DEFAULT 'AMBOS',
[codigoPlan] NVARCHAR(1000),
[descripcion] NVARCHAR(max),
[precioAnual] DECIMAL(10,2),
[precioMensual] DECIMAL(10,2),
[sumaCubierta] NVARCHAR(1000);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
