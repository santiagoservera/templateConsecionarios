BEGIN TRY

BEGIN TRAN;

-- CreateTable: Rol
CREATE TABLE [dbo].[Rol] (
    [id]          INT NOT NULL IDENTITY(1,1),
    [nombre]      NVARCHAR(1000) NOT NULL,
    [descripcion] NVARCHAR(1000),
    [permisos]    NVARCHAR(MAX) NOT NULL,
    [esDefault]   BIT NOT NULL CONSTRAINT [Rol_esDefault_df] DEFAULT 0,
    [createdAt]   DATETIME2 NOT NULL CONSTRAINT [Rol_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Rol_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Rol_nombre_key] UNIQUE NONCLUSTERED ([nombre])
);

-- AlterTable: Usuario — agregar columna rolId nullable
ALTER TABLE [dbo].[Usuario] ADD [rolId] INT;

-- AddForeignKey
ALTER TABLE [dbo].[Usuario] ADD CONSTRAINT [Usuario_rolId_fkey]
    FOREIGN KEY ([rolId]) REFERENCES [dbo].[Rol]([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW;

END CATCH
