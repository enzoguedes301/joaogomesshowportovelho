import { Router, Request, Response } from 'express';
import { prisma } from './banco';
import * as crypto from 'crypto';

const router = Router();

// Middleware para verificar sessão
const verificarSessao = async (req: Request, res: Response, next: Function) => {
  const token = req.headers['x-admin-sessao'] as string;

  if (!token) {
    return res.status(401).json({ success: false, error: 'sem_sessao', message: 'Sessão não encontrada' });
  }

  const sessao = await prisma.sessaoAdmin.findUnique({ where: { token } });

  if (!sessao || new Date() > sessao.validoAte) {
    return res.status(401).json({ success: false, error: 'sessao_invalida', message: 'Sessão expirou' });
  }

  (req as any).sessao = sessao;
  next();
};

/*
 * Diagnóstico do armazenamento, sem exigir login — porque o problema que ele
 * existe para detectar é justamente o login não funcionar.
 *
 * Responde só dois sim/não: se a gravação sobrevive e se já existe senha. Nada
 * de caminhos de disco, contagem de doações ou dados de doador: a rota é
 * pública e serve para diagnosticar, não para contar a vida da campanha.
 */
router.get('/saude', async (_req: Request, res: Response) => {
  try {
    const marca = `saude-${Date.now()}`;
    await prisma.evento.create({ data: { doacaoId: marca, tipo: 'saude' } });
    const achado = await prisma.evento.findUnique({ where: { doacaoId: marca } });
    await prisma.evento.deleteMany({ where: { doacaoId: marca } });

    const config = await prisma.configApp.findUnique({ where: { id: 'config' } });

    return res.json({
      success: true,
      data: { gravando: Boolean(achado), senhaDefinida: Boolean(config?.senhaAdmin) },
    });
  } catch (erro: any) {
    return res.json({
      success: true,
      data: { gravando: false, senhaDefinida: false, erro: String(erro?.message ?? erro) },
    });
  }
});

// LOGIN
router.post('/login', async (req: Request, res: Response) => {
  const { senha } = req.body;

  if (!senha) {
    return res.status(400).json({ success: false, error: 'senha_obrigatoria', message: 'Senha é obrigatória' });
  }

  /*
   * A senha vive no banco, que nasce vazio. Sem nada gravado, vale a do .env —
   * e, se nem ela existir, a PRIMEIRA senha digitada vira a senha do painel.
   *
   * Esse último caso existe porque o servidor desta campanha só recebe `git
   * pull`: não há como criar variável de ambiente lá sem abrir um terminal, e
   * sem isso o painel ficaria trancado para o próprio dono. A alternativa —
   * deixar uma senha escrita no código — seria pior: o repositório é público.
   *
   * O preço é claro: enquanto ninguém definiu a senha, quem chegar primeiro
   * fica com o painel. Por isso o dono precisa entrar assim que publicar.
   */
  let config = await prisma.configApp.findUnique({ where: { id: 'config' } });
  let acabouDeDefinir = false;

  if (!config?.senhaAdmin) {
    const senhaInicial = process.env.ADMIN_PASSWORD_HASH || senha;
    acabouDeDefinir = !process.env.ADMIN_PASSWORD_HASH;

    config = await prisma.configApp.upsert({
      where: { id: 'config' },
      update: { senhaAdmin: senhaInicial },
      create: { id: 'config', senhaAdmin: senhaInicial },
    });

    if (acabouDeDefinir) {
      console.log('[painel] senha definida no primeiro acesso.');
    }
  }

  const senhaCorreta = Boolean(config?.senhaAdmin) && config?.senhaAdmin === senha;

  if (!senhaCorreta) {
    return res.status(400).json({ success: false, error: 'senha_incorreta', message: 'Senha incorreta' });
  }

  const horas = Number(process.env.ADMIN_SESSION_HOURS) || 12;
  const token = crypto.randomBytes(32).toString('hex');
  const validoAte = new Date(Date.now() + horas * 60 * 60 * 1000);

  await prisma.sessaoAdmin.create({
    data: { token, validoAte, papel: 'dono' }
  });

  return res.json({
    success: true,
    data: { token, horas, papel: 'dono' }
  });
});

// LISTAR DOAÇÕES
router.get('/doacoes', verificarSessao, async (req: Request, res: Response) => {
  const dias = parseInt(req.query.dias as string) || 7;

  const dataInicial = dias === -1
    ? new Date(0)
    : new Date(Date.now() - dias * 24 * 60 * 60 * 1000);

  const doacoes = await prisma.doacao.findMany({
    where: { criadoEm: { gte: dataInicial } },
    orderBy: { criadoEm: 'desc' },
    include: { eventos: true }
  });

  const total = doacoes.reduce((sum, d) => sum + d.valor, 0);

  return res.json({
    success: true,
    data: {
      doacoes: doacoes.map(d => ({
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
      papel: (req as any).sessao.papel
    }
  });
});

// MARCAR COMO PAGO
router.post('/doacoes/:id/marcar-pago', verificarSessao, async (req: Request, res: Response) => {
  if ((req as any).sessao.papel !== 'dono') {
    return res.status(403).json({ success: false, error: 'sem_permissao', message: 'Apenas dono pode marcar como pago' });
  }

  const doacao = await prisma.doacao.findUnique({ where: { id: req.params.id } });

  if (!doacao) {
    return res.status(404).json({ success: false, error: 'nao_encontrado', message: 'Doação não encontrada' });
  }

  const jaEstavaPago = doacao.status === 'pago';

  if (!jaEstavaPago) {
    await prisma.doacao.update({
      where: { id: req.params.id },
      data: {
        status: 'pago',
        entregueEm: new Date()
      }
    });

    await prisma.evento.create({
      data: {
        doacaoId: req.params.id,
        tipo: 'pago_manual',
        dados: JSON.stringify({ por: 'admin' })
      }
    });
  }

  const doacaoAtualizada = await prisma.doacao.findUnique({ where: { id: req.params.id } });

  return res.json({
    success: true,
    data: { jaEstavaPago, doacao: doacaoAtualizada }
  });
});

// CANCELAR DOAÇÃO
router.post('/doacoes/:id/cancelar', verificarSessao, async (req: Request, res: Response) => {
  if ((req as any).sessao.papel !== 'dono') {
    return res.status(403).json({ success: false, error: 'sem_permissao', message: 'Sem permissão' });
  }

  const doacao = await prisma.doacao.findUnique({ where: { id: req.params.id } });

  if (!doacao) {
    return res.status(404).json({ success: false, error: 'nao_encontrado', message: 'Doação não encontrada' });
  }

  await prisma.doacao.update({
    where: { id: req.params.id },
    data: { status: 'cancelado' }
  });

  await prisma.evento.create({
    data: {
      doacaoId: req.params.id,
      tipo: 'cancelado'
    }
  });

  return res.json({ success: true, data: { cancelado: true } });
});

// RELATÓRIO
router.get('/relatorios', verificarSessao, async (req: Request, res: Response) => {
  const dias = parseInt(req.query.dias as string) || 7;

  const dataInicial = dias === -1
    ? new Date(0)
    : new Date(Date.now() - dias * 24 * 60 * 60 * 1000);

  const doacoes = await prisma.doacao.findMany({
    where: { criadoEm: { gte: dataInicial } }
  });

  const totais = {
    valor: doacoes.reduce((sum, d) => sum + d.valor, 0),
    quantidade: doacoes.length,
    pagas: doacoes.filter(d => d.status === 'pago').length
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

export default router;
