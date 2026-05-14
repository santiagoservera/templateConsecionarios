BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[ServiceVehiculo] (
    [id] INT NOT NULL IDENTITY(1,1),
    [ventaId] INT NOT NULL,
    [tipoService] NVARCHAR(1000) NOT NULL CONSTRAINT [ServiceVehiculo_tipoService_df] DEFAULT 'MANTENIMIENTO',
    [descripcion] NVARCHAR(max) NOT NULL,
    [kmActual] INT,
    [kmProximoService] INT,
    [fechaService] DATETIME2 NOT NULL CONSTRAINT [ServiceVehiculo_fechaService_df] DEFAULT CURRENT_TIMESTAMP,
    [fechaProximoService] DATETIME2,
    [estado] NVARCHAR(1000) NOT NULL CONSTRAINT [ServiceVehiculo_estado_df] DEFAULT 'PENDIENTE',
    [observaciones] NVARCHAR(max),
    [usuarioId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ServiceVehiculo_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ServiceVehiculo_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[ServiceVehiculo] ADD CONSTRAINT [ServiceVehiculo_ventaId_fkey] FOREIGN KEY ([ventaId]) REFERENCES [dbo].[Venta]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ServiceVehiculo] ADD CONSTRAINT [ServiceVehiculo_usuarioId_fkey] FOREIGN KEY ([usuarioId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
