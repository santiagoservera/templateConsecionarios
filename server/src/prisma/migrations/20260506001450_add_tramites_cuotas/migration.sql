BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Financiamiento] ADD [fechaInicioTramite] DATETIME2,
[numeroExpediente] NVARCHAR(1000),
[observaciones] NVARCHAR(max);

-- CreateTable
CREATE TABLE [dbo].[CuotaFinanciamiento] (
    [id] INT NOT NULL IDENTITY(1,1),
    [financiamientoId] INT NOT NULL,
    [numeroCuota] INT NOT NULL,
    [fechaVencimiento] DATETIME2 NOT NULL,
    [monto] DECIMAL(10,2) NOT NULL,
    [estado] NVARCHAR(1000) NOT NULL CONSTRAINT [CuotaFinanciamiento_estado_df] DEFAULT 'PENDIENTE',
    [fechaPago] DATETIME2,
    [observaciones] NVARCHAR(max),
    CONSTRAINT [CuotaFinanciamiento_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[CuotaFinanciamiento] ADD CONSTRAINT [CuotaFinanciamiento_financiamientoId_fkey] FOREIGN KEY ([financiamientoId]) REFERENCES [dbo].[Financiamiento]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
