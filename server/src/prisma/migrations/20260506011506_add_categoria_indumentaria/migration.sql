BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[CategoriaIndumentaria] (
    [id] INT NOT NULL IDENTITY(1,1),
    [nombre] NVARCHAR(1000) NOT NULL,
    [activo] BIT NOT NULL CONSTRAINT [CategoriaIndumentaria_activo_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [CategoriaIndumentaria_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [CategoriaIndumentaria_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [CategoriaIndumentaria_nombre_key] UNIQUE NONCLUSTERED ([nombre])
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
