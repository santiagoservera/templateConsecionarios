BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[ConvenioBanco] (
    [id] INT NOT NULL IDENTITY(1,1),
    [nombre] NVARCHAR(1000) NOT NULL,
    [descripcion] NVARCHAR(1000),
    [activo] BIT NOT NULL CONSTRAINT [ConvenioBanco_activo_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ConvenioBanco_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ConvenioBanco_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ConvenioBanco_nombre_key] UNIQUE NONCLUSTERED ([nombre])
);

-- CreateTable
CREATE TABLE [dbo].[PlanCuotas] (
    [id] INT NOT NULL IDENTITY(1,1),
    [convenioBancoId] INT NOT NULL,
    [cantCuotas] INT NOT NULL,
    [tasaInteres] DECIMAL(5,2) NOT NULL,
    [activo] BIT NOT NULL CONSTRAINT [PlanCuotas_activo_df] DEFAULT 1,
    CONSTRAINT [PlanCuotas_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[PlanCuotas] ADD CONSTRAINT [PlanCuotas_convenioBancoId_fkey] FOREIGN KEY ([convenioBancoId]) REFERENCES [dbo].[ConvenioBanco]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
