BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[PlanPagoDNI] (
    [id] INT NOT NULL IDENTITY(1,1),
    [clienteId] INT NOT NULL,
    [vehiculoId] INT NOT NULL,
    [vendedorId] INT NOT NULL,
    [precioTotal] DECIMAL(12,2) NOT NULL,
    [cantCuotas] INT NOT NULL,
    [valorCuota] DECIMAL(10,2) NOT NULL,
    [montoEntrega] DECIMAL(12,2),
    [montoPagado] DECIMAL(12,2) NOT NULL CONSTRAINT [PlanPagoDNI_montoPagado_df] DEFAULT 0,
    [estado] NVARCHAR(1000) NOT NULL CONSTRAINT [PlanPagoDNI_estado_df] DEFAULT 'ACTIVO',
    [vehiculoEntregado] BIT NOT NULL CONSTRAINT [PlanPagoDNI_vehiculoEntregado_df] DEFAULT 0,
    [ventaId] INT,
    [observaciones] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [PlanPagoDNI_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PlanPagoDNI_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [PlanPagoDNI_vehiculoId_key] UNIQUE NONCLUSTERED ([vehiculoId]),
    CONSTRAINT [PlanPagoDNI_ventaId_key] UNIQUE NONCLUSTERED ([ventaId])
);

-- CreateTable
CREATE TABLE [dbo].[CuotaPlanPago] (
    [id] INT NOT NULL IDENTITY(1,1),
    [planPagoDNIId] INT NOT NULL,
    [numeroCuota] INT NOT NULL,
    [fechaVencimiento] DATETIME2 NOT NULL,
    [monto] DECIMAL(10,2) NOT NULL,
    [estado] NVARCHAR(1000) NOT NULL CONSTRAINT [CuotaPlanPago_estado_df] DEFAULT 'PENDIENTE',
    [fechaPago] DATETIME2,
    [observaciones] NVARCHAR(max),
    [usuarioId] INT,
    CONSTRAINT [CuotaPlanPago_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[SesionCaja] (
    [id] INT NOT NULL IDENTITY(1,1),
    [usuarioId] INT NOT NULL,
    [fechaApertura] DATETIME2 NOT NULL CONSTRAINT [SesionCaja_fechaApertura_df] DEFAULT CURRENT_TIMESTAMP,
    [fechaCierre] DATETIME2,
    [montoApertura] DECIMAL(10,2) NOT NULL,
    [montoCierre] DECIMAL(10,2),
    [estado] NVARCHAR(1000) NOT NULL CONSTRAINT [SesionCaja_estado_df] DEFAULT 'ABIERTA',
    [observaciones] NVARCHAR(max),
    CONSTRAINT [SesionCaja_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[MovimientoCaja] (
    [id] INT NOT NULL IDENTITY(1,1),
    [sesionCajaId] INT NOT NULL,
    [tipo] NVARCHAR(1000) NOT NULL,
    [concepto] NVARCHAR(1000) NOT NULL,
    [monto] DECIMAL(10,2) NOT NULL,
    [planPagoDNIId] INT,
    [observaciones] NVARCHAR(max),
    [usuarioId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [MovimientoCaja_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [MovimientoCaja_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Seguro] (
    [id] INT NOT NULL IDENTITY(1,1),
    [aseguradora] NVARCHAR(1000) NOT NULL,
    [numeroPoliza] NVARCHAR(1000) NOT NULL,
    [tipoCobertura] NVARCHAR(1000) NOT NULL CONSTRAINT [Seguro_tipoCobertura_df] DEFAULT 'TODO_RIESGO',
    [vigenciaDesde] DATETIME2 NOT NULL,
    [vigenciaHasta] DATETIME2 NOT NULL,
    [monto] DECIMAL(10,2),
    [urlDocumento] NVARCHAR(1000),
    [observaciones] NVARCHAR(max),
    [estado] NVARCHAR(1000) NOT NULL CONSTRAINT [Seguro_estado_df] DEFAULT 'VIGENTE',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Seguro_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Seguro_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Seguro_numeroPoliza_key] UNIQUE NONCLUSTERED ([numeroPoliza])
);

-- AddForeignKey
ALTER TABLE [dbo].[PlanPagoDNI] ADD CONSTRAINT [PlanPagoDNI_clienteId_fkey] FOREIGN KEY ([clienteId]) REFERENCES [dbo].[Cliente]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PlanPagoDNI] ADD CONSTRAINT [PlanPagoDNI_vehiculoId_fkey] FOREIGN KEY ([vehiculoId]) REFERENCES [dbo].[Vehiculo]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PlanPagoDNI] ADD CONSTRAINT [PlanPagoDNI_vendedorId_fkey] FOREIGN KEY ([vendedorId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PlanPagoDNI] ADD CONSTRAINT [PlanPagoDNI_ventaId_fkey] FOREIGN KEY ([ventaId]) REFERENCES [dbo].[Venta]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[CuotaPlanPago] ADD CONSTRAINT [CuotaPlanPago_planPagoDNIId_fkey] FOREIGN KEY ([planPagoDNIId]) REFERENCES [dbo].[PlanPagoDNI]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[CuotaPlanPago] ADD CONSTRAINT [CuotaPlanPago_usuarioId_fkey] FOREIGN KEY ([usuarioId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[SesionCaja] ADD CONSTRAINT [SesionCaja_usuarioId_fkey] FOREIGN KEY ([usuarioId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MovimientoCaja] ADD CONSTRAINT [MovimientoCaja_sesionCajaId_fkey] FOREIGN KEY ([sesionCajaId]) REFERENCES [dbo].[SesionCaja]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MovimientoCaja] ADD CONSTRAINT [MovimientoCaja_planPagoDNIId_fkey] FOREIGN KEY ([planPagoDNIId]) REFERENCES [dbo].[PlanPagoDNI]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MovimientoCaja] ADD CONSTRAINT [MovimientoCaja_usuarioId_fkey] FOREIGN KEY ([usuarioId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
