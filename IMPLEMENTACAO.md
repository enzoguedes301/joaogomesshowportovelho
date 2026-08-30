# 📋 Implementação - Banco de Dados + Painel Admin + Pixgo + Facebook

## ✅ Completado

### 1. **Banco de Dados (SQLite + Prisma)**
- ✅ Schema Prisma criado (`prisma/schema.prisma`)
- ✅ Tabelas:
  - `Doacao` - Registro de doações
  - `Evento` - Histórico de eventos (pago, entregue, cancelado)
  - `WebhookPixgo` - Webhooks recebidos
  - `SessaoAdmin` - Sessões do painel admin
  - `ConfigApp` - Configurações da aplicação

### 2. **Painel Admin**
- ✅ Interface copiada e configurada
- ✅ Arquivo de config: `publico-admin/painel.config.js`
  - Marca: "Doar é Amor - Show João Gomes"
  - Produto: "Doação"
  - Abas habilitadas: pedidos, cobrança, entregas, webhooks, anúncios, relatórios, funil, pagamentos, acessos, emails, boletos, CRM

### 3. **API Admin** (`server/admin.ts`)
- ✅ `POST /api/admin/login` - Autenticação com token
- ✅ `GET /api/admin/doacoes` - Lista doações (suporta dias)
- ✅ `POST /api/admin/doacoes/:id/marcar-pago` - Marcar como pago
- ✅ `POST /api/admin/doacoes/:id/cancelar` - Cancelar doação
- ✅ `GET /api/admin/relatorios` - Relatório de doações

### 4. **Integração Pixgo** (`server/pixgo-api.ts`)
- ✅ `POST /api/pix/webhook` - Recebe webhooks de pagamento
- ✅ `POST /api/pix/criar-doacao` - Cria cobrança Pixgo
- ✅ Atualiza status de doação quando Pixgo confirma pagamento
- ✅ API Key configurada no `.env`

### 5. **Integração Facebook**
- ✅ Envia evento "Purchase" para Pixel quando pagamento é confirmado
- ✅ Dados capturados:
  - Email
  - Telefone
  - Valor da doação
  - Timestamp
- ✅ Facebook Pixel ID: `947774625034514`
- ✅ Token API: Configurado no `.env`

## 📦 Dependências Instaladas
- `@prisma/client` - ORM para banco de dados
- `prisma` - CLI do Prisma
- `axios` - HTTP client
- `bcryptjs` - Hash de senha
- `dotenv` - Variáveis de ambiente

## 🗄️ Banco de Dados
- Provider: SQLite
- Arquivo: `prisma/dev.db`
- Migrations: Criadas automaticamente

## 🔐 Credenciais Configuradas
```env
PIXGO_API_KEY=pk_b5f1025cc799eb1b81b75c18a11c6983e779a2bd8f469af1c382cf483f721e01
FACEBOOK_PIXEL_ID=947774625034514
FACEBOOK_API_TOKEN=EAAdOqKjeh8Q...
ADMIN_PASSWORD_HASH=maisvelho123
ADMIN_SESSION_HOURS=12
DATABASE_URL=file:./prisma/dev.db
```

## 🚀 Próximos Passos

### 1. **Integrar as rotas no servidor principal**
Adicionar ao `server/index.ts`:
```typescript
import adminRouter from './admin';
import pixgoRouter from './pixgo-api';

app.use('/api/admin', adminRouter);
app.use('/api/pix', pixgoRouter);
```

### 2. **Servir o painel admin**
Na rota estática do Express, servir `publico-admin/`:
```typescript
app.use('/admin', express.static('./publico-admin'));
```

### 3. **Fazer build e deploy**
```bash
npm run build
# Upload para Hostinger
```

### 4. **Testar Fluxo Completo**
1. Acessar http://localhost:3000/admin
2. Login com senha: `maisvelho123`
3. Ver doações em tempo real
4. Simular pagamento Pixgo
5. Verificar evento no Facebook Pixel

## 📊 Fluxo de Doação

```
1. Usuário clica "Quero Ajudar"
   ↓
2. Abre modal de doação (frontend)
   ↓
3. Envia dados para POST /api/pix/criar-doacao
   ↓
4. Cria cobrança Pixgo
   ↓
5. Retorna QR Code + PIX key
   ↓
6. Usuário escaneia QR Code
   ↓
7. Pixgo confirma pagamento
   ↓
8. Webhook POST /api/pix/webhook é chamado
   ↓
9. Status muda para "pago"
   ↓
10. Envia evento para Facebook Pixel
   ↓
11. Painel Admin atualiza em tempo real
```

## ⚙️ Configurações Importantes

### Senha Admin
- Padrão: `maisvelho123`
- Alterar em: `server/admin.ts` ou no banco ConfigApp

### Duração da Sessão
- Padrão: 12 horas
- Alterar em: `.env` `ADMIN_SESSION_HOURS`

### Fuso Horário
- Padrão: `America/Sao_Paulo`
- Usar em: Relatórios e timestamps

## 📝 Notas

- Todas as senhas, tokens e chaves estão em `.env` (não enviadas ao git)
- O painel admin é 100% HTML/CSS/JS puro (sem build necessário)
- Banco de dados é local (SQLite), migrar para PostgreSQL em produção se necessário
- Webhooks do Pixgo precisam ser configurados na dashboard deles para chamar `/api/pix/webhook`

## 🔗 Endpoints Disponíveis

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/admin/login` | Login |
| GET | `/api/admin/doacoes` | Listar doações |
| POST | `/api/admin/doacoes/:id/marcar-pago` | Marcar como pago |
| POST | `/api/admin/doacoes/:id/cancelar` | Cancelar |
| GET | `/api/admin/relatorios` | Relatórios |
| POST | `/api/pix/criar-doacao` | Criar cobrança |
| POST | `/api/pix/webhook` | Webhook Pixgo |

---

**Status:** ✅ Pronto para integração
**Data:** 2026-08-30
