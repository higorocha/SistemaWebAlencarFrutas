/*
  Warnings:

  - A unique constraint covering the columns `[servidorSMTP,porta,emailEnvio]` on the table `config_emails` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone_number_id,numero_telefone]` on the table `config_whatsapp` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "config_emails_servidorSMTP_porta_emailEnvio_key" ON "config_emails"("servidorSMTP", "porta", "emailEnvio");

-- CreateIndex
CREATE UNIQUE INDEX "config_whatsapp_phone_number_id_numero_telefone_key" ON "config_whatsapp"("phone_number_id", "numero_telefone");
