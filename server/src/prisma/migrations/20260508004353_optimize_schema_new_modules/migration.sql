/*
  Warnings:

  - You are about to drop the `CategoriaIndumentaria` table. If the table is not empty, all the data it contains will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Consignacion] ADD [observaciones] NVARCHAR(max);

-- AlterTable
ALTER TABLE [dbo].[Indumentaria] DROP CONSTRAINT [Indumentaria_categoria_df];
ALTER TABLE [dbo].[Indumentaria] ADD CONSTRAINT [Indumentaria_categoria_df] DEFAULT 'Otro' FOR [categoria];

-- AlterTable
ALTER TABLE [dbo].[ServiceVehiculo] ALTER COLUMN [ventaId] INT NULL;
ALTER TABLE [dbo].[ServiceVehiculo] ADD [vehiculoId] INT;

-- AlterTable
ALTER TABLE [dbo].[Usuario] ADD [comisionPct] DECIMAL(5,2);

-- AlterTable
ALTER TABLE [dbo].[Vehiculo] ADD [enPreparacion] BIT NOT NULL CONSTRAINT [Vehiculo_enPreparacion_df] DEFAULT 0;

-- DropTable
DROP TABLE [dbo].[CategoriaIndumentaria];

-- CreateTable
CREATE TABLE [dbo].[Configuracion] (
    [id] INT NOT NULL CONSTRAINT [Configuracion_id_df] DEFAULT 1,
    [nombreConcesionaria] NVARCHAR(1000) NOT NULL CONSTRAINT [Configuracion_nombreConcesionaria_df] DEFAULT 'DealerOS',
    [comisionPctDefault] DECIMAL(5,2) NOT NULL CONSTRAINT [Configuracion_comisionPctDefault_df] DEFAULT 2,
    [moneda] NVARCHAR(1000) NOT NULL CONSTRAINT [Configuracion_moneda_df] DEFAULT 'ARS',
    [direccion] NVARCHAR(1000),
    [telefono] NVARCHAR(1000),
    [email] NVARCHAR(1000),
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Configuracion_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[ServiceVehiculo] ADD CONSTRAINT [ServiceVehiculo_vehiculoId_fkey] FOREIGN KEY ([vehiculoId]) REFERENCES [dbo].[Vehiculo]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
