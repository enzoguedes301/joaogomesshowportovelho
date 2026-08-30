/*
 * O ÚNICO arquivo que você precisa editar para o painel virar o da SUA oferta.
 *
 * Ele é lido antes do admin.js e fica no `window`, sem build e sem import: o
 * painel inteiro é HTML/CSS/JS puro de propósito, para abrir rápido no celular
 * do dono e nunca depender do build do site que ele acompanha. Um arquivo de
 * configuração que exigisse empacotador quebraria essa promessa.
 *
 * Nada aqui é segredo. Este arquivo é servido ao navegador: senha, token e
 * chave de gateway NÃO entram nele em hipótese nenhuma — eles vivem no seu
 * servidor, atrás do /api/admin/login.
 */

window.PAINEL_CONFIG = {
  /* O nome que aparece na aba do navegador, no login e no topo. */
  marca: 'Doar é Amor - Show João Gomes',

  /*
   * Como o painel chama aquilo que você vende.
   */
  produto: {
    nome: 'Doação',
    plural: 'Doações',
    artigo: 'a',
    /* Prazo prometido na entrega manual, escrito como você promete ao cliente. */
    prazoDeEntrega: 'imediato',
  },

  /*
   * Abas ligadas. Desligar uma some com o botão E com a chamada à API.
   *
   * Serve para quem adota o painel aos poucos: uma oferta sem tráfego pago não
   * tem o que mostrar em "Anúncios", e uma aba vazia ensina o dono a ignorar o
   * painel. Ligue conforme for implementando o contrato — CONTRATO.md diz quais
   * endpoints cada aba exige.
   */
  abas: {
    pedidos: true,
    cobranca: true,
    entregas: true,
    webhooks: true,
    anuncios: true,
    relatorios: true,
    funil: true,
    pagamentos: true,
    acessos: true,
    emails: true,
    boletos: true,
    crm: true,
  },

  /*
   * A mensagem que o botão "Chamar no WhatsApp" abre já escrita.
   *
   * `{nome}` vira o primeiro nome do cliente e `{marca}` vira a marca acima.
   * Deixe no tom de quem escreve à mão: o dono manda isso de um número pessoal,
   * e mensagem com cara de robô é o que faz o cliente não responder.
   */
  whatsapp: {
    /* Só a SAUDAÇÃO. O painel completa sozinho com a oferta, o valor e há
       quanto tempo o Pix está aberto — repetir isso aqui daria frase dobrada. */
    cobranca: 'Oi, {nome}! Aqui é da equipe da {marca}.',
  },

  /*
   * Moeda e local. Trocar aqui muda todo número formatado do painel de uma vez.
   */
  moeda: 'BRL',
  local: 'pt-BR',
  fusoHorario: 'America/Sao_Paulo',
};
