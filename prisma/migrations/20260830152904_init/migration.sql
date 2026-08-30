-- CreateTable
CREATE TABLE "Doacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "whatsapp" TEXT,
    "valor" INTEGER NOT NULL,
    "mensagem" TEXT,
    "pixgoPaymentId" TEXT,
    "pixgoStatus" TEXT NOT NULL DEFAULT 'pending',
    "pixKey" TEXT,
    "facebookEventId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "entregueEm" DATETIME,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Evento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "doacaoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "dados" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Evento_doacaoId_fkey" FOREIGN KEY ("doacaoId") REFERENCES "Doacao" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WebhookPixgo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "dados" TEXT NOT NULL,
    "processado" BOOLEAN NOT NULL DEFAULT false,
    "erro" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SessaoAdmin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "papel" TEXT NOT NULL DEFAULT 'dono',
    "validoAte" DATETIME NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ConfigApp" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'config',
    "pixgoApiKey" TEXT,
    "facebookPixelId" TEXT,
    "facebookTokenApi" TEXT,
    "senhaAdmin" TEXT,
    "urlBase" TEXT NOT NULL DEFAULT 'http://localhost:3000',
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Doacao_pixgoPaymentId_key" ON "Doacao"("pixgoPaymentId");

-- CreateIndex
CREATE INDEX "Doacao_email_idx" ON "Doacao"("email");

-- CreateIndex
CREATE INDEX "Doacao_pixgoPaymentId_idx" ON "Doacao"("pixgoPaymentId");

-- CreateIndex
CREATE INDEX "Doacao_status_idx" ON "Doacao"("status");

-- CreateIndex
CREATE INDEX "Doacao_criadoEm_idx" ON "Doacao"("criadoEm");

-- CreateIndex
CREATE INDEX "Evento_doacaoId_idx" ON "Evento"("doacaoId");

-- CreateIndex
CREATE INDEX "Evento_tipo_idx" ON "Evento"("tipo");

-- CreateIndex
CREATE INDEX "WebhookPixgo_tipo_idx" ON "WebhookPixgo"("tipo");

-- CreateIndex
CREATE INDEX "WebhookPixgo_processado_idx" ON "WebhookPixgo"("processado");

-- CreateIndex
CREATE UNIQUE INDEX "SessaoAdmin_token_key" ON "SessaoAdmin"("token");

-- CreateIndex
CREATE INDEX "SessaoAdmin_token_idx" ON "SessaoAdmin"("token");
