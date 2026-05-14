BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Indumentaria] (
    [id] INT NOT NULL IDENTITY(1,1),
    [nombre] NVARCHAR(1000) NOT NULL,
    [descripcion] NVARCHAR(max),
    [categoria] NVARCHAR(1000) NOT NULL CONSTRAINT [Indumentaria_categoria_df] DEFAULT 'OTRO',
    [talla] NVARCHAR(1000),
    [color] NVARCHAR(1000),
    [marca] NVARCHAR(1000),
    [cantidad] INT NOT NULL CONSTRAINT [Indumentaria_cantidad_df] DEFAULT 0,
    [precioCosto] DECIMAL(10,2) NOT NULL,
    [precioVenta] DECIMAL(10,2) NOT NULL,
    [fotosJson] NVARCHAR(max),
    [activo] BIT NOT NULL CONSTRAINT [Indumentaria_activo_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Indumentaria_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Indumentaria_pkey] PRIMARY KEY CLUSTERED ([id])
);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
