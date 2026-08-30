# 📋 Como Acessar o Painel Admin

## 🚀 Em Desenvolvimento (localhost)

### Passo 1: Iniciar o servidor
```bash
npm run dev
```

### Passo 2: Acessar o painel
Abra no navegador:
```
http://localhost:3000/admin
```

### Passo 3: Fazer login
- **Senha:** a senha definida em `ADMIN_PASSWORD_HASH` no `.env`
- Clique em "Entrar"

### Passo 4: Gerenciar doações
Você verá:
- 📊 **Pedidos** - Lista de todas as doações
- 💰 **Relatórios** - Desempenho diário
- 📦 **Entregas** - Status das entregas
- 🔗 **Webhooks** - Eventos do Pixgo
- ... e mais 8 abas

---

## 🌐 Em Produção (Hostinger)

### Passo 1: Build local
```bash
npm run build
```

### Passo 2: Upload dos arquivos
Faça upload da pasta `dist/` para o Hostinger:
- Via cPanel File Manager
- Via FTP/SFTP
- Ou via Git pull (se configurado)

### Passo 3: Acessar o painel
```
https://correntedobeem.online/admin
```

### Passo 4: Fazer login
- **Senha:** a senha definida em `ADMIN_PASSWORD_HASH` no `.env`

---

## 🔐 Segurança

### Alterar Senha
1. Acesse o banco de dados (SQLite dev ou DB em produção)
2. Tabela: `ConfigApp`
3. Campo: `senhaAdmin`
4. Atualize o valor

### Duração da Sessão
- **Padrão:** 12 horas
- Alterar em: `.env` `ADMIN_SESSION_HOURS`

---

## 📱 Funcionalidades do Painel

| Aba | Função |
|-----|--------|
| **Pedidos** | Lista doações com status (pendente, pago, entregue) |
| **Cobrança** | Gerenciar cobranças Pixgo |
| **Entregas** | Marcar como entregue |
| **Webhooks** | Ver eventos recebidos do Pixgo |
| **Anúncios** | Desempenho de campanhas |
| **Relatórios** | Gráficos e métricas diárias |
| **Funil** | Análise de etapas |
| **Pagamentos** | Histórico de transações |
| **Acessos** | Quem acessou o painel |
| **Emails** | Histórico de envios |
| **Boletos** | Gerenciar boletos (se usar) |
| **CRM** | Gerenciar contatos |

---

## 💡 Dicas

### Para Testar Doações em Dev
1. Acesse: `http://localhost:3000`
2. Clique em "Quero Ajudar"
3. Preencha dados
4. Escaneie QR Code Pixgo ou copie chave PIX
5. Simule pagamento (ou aguarde confirmação real)
6. Painel atualiza automaticamente

### Webhooks Pixgo
Para que os webhooks funcionem em produção:
1. Acesse dashboard Pixgo
2. Configure webhook URL:
   ```
   https://correntedobeem.online/api/pix/webhook
   ```
3. Selecione eventos: `charge.completed`, `charge.updated`

### Facebook Pixel
O evento é enviado automaticamente quando:
1. Doação é criada no Pixgo
2. Webhook confirma pagamento
3. Status muda para "pago"
4. Facebook Pixel ID: `947774625034514`

---

## ❌ Troubleshooting

### "Senha incorreta"
- Verifique se digitou: a senha definida em `ADMIN_PASSWORD_HASH` no `.env`
- Sem espaços extras

### "Painel não carrega"
- Verifique se servidor está rodando: `npm run dev`
- Limpe cache: Ctrl+Shift+Delete
- Abra em aba incógnita

### "Doações não aparecem"
- Verifique se banco de dados foi criado:
  ```bash
  npx prisma generate
  npx prisma migrate deploy
  ```

### "Pixgo não funciona"
- Verifique `.env`: `PIXGO_API_KEY` está correto?
- Console (F12) mostra erros?
- Webhook configurado na dashboard Pixgo?

---

## 📞 Contato

Se encontrar problemas:
1. Verifique o console (F12 → Console)
2. Veja os logs do servidor
3. Confira arquivo `IMPLEMENTACAO.md`

---

**Status:** ✅ Pronto para usar
**Versão:** 1.0
**Última atualização:** 2026-08-30
