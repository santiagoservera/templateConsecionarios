BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Configuracion] ADD [afipCondicionIva] NVARCHAR(1000) NOT NULL CONSTRAINT [Configuracion_afipCondicionIva_df] DEFAULT 'RESPONSABLE_INSCRIPTO',
[afipCuit] NVARCHAR(1000),
[afipIvaAlicuota] DECIMAL(5,2) NOT NULL CONSTRAINT [Configuracion_afipIvaAlicuota_df] DEFAULT 21,
[afipPuntoVenta] INT NOT NULL CONSTRAINT [Configuracion_afipPuntoVenta_df] DEFAULT 1;

-- CreateTable
CREATE TABLE [dbo].[Factura] (
    [id] INT NOT NULL IDENTITY(1,1),
    [ventaId] INT NOT NULL,
    [tipo] NVARCHAR(1000) NOT NULL CONSTRAINT [Factura_tipo_df] DEFAULT 'FACTURA_B',
    [puntoVenta] INT NOT NULL CONSTRAINT [Factura_puntoVenta_df] DEFAULT 1,
    [numero] INT NOT NULL,
    [cae] NVARCHAR(1000),
    [caeFechaVencimiento] DATETIME2,
    [fechaEmision] DATETIME2 NOT NULL CONSTRAINT [Factura_fechaEmision_df] DEFAULT CURRENT_TIMESTAMP,
    [importeNeto] DECIMAL(12,2) NOT NULL,
    [importeIva] DECIMAL(12,2) NOT NULL,
    [importeTotal] DECIMAL(12,2) NOT NULL,
    [estado] NVARCHAR(1000) NOT NULL CONSTRAINT [Factura_estado_df] DEFAULT 'PENDIENTE',
    [errorMensaje] NVARCHAR(max),
    [demoMode] BIT NOT NULL CONSTRAINT [Factura_demoMode_df] DEFAULT 0,
    CONSTRAINT [Factura_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Factura_ventaId_key] UNIQUE NONCLUSTERED ([ventaId])
);

-- AddForeignKey
ALTER TABLE [dbo].[Factura] ADD CONSTRAINT [Factura_ventaId_fkey] FOREIGN KEY ([ventaId]) REFERENCES [dbo].[Venta]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
