BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Usuario] (
    [id] INT NOT NULL IDENTITY(1,1),
    [nombre] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [passwordHash] NVARCHAR(1000) NOT NULL,
    [rol] NVARCHAR(1000) NOT NULL CONSTRAINT [Usuario_rol_df] DEFAULT 'VENDEDOR',
    [activo] BIT NOT NULL CONSTRAINT [Usuario_activo_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Usuario_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Usuario_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Usuario_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Cliente] (
    [id] INT NOT NULL IDENTITY(1,1),
    [nombre] NVARCHAR(1000) NOT NULL,
    [apellido] NVARCHAR(1000) NOT NULL,
    [dniCuit] NVARCHAR(1000),
    [telefono] NVARCHAR(1000),
    [email] NVARCHAR(1000),
    [direccion] NVARCHAR(1000),
    [origen] NVARCHAR(1000) NOT NULL CONSTRAINT [Cliente_origen_df] DEFAULT 'VISITA',
    [vendedorId] INT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Cliente_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Cliente_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Vehiculo] (
    [id] INT NOT NULL IDENTITY(1,1),
    [tipo] NVARCHAR(1000) NOT NULL,
    [marca] NVARCHAR(1000) NOT NULL,
    [modelo] NVARCHAR(1000) NOT NULL,
    [anio] INT NOT NULL,
    [version] NVARCHAR(1000),
    [color] NVARCHAR(1000),
    [vinChasis] NVARCHAR(1000),
    [patente] NVARCHAR(1000),
    [km] INT NOT NULL CONSTRAINT [Vehiculo_km_df] DEFAULT 0,
    [combustible] NVARCHAR(1000),
    [transmision] NVARCHAR(1000),
    [estado] NVARCHAR(1000) NOT NULL CONSTRAINT [Vehiculo_estado_df] DEFAULT 'DISPONIBLE',
    [tipoStock] NVARCHAR(1000) NOT NULL,
    [precioCosto] DECIMAL(12,2) NOT NULL,
    [precioVenta] DECIMAL(12,2) NOT NULL,
    [precioMinimo] DECIMAL(12,2),
    [fotosJson] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Vehiculo_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Vehiculo_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Vehiculo_vinChasis_key] UNIQUE NONCLUSTERED ([vinChasis]),
    CONSTRAINT [Vehiculo_patente_key] UNIQUE NONCLUSTERED ([patente])
);

-- CreateTable
CREATE TABLE [dbo].[GastoVehiculo] (
    [id] INT NOT NULL IDENTITY(1,1),
    [vehiculoId] INT NOT NULL,
    [concepto] NVARCHAR(1000) NOT NULL,
    [monto] DECIMAL(10,2) NOT NULL,
    [proveedor] NVARCHAR(1000),
    [fecha] DATETIME2 NOT NULL CONSTRAINT [GastoVehiculo_fecha_df] DEFAULT CURRENT_TIMESTAMP,
    [usuarioId] INT NOT NULL,
    CONSTRAINT [GastoVehiculo_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Lead] (
    [id] INT NOT NULL IDENTITY(1,1),
    [clienteId] INT NOT NULL,
    [vendedorId] INT NOT NULL,
    [vehiculoInteresId] INT,
    [etapa] NVARCHAR(1000) NOT NULL CONSTRAINT [Lead_etapa_df] DEFAULT 'NUEVO',
    [origen] NVARCHAR(1000),
    [notas] NVARCHAR(max),
    [proximoContacto] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Lead_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Lead_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Venta] (
    [id] INT NOT NULL IDENTITY(1,1),
    [clienteId] INT NOT NULL,
    [vehiculoId] INT NOT NULL,
    [vendedorId] INT NOT NULL,
    [precioFinal] DECIMAL(12,2) NOT NULL,
    [formaPago] NVARCHAR(1000) NOT NULL,
    [tienePermuta] BIT NOT NULL CONSTRAINT [Venta_tienePermuta_df] DEFAULT 0,
    [tieneFinanciamiento] BIT NOT NULL CONSTRAINT [Venta_tieneFinanciamiento_df] DEFAULT 0,
    [estado] NVARCHAR(1000) NOT NULL CONSTRAINT [Venta_estado_df] DEFAULT 'RESERVA',
    [fechaReserva] DATETIME2 NOT NULL CONSTRAINT [Venta_fechaReserva_df] DEFAULT CURRENT_TIMESTAMP,
    [fechaEntrega] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Venta_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Venta_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Venta_vehiculoId_key] UNIQUE NONCLUSTERED ([vehiculoId])
);

-- CreateTable
CREATE TABLE [dbo].[Permuta] (
    [id] INT NOT NULL IDENTITY(1,1),
    [ventaId] INT NOT NULL,
    [marca] NVARCHAR(1000) NOT NULL,
    [modelo] NVARCHAR(1000) NOT NULL,
    [anio] INT NOT NULL,
    [patente] NVARCHAR(1000),
    [km] INT NOT NULL,
    [valorTasacion] DECIMAL(12,2) NOT NULL,
    [estadoIngreso] NVARCHAR(1000),
    [vehiculoGeneradoId] INT,
    CONSTRAINT [Permuta_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Permuta_ventaId_key] UNIQUE NONCLUSTERED ([ventaId]),
    CONSTRAINT [Permuta_vehiculoGeneradoId_key] UNIQUE NONCLUSTERED ([vehiculoGeneradoId])
);

-- CreateTable
CREATE TABLE [dbo].[Financiamiento] (
    [id] INT NOT NULL IDENTITY(1,1),
    [ventaId] INT NOT NULL,
    [entidad] NVARCHAR(1000) NOT NULL,
    [montoFinanciado] DECIMAL(12,2) NOT NULL,
    [tasaInteres] DECIMAL(5,2) NOT NULL,
    [cantCuotas] INT NOT NULL,
    [valorCuota] DECIMAL(10,2) NOT NULL,
    [estado] NVARCHAR(1000) NOT NULL CONSTRAINT [Financiamiento_estado_df] DEFAULT 'PENDIENTE',
    [fechaAprobacion] DATETIME2,
    CONSTRAINT [Financiamiento_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Financiamiento_ventaId_key] UNIQUE NONCLUSTERED ([ventaId])
);

-- CreateTable
CREATE TABLE [dbo].[Consignacion] (
    [id] INT NOT NULL IDENTITY(1,1),
    [vehiculoId] INT NOT NULL,
    [propietarioId] INT NOT NULL,
    [precioAcordado] DECIMAL(12,2) NOT NULL,
    [comisionPct] DECIMAL(5,2) NOT NULL,
    [estado] NVARCHAR(1000) NOT NULL CONSTRAINT [Consignacion_estado_df] DEFAULT 'ACTIVA',
    [fechaIngreso] DATETIME2 NOT NULL CONSTRAINT [Consignacion_fechaIngreso_df] DEFAULT CURRENT_TIMESTAMP,
    [fechaVencimiento] DATETIME2,
    CONSTRAINT [Consignacion_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Consignacion_vehiculoId_key] UNIQUE NONCLUSTERED ([vehiculoId])
);

-- CreateTable
CREATE TABLE [dbo].[Preparacion] (
    [id] INT NOT NULL IDENTITY(1,1),
    [vehiculoId] INT NOT NULL,
    [tipo] NVARCHAR(1000) NOT NULL,
    [descripcion] NVARCHAR(max),
    [proveedor] NVARCHAR(1000),
    [costo] DECIMAL(10,2) NOT NULL CONSTRAINT [Preparacion_costo_df] DEFAULT 0,
    [estado] NVARCHAR(1000) NOT NULL CONSTRAINT [Preparacion_estado_df] DEFAULT 'PENDIENTE',
    [fechaInicio] DATETIME2,
    [fechaFin] DATETIME2,
    [usuarioId] INT NOT NULL,
    CONSTRAINT [Preparacion_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Documento] (
    [id] INT NOT NULL IDENTITY(1,1),
    [ventaId] INT NOT NULL,
    [tipo] NVARCHAR(1000) NOT NULL,
    [urlArchivo] NVARCHAR(1000),
    [fechaGeneracion] DATETIME2 NOT NULL CONSTRAINT [Documento_fechaGeneracion_df] DEFAULT CURRENT_TIMESTAMP,
    [usuarioId] INT NOT NULL,
    CONSTRAINT [Documento_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Postventa] (
    [id] INT NOT NULL IDENTITY(1,1),
    [ventaId] INT NOT NULL,
    [clienteId] INT NOT NULL,
    [tipo] NVARCHAR(1000) NOT NULL,
    [descripcion] NVARCHAR(max) NOT NULL,
    [estado] NVARCHAR(1000) NOT NULL CONSTRAINT [Postventa_estado_df] DEFAULT 'ABIERTO',
    [fechaContacto] DATETIME2 NOT NULL CONSTRAINT [Postventa_fechaContacto_df] DEFAULT CURRENT_TIMESTAMP,
    [fechaResolucion] DATETIME2,
    [usuarioId] INT NOT NULL,
    CONSTRAINT [Postventa_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Comision] (
    [id] INT NOT NULL IDENTITY(1,1),
    [ventaId] INT NOT NULL,
    [vendedorId] INT NOT NULL,
    [montoBase] DECIMAL(12,2) NOT NULL,
    [porcentaje] DECIMAL(5,2) NOT NULL,
    [montoComision] DECIMAL(10,2) NOT NULL,
    [estado] NVARCHAR(1000) NOT NULL CONSTRAINT [Comision_estado_df] DEFAULT 'PENDIENTE',
    [fechaLiquidacion] DATETIME2,
    CONSTRAINT [Comision_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Comision_ventaId_key] UNIQUE NONCLUSTERED ([ventaId])
);

-- AddForeignKey
ALTER TABLE [dbo].[Cliente] ADD CONSTRAINT [Cliente_vendedorId_fkey] FOREIGN KEY ([vendedorId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[GastoVehiculo] ADD CONSTRAINT [GastoVehiculo_vehiculoId_fkey] FOREIGN KEY ([vehiculoId]) REFERENCES [dbo].[Vehiculo]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[GastoVehiculo] ADD CONSTRAINT [GastoVehiculo_usuarioId_fkey] FOREIGN KEY ([usuarioId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Lead] ADD CONSTRAINT [Lead_clienteId_fkey] FOREIGN KEY ([clienteId]) REFERENCES [dbo].[Cliente]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Lead] ADD CONSTRAINT [Lead_vendedorId_fkey] FOREIGN KEY ([vendedorId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Lead] ADD CONSTRAINT [Lead_vehiculoInteresId_fkey] FOREIGN KEY ([vehiculoInteresId]) REFERENCES [dbo].[Vehiculo]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Venta] ADD CONSTRAINT [Venta_clienteId_fkey] FOREIGN KEY ([clienteId]) REFERENCES [dbo].[Cliente]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Venta] ADD CONSTRAINT [Venta_vehiculoId_fkey] FOREIGN KEY ([vehiculoId]) REFERENCES [dbo].[Vehiculo]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Venta] ADD CONSTRAINT [Venta_vendedorId_fkey] FOREIGN KEY ([vendedorId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Permuta] ADD CONSTRAINT [Permuta_ventaId_fkey] FOREIGN KEY ([ventaId]) REFERENCES [dbo].[Venta]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Permuta] ADD CONSTRAINT [Permuta_vehiculoGeneradoId_fkey] FOREIGN KEY ([vehiculoGeneradoId]) REFERENCES [dbo].[Vehiculo]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Financiamiento] ADD CONSTRAINT [Financiamiento_ventaId_fkey] FOREIGN KEY ([ventaId]) REFERENCES [dbo].[Venta]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Consignacion] ADD CONSTRAINT [Consignacion_vehiculoId_fkey] FOREIGN KEY ([vehiculoId]) REFERENCES [dbo].[Vehiculo]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Consignacion] ADD CONSTRAINT [Consignacion_propietarioId_fkey] FOREIGN KEY ([propietarioId]) REFERENCES [dbo].[Cliente]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Preparacion] ADD CONSTRAINT [Preparacion_vehiculoId_fkey] FOREIGN KEY ([vehiculoId]) REFERENCES [dbo].[Vehiculo]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Preparacion] ADD CONSTRAINT [Preparacion_usuarioId_fkey] FOREIGN KEY ([usuarioId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Documento] ADD CONSTRAINT [Documento_ventaId_fkey] FOREIGN KEY ([ventaId]) REFERENCES [dbo].[Venta]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Documento] ADD CONSTRAINT [Documento_usuarioId_fkey] FOREIGN KEY ([usuarioId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Postventa] ADD CONSTRAINT [Postventa_ventaId_fkey] FOREIGN KEY ([ventaId]) REFERENCES [dbo].[Venta]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Postventa] ADD CONSTRAINT [Postventa_clienteId_fkey] FOREIGN KEY ([clienteId]) REFERENCES [dbo].[Cliente]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Postventa] ADD CONSTRAINT [Postventa_usuarioId_fkey] FOREIGN KEY ([usuarioId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Comision] ADD CONSTRAINT [Comision_ventaId_fkey] FOREIGN KEY ([ventaId]) REFERENCES [dbo].[Venta]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Comision] ADD CONSTRAINT [Comision_vendedorId_fkey] FOREIGN KEY ([vendedorId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
