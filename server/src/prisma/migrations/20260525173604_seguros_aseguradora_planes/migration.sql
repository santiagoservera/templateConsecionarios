BEGIN TRY
BEGIN TRAN;

-- Borrar filas de prueba para poder agregar FK requerida
DELETE FROM [dbo].[Seguro];

-- Quitar constraints de default antes de borrar columnas
ALTER TABLE [dbo].[Seguro] DROP CONSTRAINT [Seguro_estado_df];

-- Quitar columnas del modelo anterior
ALTER TABLE [dbo].[Seguro] DROP COLUMN [aseguradora],
[estado];

-- Agregar columnas nuevas (aseguradoraId con default temporal)
ALTER TABLE [dbo].[Seguro] ADD
    [activo]        BIT NOT NULL CONSTRAINT [Seguro_activo_df]         DEFAULT 1,
    [aseguradoraId] INT NOT NULL CONSTRAINT [Seguro_aseguradoraId_tmp] DEFAULT 0;

-- Quitar el default temporal
ALTER TABLE [dbo].[Seguro] DROP CONSTRAINT [Seguro_aseguradoraId_tmp];

-- Crear tabla Aseguradora
CREATE TABLE [dbo].[Aseguradora] (
    [id]          INT            NOT NULL IDENTITY(1,1),
    [nombre]      NVARCHAR(1000) NOT NULL,
    [descripcion] NVARCHAR(1000),
    [contacto]    NVARCHAR(1000),
    [activo]      BIT            NOT NULL CONSTRAINT [Aseguradora_activo_df]    DEFAULT 1,
    [createdAt]   DATETIME2      NOT NULL CONSTRAINT [Aseguradora_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Aseguradora_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Aseguradora_nombre_key] UNIQUE NONCLUSTERED ([nombre])
);

-- Agregar FK
ALTER TABLE [dbo].[Seguro] ADD CONSTRAINT [Seguro_aseguradoraId_fkey]
    FOREIGN KEY ([aseguradoraId]) REFERENCES [dbo].[Aseguradora]([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRAN;
    THROW;
END CATCH
