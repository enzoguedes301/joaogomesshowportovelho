import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

/**
 * Banco em arquivo JSON, sem dependência nenhuma.
 *
 * A campanha roda num servidor onde só o `git pull` acontece sozinho: não há
 * `npm install` no deploy. Qualquer biblioteca nova aqui significa esperar
 * alguém abrir um terminal no VPS — e enquanto isso o painel fica cego e o
 * anúncio gasta sem saber quem comprou. Foi exatamente o que aconteceu: o
 * Prisma entrou no código, nunca foi instalado, e derrubou o site.
 *
 * Por isso este arquivo usa só `node:fs`. Um JSON aguenta com folga o volume de
 * uma vaquinha; se um dia virar gargalo, troca-se a implementação sem tocar em
 * quem chama, porque a interface imita a do Prisma.
 *
 * Uso: `await prisma.doacao.findMany({ where: { criadoEm: { gte: data } } })`.
 */

interface Registro {
  id: string;
  [campo: string]: unknown;
}

interface Conteudo {
  doacao: Registro[];
  evento: Registro[];
  webhookPixgo: Registro[];
  sessaoAdmin: Registro[];
  configApp: Registro[];
}

const VAZIO: Conteudo = { doacao: [], evento: [], webhookPixgo: [], sessaoAdmin: [], configApp: [] };

/**
 * Onde o arquivo mora — e por que NÃO é dentro do projeto.
 *
 * O deploy deste servidor sincroniza a pasta do projeto a cada envio: um
 * arquivo guardado ali é apagado junto. Foi o que aconteceu — a senha do painel
 * voltava a ficar em aberto e as doações registradas sumiam, dando a impressão
 * de que nada chegava.
 *
 * Por isso a preferência é a pasta pessoal do usuário do servidor, que nenhum
 * deploy toca. `DADOS_DIR` permite apontar para outro lugar (um disco montado,
 * por exemplo), e a pasta do projeto fica só como último recurso — melhor
 * gravar em lugar frágil do que não gravar.
 */
function escolherArquivo(): string {
  const candidatos = [
    process.env.DADOS_DIR,
    path.join(os.homedir(), '.doar-e-amor'),
    path.resolve(process.cwd(), 'dados'),
  ].filter(Boolean) as string[];

  for (const pasta of candidatos) {
    try {
      fs.mkdirSync(pasta, { recursive: true });
      // Escrever de verdade: permissão só se confirma tentando.
      const teste = path.join(pasta, '.escrita-ok');
      fs.writeFileSync(teste, 'ok');
      fs.unlinkSync(teste);
      return path.join(pasta, 'doacoes.json');
    } catch {
      // Sem permissão aqui; tenta o próximo.
    }
  }

  return path.resolve(process.cwd(), 'dados', 'doacoes.json');
}

const ARQUIVO = escolherArquivo();
console.log(`[banco] gravando em ${ARQUIVO}`);

let cache: Conteudo | null = null;
/** Momento do arquivo quando o cache foi montado, para saber se ficou velho. */
let carimboDoCache = -1;

/**
 * Relê o arquivo sempre que ele muda no disco.
 *
 * Sem isso, cada processo do servidor guardaria sua própria cópia para sempre:
 * o pm2 costuma subir mais de um, e aí um grava a sessão do painel enquanto o
 * outro jura que ela não existe — o dono faz login e cai na tela seguinte.
 * A comparação de mtime custa quase nada e mantém todos vendo o mesmo estado.
 */
function carregar(): Conteudo {
  let carimbo = -1;
  try {
    carimbo = fs.statSync(ARQUIVO).mtimeMs;
  } catch {
    // Arquivo ainda não existe: o cache vazio serve.
  }

  if (cache && carimbo === carimboDoCache) return cache;

  try {
    const lido = JSON.parse(fs.readFileSync(ARQUIVO, 'utf8')) as Partial<Conteudo>;
    cache = { ...structuredClone(VAZIO), ...lido };
  } catch {
    // Primeira execução, ou arquivo corrompido. Começar vazio é melhor que
    // derrubar o servidor — as doações em si vivem na PixGo, não aqui.
    cache = structuredClone(VAZIO);
  }
  carimboDoCache = carimbo;
  return cache;
}

/**
 * Grava por arquivo temporário + rename. O rename é atômico: se a máquina cair
 * no meio da escrita, o arquivo antigo continua íntegro em vez de virar um JSON
 * pela metade que levaria o histórico junto.
 */
function salvar(): void {
  const dados = cache ?? carregar();
  fs.mkdirSync(path.dirname(ARQUIVO), { recursive: true });
  const temporario = `${ARQUIVO}.${process.pid}.tmp`;
  fs.writeFileSync(temporario, JSON.stringify(dados, null, 2), 'utf8');
  fs.renameSync(temporario, ARQUIVO);
  // O cache acabou de virar o arquivo: guardar o novo carimbo evita reler à toa
  // na próxima leitura deste mesmo processo.
  try {
    carimboDoCache = fs.statSync(ARQUIVO).mtimeMs;
  } catch {
    carimboDoCache = -1;
  }
}

function agora(): string {
  return new Date().toISOString();
}

/** Datas voltam como Date, e não texto, porque quem chama faz `.toISOString()`. */
function reidratar(registro: Registro): any {
  const saida: any = { ...registro };
  for (const campo of ['criadoEm', 'atualizadoEm', 'entregueEm', 'validoAte']) {
    if (typeof saida[campo] === 'string') saida[campo] = new Date(saida[campo]);
  }
  return saida;
}

/** Suporta os filtros que o painel realmente usa: igualdade e `criadoEm: { gte }`. */
function combina(registro: Registro, onde: Record<string, any> = {}): boolean {
  return Object.entries(onde).every(([campo, esperado]) => {
    const atual = registro[campo];
    if (esperado && typeof esperado === 'object' && 'gte' in esperado) {
      return new Date(String(atual)).getTime() >= new Date(esperado.gte).getTime();
    }
    return atual === esperado;
  });
}

function tabela(nome: keyof Conteudo) {
  const linhas = () => carregar()[nome];

  return {
    async findMany({ where, orderBy }: any = {}) {
      let saida = linhas().filter((r) => combina(r, where));
      if (orderBy) {
        const [campo, direcao] = Object.entries(orderBy)[0] as [string, string];
        saida = [...saida].sort((a, b) => {
          const x = new Date(String(a[campo])).getTime();
          const y = new Date(String(b[campo])).getTime();
          return direcao === 'desc' ? y - x : x - y;
        });
      }
      // `include: { eventos: true }` é aceito e devolvido vazio: o painel lê a
      // lista, mas nenhuma tela depende do conteúdo dela hoje.
      return saida.map((r) => ({ ...reidratar(r), eventos: [] }));
    },

    async findUnique({ where }: any) {
      const achado = linhas().find((r) => combina(r, where));
      return achado ? reidratar(achado) : null;
    },

    async create({ data }: any) {
      const novo: Registro = {
        id: data.id ?? crypto.randomUUID(),
        criadoEm: agora(),
        atualizadoEm: agora(),
        ...data,
      };
      linhas().push(novo);
      salvar();
      return reidratar(novo);
    },

    async update({ where, data }: any) {
      const alvo = linhas().find((r) => combina(r, where));
      if (!alvo) throw new Error(`registro não encontrado em ${nome}`);
      Object.assign(alvo, data, { atualizadoEm: agora() });
      salvar();
      return reidratar(alvo);
    },

    async upsert({ where, update, create }: any) {
      const alvo = linhas().find((r) => combina(r, where));
      if (alvo) {
        Object.assign(alvo, update, { atualizadoEm: agora() });
        salvar();
        return reidratar(alvo);
      }
      return this.create({ data: { ...where, ...create } });
    },

    async count({ where }: any = {}) {
      return linhas().filter((r) => combina(r, where)).length;
    },

    async deleteMany({ where }: any = {}) {
      const antes = linhas().length;
      const mantidos = linhas().filter((r) => !combina(r, where));
      carregar()[nome] = mantidos;
      salvar();
      return { count: antes - mantidos.length };
    },
  };
}

export const prisma = {
  doacao: tabela('doacao'),
  evento: tabela('evento'),
  webhookPixgo: tabela('webhookPixgo'),
  sessaoAdmin: tabela('sessaoAdmin'),
  configApp: tabela('configApp'),
};
