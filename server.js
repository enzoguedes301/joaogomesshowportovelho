var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/pixgo.ts
function chave() {
  const k = process.env.PIXGO_API_KEY;
  if (!k) {
    throw new ErroPixGo(
      503,
      "SEM_CHAVE",
      "PIXGO_API_KEY n\xE3o configurada. Copie .env.example para .env e preencha com a chave do dashboard da PixGo."
    );
  }
  return k;
}
async function chamar(caminho, init) {
  const resp = await fetch(`${BASE}${caminho}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": chave(),
      ...init?.headers ?? {}
    }
  });
  const texto = await resp.text();
  let corpo = null;
  try {
    corpo = texto ? JSON.parse(texto) : null;
  } catch {
    throw new ErroPixGo(502, "RESPOSTA_INVALIDA", `A PixGo respondeu ${resp.status} em formato inesperado.`);
  }
  if (!resp.ok && resp.status !== 410) {
    throw new ErroPixGo(
      resp.status,
      corpo?.error ?? "ERRO_PIXGO",
      corpo?.message ?? `A PixGo respondeu ${resp.status}.`
    );
  }
  return { dados: corpo?.data, http: resp.status };
}
async function criarCobranca(dados) {
  try {
    const { dados: criada } = await chamar("/payment/create", {
      method: "POST",
      body: JSON.stringify(dados)
    });
    return criada;
  } catch (e) {
    const recusaDeCampo = e instanceof ErroPixGo && e.status === 400 && /cpf|obrigat|required|missing|field/i.test(e.message);
    if (!recusaDeCampo) throw e;
    const { receiver_cpf, receiver_name, receiver_email, receiver_phone, ...resto } = dados;
    const { dados: criada } = await chamar("/payment/create", {
      method: "POST",
      body: JSON.stringify({
        ...resto,
        customer_cpf: receiver_cpf,
        customer_name: receiver_name,
        customer_email: receiver_email,
        customer_phone: receiver_phone
      })
    });
    return criada;
  }
}
async function consultarStatus(paymentId) {
  const { dados } = await chamar(`/payment/${encodeURIComponent(paymentId)}/status`);
  return dados;
}
async function consultarDetalhes(paymentId) {
  const { dados } = await chamar(`/payment/${encodeURIComponent(paymentId)}`);
  return dados;
}
function ehFinal(status) {
  return status !== "pending";
}
var BASE, VALOR_MINIMO, VALOR_MAXIMO, ErroPixGo;
var init_pixgo = __esm({
  "server/pixgo.ts"() {
    BASE = "https://pixgo.org/api/v1";
    VALOR_MINIMO = 10;
    VALOR_MAXIMO = 6e3;
    ErroPixGo = class extends Error {
      constructor(status, codigo, mensagem) {
        super(mensagem);
        this.status = status;
        this.codigo = codigo;
        this.name = "ErroPixGo";
      }
    };
  }
});

// server/banco.ts
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
function carregar() {
  let carimbo = -1;
  try {
    carimbo = fs.statSync(ARQUIVO).mtimeMs;
  } catch {
  }
  if (cache && carimbo === carimboDoCache) return cache;
  try {
    const lido = JSON.parse(fs.readFileSync(ARQUIVO, "utf8"));
    cache = { ...structuredClone(VAZIO), ...lido };
  } catch {
    cache = structuredClone(VAZIO);
  }
  carimboDoCache = carimbo;
  return cache;
}
function salvar() {
  const dados = cache ?? carregar();
  fs.mkdirSync(path.dirname(ARQUIVO), { recursive: true });
  const temporario = `${ARQUIVO}.${process.pid}.tmp`;
  fs.writeFileSync(temporario, JSON.stringify(dados, null, 2), "utf8");
  fs.renameSync(temporario, ARQUIVO);
  try {
    carimboDoCache = fs.statSync(ARQUIVO).mtimeMs;
  } catch {
    carimboDoCache = -1;
  }
}
function agora() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function reidratar(registro) {
  const saida = { ...registro };
  for (const campo of ["criadoEm", "atualizadoEm", "entregueEm", "validoAte"]) {
    if (typeof saida[campo] === "string") saida[campo] = new Date(saida[campo]);
  }
  return saida;
}
function combina(registro, onde = {}) {
  return Object.entries(onde).every(([campo, esperado]) => {
    const atual = registro[campo];
    if (esperado && typeof esperado === "object" && "gte" in esperado) {
      return new Date(String(atual)).getTime() >= new Date(esperado.gte).getTime();
    }
    return atual === esperado;
  });
}
function tabela(nome) {
  const linhas = () => carregar()[nome];
  return {
    async findMany({ where, orderBy } = {}) {
      let saida = linhas().filter((r) => combina(r, where));
      if (orderBy) {
        const [campo, direcao] = Object.entries(orderBy)[0];
        saida = [...saida].sort((a, b) => {
          const x = new Date(String(a[campo])).getTime();
          const y = new Date(String(b[campo])).getTime();
          return direcao === "desc" ? y - x : x - y;
        });
      }
      return saida.map((r) => ({ ...reidratar(r), eventos: [] }));
    },
    async findUnique({ where }) {
      const achado = linhas().find((r) => combina(r, where));
      return achado ? reidratar(achado) : null;
    },
    async create({ data }) {
      const novo = {
        id: data.id ?? crypto.randomUUID(),
        criadoEm: agora(),
        atualizadoEm: agora(),
        ...data
      };
      linhas().push(novo);
      salvar();
      return reidratar(novo);
    },
    async update({ where, data }) {
      const alvo = linhas().find((r) => combina(r, where));
      if (!alvo) throw new Error(`registro n\xE3o encontrado em ${nome}`);
      Object.assign(alvo, data, { atualizadoEm: agora() });
      salvar();
      return reidratar(alvo);
    },
    async upsert({ where, update, create }) {
      const alvo = linhas().find((r) => combina(r, where));
      if (alvo) {
        Object.assign(alvo, update, { atualizadoEm: agora() });
        salvar();
        return reidratar(alvo);
      }
      return this.create({ data: { ...where, ...create } });
    },
    async count({ where } = {}) {
      return linhas().filter((r) => combina(r, where)).length;
    },
    async deleteMany({ where } = {}) {
      const antes = linhas().length;
      const mantidos = linhas().filter((r) => !combina(r, where));
      carregar()[nome] = mantidos;
      salvar();
      return { count: antes - mantidos.length };
    }
  };
}
var VAZIO, ARQUIVO, cache, carimboDoCache, prisma;
var init_banco = __esm({
  "server/banco.ts"() {
    VAZIO = { doacao: [], evento: [], webhookPixgo: [], sessaoAdmin: [], configApp: [] };
    ARQUIVO = path.resolve(process.cwd(), "dados", "doacoes.json");
    cache = null;
    carimboDoCache = -1;
    prisma = {
      doacao: tabela("doacao"),
      evento: tabela("evento"),
      webhookPixgo: tabela("webhookPixgo"),
      sessaoAdmin: tabela("sessaoAdmin"),
      configApp: tabela("configApp")
    };
  }
});

// server/registroDoacoes.ts
import crypto2 from "node:crypto";
function traduzirStatus(status) {
  if (status === "completed") return "pago";
  if (status === "pending") return "pendente";
  return "cancelado";
}
async function registrarDoacao(nova) {
  try {
    await prisma.doacao.create({
      data: {
        nome: nova.nome?.trim() || "Doador an\xF4nimo",
        email: nova.email?.trim() || "",
        valor: Math.round(nova.valor * 100),
        pixgoPaymentId: nova.paymentId,
        pixgoStatus: nova.status,
        pixKey: nova.copiaECola,
        status: traduzirStatus(nova.status),
        entregueEm: null,
        facebookEventId: null
      }
    });
  } catch (erro) {
    console.error("[doacoes] falhou ao registrar a doa\xE7\xE3o:", erro);
  }
}
async function atualizarStatusDoacao(paymentId, status) {
  try {
    const doacao = await prisma.doacao.findUnique({ where: { pixgoPaymentId: paymentId } });
    if (!doacao) return;
    const novo = traduzirStatus(status);
    if (doacao.status === novo) return;
    if (doacao.status === "entregue") return;
    await prisma.doacao.update({
      where: { pixgoPaymentId: paymentId },
      data: { status: novo, pixgoStatus: status }
    });
    await prisma.evento.create({
      data: { doacaoId: doacao.id, tipo: novo, dados: JSON.stringify({ pixgoStatus: status }) }
    });
    if (novo === "pago") {
      await enviarFacebook({ ...doacao, status: novo });
    }
  } catch (erro) {
    console.error("[doacoes] falhou ao atualizar o status:", erro);
  }
}
async function registrarWebhook(tipo, dados) {
  try {
    await prisma.webhookPixgo.create({ data: { tipo, dados, processado: true } });
  } catch (erro) {
    console.error("[doacoes] falhou ao registrar o webhook:", erro);
  }
}
function hash(valor) {
  const limpo = valor?.trim().toLowerCase();
  if (!limpo) return void 0;
  return crypto2.createHash("sha256").update(limpo).digest("hex");
}
async function enviarFacebook(doacao) {
  const pixelId = process.env.FACEBOOK_PIXEL_ID;
  const token = process.env.FACEBOOK_API_TOKEN;
  if (!pixelId || !token) return;
  const eventId = `doacao-${doacao.id}`;
  try {
    const resposta = await fetch(
      `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(8e3),
        body: JSON.stringify({
          data: [
            {
              event_name: "Purchase",
              event_time: Math.floor(Date.now() / 1e3),
              // Mesmo id do Pixel do navegador: o Facebook junta os dois em vez
              // de contar duas vendas.
              event_id: eventId,
              action_source: "website",
              event_source_url: process.env.URL_BASE || "https://correntedobeem.online",
              user_data: {
                em: hash(doacao.email),
                ph: hash(String(doacao.whatsapp ?? "").replace(/\D/g, ""))
              },
              custom_data: { value: doacao.valor / 100, currency: "BRL" }
            }
          ]
        })
      }
    );
    const corpo = await resposta.json().catch(() => ({}));
    if (!resposta.ok) {
      console.error("[doacoes] Facebook recusou a compra:", JSON.stringify(corpo));
      return;
    }
    console.log(`[doacoes] compra enviada ao Facebook (${eventId})`);
    await prisma.doacao.update({ where: { id: doacao.id }, data: { facebookEventId: eventId } });
  } catch (erro) {
    console.error("[doacoes] falhou ao enviar a compra ao Facebook:", erro?.message ?? erro);
  }
}
var init_registroDoacoes = __esm({
  "server/registroDoacoes.ts"() {
    init_banco();
  }
});

// server/admin.ts
var admin_exports = {};
__export(admin_exports, {
  default: () => admin_default
});
import { Router as Router2 } from "express";
import * as crypto4 from "crypto";
var router, verificarSessao, admin_default;
var init_admin = __esm({
  "server/admin.ts"() {
    init_banco();
    router = Router2();
    verificarSessao = async (req, res, next) => {
      const token = req.headers["x-admin-sessao"];
      if (!token) {
        return res.status(401).json({ success: false, error: "sem_sessao", message: "Sess\xE3o n\xE3o encontrada" });
      }
      const sessao = await prisma.sessaoAdmin.findUnique({ where: { token } });
      if (!sessao || /* @__PURE__ */ new Date() > sessao.validoAte) {
        return res.status(401).json({ success: false, error: "sessao_invalida", message: "Sess\xE3o expirou" });
      }
      req.sessao = sessao;
      next();
    };
    router.post("/login", async (req, res) => {
      const { senha } = req.body;
      if (!senha) {
        return res.status(400).json({ success: false, error: "senha_obrigatoria", message: "Senha \xE9 obrigat\xF3ria" });
      }
      let config = await prisma.configApp.findUnique({ where: { id: "config" } });
      if (!config?.senhaAdmin) {
        const senhaInicial = process.env.ADMIN_PASSWORD_HASH;
        if (senhaInicial) {
          config = await prisma.configApp.upsert({
            where: { id: "config" },
            update: { senhaAdmin: senhaInicial },
            create: { id: "config", senhaAdmin: senhaInicial }
          });
        }
      }
      const senhaCorreta = Boolean(config?.senhaAdmin) && config?.senhaAdmin === senha;
      if (!senhaCorreta) {
        return res.status(400).json({ success: false, error: "senha_incorreta", message: "Senha incorreta" });
      }
      const horas = Number(process.env.ADMIN_SESSION_HOURS) || 12;
      const token = crypto4.randomBytes(32).toString("hex");
      const validoAte = new Date(Date.now() + horas * 60 * 60 * 1e3);
      await prisma.sessaoAdmin.create({
        data: { token, validoAte, papel: "dono" }
      });
      return res.json({
        success: true,
        data: { token, horas, papel: "dono" }
      });
    });
    router.get("/doacoes", verificarSessao, async (req, res) => {
      const dias = parseInt(req.query.dias) || 7;
      const dataInicial = dias === -1 ? /* @__PURE__ */ new Date(0) : new Date(Date.now() - dias * 24 * 60 * 60 * 1e3);
      const doacoes = await prisma.doacao.findMany({
        where: { criadoEm: { gte: dataInicial } },
        orderBy: { criadoEm: "desc" },
        include: { eventos: true }
      });
      const total = doacoes.reduce((sum, d) => sum + d.valor, 0);
      return res.json({
        success: true,
        data: {
          doacoes: doacoes.map((d) => ({
            id: d.id,
            nome: d.nome,
            email: d.email,
            valor: d.valor,
            status: d.status,
            pixgoStatus: d.pixgoStatus,
            mensagem: d.mensagem,
            criadoEm: d.criadoEm.toISOString(),
            entregueEm: d.entregueEm?.toISOString() || null
          })),
          total,
          quantidade: doacoes.length,
          dias,
          papel: req.sessao.papel
        }
      });
    });
    router.post("/doacoes/:id/marcar-pago", verificarSessao, async (req, res) => {
      if (req.sessao.papel !== "dono") {
        return res.status(403).json({ success: false, error: "sem_permissao", message: "Apenas dono pode marcar como pago" });
      }
      const doacao = await prisma.doacao.findUnique({ where: { id: req.params.id } });
      if (!doacao) {
        return res.status(404).json({ success: false, error: "nao_encontrado", message: "Doa\xE7\xE3o n\xE3o encontrada" });
      }
      const jaEstavaPago = doacao.status === "pago";
      if (!jaEstavaPago) {
        await prisma.doacao.update({
          where: { id: req.params.id },
          data: {
            status: "pago",
            entregueEm: /* @__PURE__ */ new Date()
          }
        });
        await prisma.evento.create({
          data: {
            doacaoId: req.params.id,
            tipo: "pago_manual",
            dados: JSON.stringify({ por: "admin" })
          }
        });
      }
      const doacaoAtualizada = await prisma.doacao.findUnique({ where: { id: req.params.id } });
      return res.json({
        success: true,
        data: { jaEstavaPago, doacao: doacaoAtualizada }
      });
    });
    router.post("/doacoes/:id/cancelar", verificarSessao, async (req, res) => {
      if (req.sessao.papel !== "dono") {
        return res.status(403).json({ success: false, error: "sem_permissao", message: "Sem permiss\xE3o" });
      }
      const doacao = await prisma.doacao.findUnique({ where: { id: req.params.id } });
      if (!doacao) {
        return res.status(404).json({ success: false, error: "nao_encontrado", message: "Doa\xE7\xE3o n\xE3o encontrada" });
      }
      await prisma.doacao.update({
        where: { id: req.params.id },
        data: { status: "cancelado" }
      });
      await prisma.evento.create({
        data: {
          doacaoId: req.params.id,
          tipo: "cancelado"
        }
      });
      return res.json({ success: true, data: { cancelado: true } });
    });
    router.get("/relatorios", verificarSessao, async (req, res) => {
      const dias = parseInt(req.query.dias) || 7;
      const dataInicial = dias === -1 ? /* @__PURE__ */ new Date(0) : new Date(Date.now() - dias * 24 * 60 * 60 * 1e3);
      const doacoes = await prisma.doacao.findMany({
        where: { criadoEm: { gte: dataInicial } }
      });
      const totais = {
        valor: doacoes.reduce((sum, d) => sum + d.valor, 0),
        quantidade: doacoes.length,
        pagas: doacoes.filter((d) => d.status === "pago").length
      };
      return res.json({
        success: true,
        data: {
          dias,
          totais,
          totaisFechados: totais
        }
      });
    });
    admin_default = router;
  }
});

// server/detectorPagamento.ts
var detectorPagamento_exports = {};
__export(detectorPagamento_exports, {
  iniciarDetectorDePagamento: () => iniciarDetectorDePagamento
});
function minutosDesde(data) {
  return (Date.now() - new Date(data).getTime()) / 6e4;
}
async function rodada() {
  const pendentes = await prisma.doacao.findMany({ where: { status: "pendente" } });
  for (const doacao of pendentes) {
    const paymentId = doacao.pixgoPaymentId;
    if (!paymentId) continue;
    const idade = minutosDesde(doacao.criadoEm);
    if (idade > IDADE_MAXIMA_MINUTOS) {
      jaVerificadas.delete(paymentId);
      continue;
    }
    const feitas = jaVerificadas.get(paymentId) ?? 0;
    const devidas = MOMENTOS_MINUTOS.filter((m) => idade >= m).length;
    if (devidas <= feitas) continue;
    try {
      const status = await consultarStatus(paymentId);
      jaVerificadas.set(paymentId, feitas + 1);
      if (status.status !== "pending") {
        await atualizarStatusDoacao(paymentId, status.status);
        jaVerificadas.delete(paymentId);
        if (status.status === "completed") {
          console.log(`[detector] pagamento confirmado: ${paymentId}`);
        }
      }
    } catch (erro) {
      console.error(`[detector] falhou ao consultar ${paymentId}:`, erro?.message ?? erro);
    }
  }
}
function iniciarDetectorDePagamento() {
  if (!process.env.PIXGO_API_KEY) return;
  const timer = setInterval(() => {
    void rodada().catch((erro) => console.error("[detector] rodada falhou:", erro));
  }, INTERVALO_MS);
  timer.unref?.();
  console.log("Detector de pagamento ligado (a PixGo desta conta n\xE3o oferece webhook).");
}
var MOMENTOS_MINUTOS, IDADE_MAXIMA_MINUTOS, INTERVALO_MS, jaVerificadas;
var init_detectorPagamento = __esm({
  "server/detectorPagamento.ts"() {
    init_pixgo();
    init_banco();
    init_registroDoacoes();
    MOMENTOS_MINUTOS = [2, 4, 7, 12, 20, 30];
    IDADE_MAXIMA_MINUTOS = 35;
    INTERVALO_MS = 6e4;
    jaVerificadas = /* @__PURE__ */ new Map();
  }
});

// server/index.ts
import fs2 from "node:fs";
import path2 from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import compression from "compression";
import express2 from "express";

// server/manutencao.ts
var EM_MANUTENCAO = false;
var PAGINA_MANUTENCAO = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Em manuten\xE7\xE3o</title>
<style>
  html, body {
    height: 100%;
    margin: 0;
    background: #ffffff;
  }
  body {
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
    color: #1a1a1a;
    text-align: center;
    padding: 24px;
  }
  h1 {
    font-size: clamp(1.25rem, 5vw, 2rem);
    font-weight: 600;
    letter-spacing: 0.02em;
    margin: 0;
  }
</style>
</head>
<body>
  <h1>EM MANUTEN\xC7\xC3O</h1>
</body>
</html>
`;

// server/rotasPix.ts
init_pixgo();
init_registroDoacoes();
import crypto3 from "node:crypto";
import express, { Router } from "express";
var registros = /* @__PURE__ */ new Map();
function documentoValido(doc) {
  const d = doc.replace(/\D/g, "");
  if (d.length === 11) {
    if (/^(\d)\1{10}$/.test(d)) return false;
    for (const [ate, pos] of [[9, 10], [10, 11]]) {
      let soma = 0;
      for (let i = 0; i < ate; i++) soma += Number(d[i]) * (pos - i);
      const dv = soma * 10 % 11 % 10;
      if (dv !== Number(d[ate])) return false;
    }
    return true;
  }
  if (d.length === 14) {
    if (/^(\d)\1{13}$/.test(d)) return false;
    const pesos = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    for (const ate of [12, 13]) {
      const p = pesos.slice(pesos.length - ate);
      let soma = 0;
      for (let i = 0; i < ate; i++) soma += Number(d[i]) * p[i];
      const resto = soma % 11;
      const dv = resto < 2 ? 0 : 11 - resto;
      if (dv !== Number(d[ate])) return false;
    }
    return true;
  }
  return false;
}
var TETO_CAMPANHA = 1e3;
var VALOR_MAXIMO_DOACAO = Math.min(VALOR_MAXIMO, TETO_CAMPANHA);
var janelas = /* @__PURE__ */ new Map();
var LIMITE = 12;
var JANELA_MS = 10 * 60 * 1e3;
function passouDoLimite(ip) {
  const agora2 = Date.now();
  const recentes = (janelas.get(ip) ?? []).filter((t) => agora2 - t < JANELA_MS);
  recentes.push(agora2);
  janelas.set(ip, recentes);
  return recentes.length > LIMITE;
}
function responderErro(res, e) {
  if (e instanceof ErroPixGo) {
    res.status(e.status === 503 ? 503 : 502).json({ erro: e.codigo, mensagem: e.message });
    return;
  }
  console.error("[pix] falha inesperada:", e);
  res.status(500).json({ erro: "FALHA", mensagem: "N\xE3o foi poss\xEDvel falar com o provedor de pagamento." });
}
function criarRotasPix() {
  const rotas = Router();
  rotas.post("/pix/webhook", express.text({ type: "*/*", limit: "256kb" }), (req, res) => {
    const segredo = process.env.PIXGO_WEBHOOK_SECRET;
    const bruto = typeof req.body === "string" ? req.body : "";
    const assinatura = String(req.header("x-webhook-signature") ?? "");
    const timestamp = String(req.header("x-webhook-timestamp") ?? "");
    if (segredo) {
      const esperada = crypto3.createHmac("sha256", segredo).update(`${timestamp}.${bruto}`).digest("hex");
      const a = Buffer.from(esperada, "hex");
      const b = Buffer.from(assinatura, "hex");
      if (a.length !== b.length || !crypto3.timingSafeEqual(a, b)) {
        res.status(401).json({ erro: "ASSINATURA_INVALIDA" });
        return;
      }
      if (Math.abs(Date.now() / 1e3 - Number(timestamp)) > 300) {
        res.status(401).json({ erro: "TIMESTAMP_EXPIRADO" });
        return;
      }
    } else {
      console.warn("[pix] webhook recebido sem PIXGO_WEBHOOK_SECRET configurado \u2014 assinatura n\xE3o conferida.");
    }
    try {
      const evento = JSON.parse(bruto || "{}");
      const paymentId = evento?.data?.payment_id;
      const status = evento?.data?.status;
      const ehCompra = status === "completed";
      if (!ehCompra) {
        console.log(`[pix] webhook ${evento?.event} ignorado (status ${status})`);
        res.status(200).json({ received: true, ignorado: true });
        return;
      }
      void registrarWebhook(String(evento?.event ?? "compra"), bruto);
      if (paymentId) {
        const reg = registros.get(paymentId);
        if (reg) {
          reg.status = status;
          reg.confirmadoPeloWebhook = true;
        }
        void atualizarStatusDoacao(paymentId, status);
        console.log(`[pix] compra confirmada para ${paymentId}`);
      }
    } catch {
      res.status(400).json({ erro: "PAYLOAD_INVALIDO" });
      return;
    }
    res.status(200).json({ received: true });
  });
  rotas.use(express.json({ limit: "64kb" }));
  rotas.post("/pix/cobranca", async (req, res) => {
    const ip = req.ip ?? "desconhecido";
    if (passouDoLimite(ip)) {
      res.status(429).json({ erro: "MUITAS_TENTATIVAS", mensagem: "Muitas cobran\xE7as seguidas. Espere alguns minutos." });
      return;
    }
    const valor = Number(req.body?.valor);
    const cpf = String(req.body?.cpf ?? "").replace(/\D/g, "");
    const nome = String(req.body?.nome ?? "").trim();
    const email = String(req.body?.email ?? "").trim();
    const campanha = String(req.body?.campanha ?? "").slice(0, 20).replace(/[^\w-]/g, "");
    if (!Number.isFinite(valor) || valor < VALOR_MINIMO || valor > VALOR_MAXIMO_DOACAO) {
      res.status(400).json({
        erro: "VALOR_INVALIDO",
        mensagem: `O valor precisa ficar entre R$ ${VALOR_MINIMO} e R$ ${VALOR_MAXIMO_DOACAO.toLocaleString("pt-BR")}.`
      });
      return;
    }
    if (!documentoValido(cpf)) {
      res.status(400).json({ erro: "CPF_INVALIDO", mensagem: "Informe um CPF ou CNPJ v\xE1lido." });
      return;
    }
    if (nome.length > 0 && (nome.length < 2 || nome.length > 100)) {
      res.status(400).json({ erro: "NOME_INVALIDO", mensagem: "O nome deve ter de 2 a 100 caracteres." });
      return;
    }
    const externalId = `vk-${campanha || "campanha"}-${Date.now().toString(36)}-${crypto3.randomBytes(3).toString("hex")}`.slice(0, 50);
    try {
      const cobranca = await criarCobranca({
        amount: Number(valor.toFixed(2)),
        description: `Doa\xE7\xE3o para a vaquinha ${campanha || ""}`.trim().slice(0, 200),
        receiver_cpf: cpf,
        receiver_name: nome || void 0,
        receiver_email: email || void 0,
        external_id: externalId,
        webhook_url: process.env.PIXGO_WEBHOOK_URL || void 0
      });
      registros.set(cobranca.payment_id, {
        paymentId: cobranca.payment_id,
        externalId,
        valor,
        status: cobranca.status,
        criadoEm: Date.now(),
        confirmadoPeloWebhook: false
      });
      void registrarDoacao({
        paymentId: cobranca.payment_id,
        valor,
        nome,
        email,
        copiaECola: cobranca.qr_code,
        status: cobranca.status
      });
      res.status(201).json({
        paymentId: cobranca.payment_id,
        valor: cobranca.amount,
        status: cobranca.status,
        copiaECola: cobranca.qr_code,
        imagemQr: cobranca.qr_image_url,
        expiraEm: cobranca.expires_at
      });
    } catch (e) {
      responderErro(res, e);
    }
  });
  rotas.get("/pix/cobranca/:id/dados", async (req, res) => {
    try {
      const d = await consultarDetalhes(req.params.id);
      res.json({
        paymentId: d.payment_id,
        valor: d.amount,
        status: d.status,
        copiaECola: d.qr_code,
        imagemQr: d.qr_image_url,
        expiraEm: d.expires_at
      });
    } catch (e) {
      responderErro(res, e);
    }
  });
  rotas.get("/pix/cobranca/:id", async (req, res) => {
    const id = req.params.id;
    const reg = registros.get(id);
    if (reg?.confirmadoPeloWebhook && ehFinal(reg.status)) {
      res.json({ paymentId: id, status: reg.status, valor: reg.valor, via: "webhook" });
      return;
    }
    try {
      const status = await consultarStatus(id);
      if (reg) reg.status = status.status;
      void atualizarStatusDoacao(id, status.status);
      res.json({
        paymentId: status.payment_id,
        status: status.status,
        valor: status.amount,
        pagador: status.customer_name ?? null,
        via: "consulta"
      });
    } catch (e) {
      responderErro(res, e);
    }
  });
  rotas.get("/pix/config", (_req, res) => {
    res.json({
      configurado: Boolean(process.env.PIXGO_API_KEY),
      valorMinimo: VALOR_MINIMO,
      valorMaximo: VALOR_MAXIMO_DOACAO
    });
  });
  return rotas;
}

// server/index.ts
var raiz = path2.dirname(fileURLToPath(import.meta.url));
var app = express2();
var porta = Number(process.env.PORT ?? 3100);
app.set("trust proxy", 1);
app.use(compression({ level: 6 }));
if (EM_MANUTENCAO) {
  app.use((_req, res) => {
    res.status(503).set("Cache-Control", "no-store").set("Retry-After", "3600").type("html").send(PAGINA_MANUTENCAO);
  });
} else {
  app.use("/api", criarRotasPix());
  const painel = express2.Router();
  app.use("/api", painel);
  void (async () => {
    try {
      const { default: adminRouter } = await Promise.resolve().then(() => (init_admin(), admin_exports));
      painel.use("/admin", express2.json(), adminRouter);
      console.log("Painel admin no ar em /admin");
      const { iniciarDetectorDePagamento: iniciarDetectorDePagamento2 } = await Promise.resolve().then(() => (init_detectorPagamento(), detectorPagamento_exports));
      iniciarDetectorDePagamento2();
    } catch (erro) {
      console.error("Painel admin fora do ar. O site e as doa\xE7\xF5es seguem normais.", erro);
    }
  })();
  const acharPasta = (nome) => [path2.resolve(raiz, nome), path2.resolve(raiz, "..", nome)].find((caminho) => fs2.existsSync(caminho)) ?? path2.resolve(raiz, "..", nome);
  const dist = acharPasta("dist");
  app.use("/admin", express2.static(acharPasta("publico-admin"), { index: "admin.html" }));
  app.use(express2.static(dist, {
    maxAge: "1y",
    etag: false,
    setHeaders(res, path3) {
      if (path3.endsWith(".html")) {
        res.setHeader("Cache-Control", "public, max-age=3600, must-revalidate");
      }
    }
  }));
  app.get("*", (_req, res) => res.sendFile(path2.join(dist, "index.html")));
}
app.listen(porta, () => {
  console.log(`Doar \xE9 Amor no ar em http://localhost:${porta}`);
  if (!process.env.PIXGO_API_KEY) {
    console.warn('Sem PIXGO_API_KEY: o bot\xE3o "Quero Ajudar" abre o modal, mas n\xE3o gera cobran\xE7a.');
  }
});
