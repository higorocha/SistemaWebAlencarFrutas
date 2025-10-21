# Fix: Campo `desativar` em áreas_agricolas

## 🔍 Problema Identificado

O campo `desativar` foi adicionado diretamente ao `schema.prisma` (linha 241) **sem criar uma migration correspondente**:

```prisma
model AreaAgricola {
  id              Int              @id @default(autoincrement())
  nome            String           @db.VarChar(100)
  categoria       CategoriaArea    @default(COLONO)
  areaTotal       Float            @map("area_total")
  coordenadas     Json?
  desativar       Boolean          @default(false) // ⚠️ Campo sem migration
  // ...
}
```

**Resultado:** No Render, ao fazer deploy, o banco de dados não possui essa coluna, causando o erro:

```
PrismaClientKnownRequestError: The column `areas_agricolas.desativar` does not exist in the current database.
```

---

## ✅ Solução Implementada

### 1. Migration Criada

Foi criada a migration `20251021083839_add_desativar_to_areas_agricolas` com o seguinte SQL seguro:

```sql
-- AlterTable
-- Adiciona campo desativar à tabela areas_agricolas com valor padrão false
-- Esta alteração é segura e não perde dados existentes
ALTER TABLE "areas_agricolas" ADD COLUMN IF NOT EXISTS "desativar" BOOLEAN NOT NULL DEFAULT false;
```

**Características da Migration:**
- ✅ **IF NOT EXISTS**: Evita erro se o campo já existir
- ✅ **DEFAULT false**: Todas as áreas existentes recebem `desativar = false` automaticamente
- ✅ **NOT NULL**: Garante consistência de dados
- ✅ **Não perde dados**: Todas as áreas cadastradas são preservadas

### 2. Aplicação Local

A migration foi marcada como aplicada no banco local:

```bash
npx prisma migrate resolve --applied 20251021083839_add_desativar_to_areas_agricolas
```

### 3. Commit e Push

A migration foi commitada e enviada ao repositório:

```bash
git add backend/prisma/migrations/20251021083839_add_desativar_to_areas_agricolas/
git commit -m "feat: adicionar migration para campo desativar em áreas agrícolas"
git push
```

---

## 🚀 Aplicação no Render

### Automática (Recomendado)

O Render aplicará automaticamente a migration no próximo deploy porque o script `render:start` já executa:

```json
"render:start": "npx prisma migrate deploy && npm run start:prod"
```

**Passos:**
1. ✅ **Push já feito** - Migration já está no repositório
2. ⏳ **Aguardar deploy automático** - Render detectará o push e iniciará novo deploy
3. ✅ **Migration aplicada automaticamente** - O comando `prisma migrate deploy` aplicará a migration
4. ✅ **Servidor reiniciado** - Sistema funcionará normalmente

### Manual (Se Necessário)

Se precisar aplicar imediatamente via Render Shell:

```bash
# 1. Acessar Shell do serviço backend no Render
# 2. Executar:
cd /opt/render/project/src/backend
npx prisma migrate deploy
```

---

## 📊 Verificação

### Verificar Status das Migrations (Local)

```bash
cd backend
npx prisma migrate status
```

**Saída esperada:**
```
35 migrations found in prisma/migrations
Database schema is up to date!
```

### Verificar no Render

Após o deploy, verificar logs do Render para confirmar:

```
Running 'npx prisma migrate deploy'...
✔ Applied migration 20251021083839_add_desativar_to_areas_agricolas
```

---

## 🎯 Resultado Esperado

Após aplicação da migration:

1. ✅ Campo `desativar` criado na tabela `areas_agricolas`
2. ✅ Todas as áreas existentes com `desativar = false`
3. ✅ Erro `column does not exist` resolvido
4. ✅ Dashboard e sistema funcionando normalmente
5. ✅ **Nenhum dado perdido** - Todas as áreas cadastradas preservadas

---

## 📝 Prevenção Futura

**Regra Importante:**
⚠️ **NUNCA** adicionar campos ao `schema.prisma` sem criar a migration correspondente!

**Processo Correto:**

```bash
# 1. Editar schema.prisma
# 2. Criar migration
npx prisma migrate dev --name descricao_da_alteracao

# 3. Verificar migration criada
npx prisma migrate status

# 4. Commit e push
git add prisma/migrations/
git commit -m "feat: adicionar campo X"
git push
```

---

## 📚 Referências

- **Schema:** `backend/prisma/schema.prisma` (linha 241)
- **Migration:** `backend/prisma/migrations/20251021083839_add_desativar_to_areas_agricolas/`
- **Serviço Render:** Aplicação automática via `render:start`

---

**Status:** ✅ Resolvido - Migration criada, commitada e enviada ao repositório
**Deploy Necessário:** ⏳ Aguardar deploy automático do Render ou aplicar manualmente via Shell
**Perda de Dados:** ❌ Nenhuma - Migration segura que preserva todos os dados existentes
