import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const router = Router();

const PIXGO_API_KEY = process.env.PIXGO_API_KEY || '';
const FACEBOOK_PIXEL_ID = process.env.FACEBOOK_PIXEL_ID || '';
const FACEBOOK_TOKEN = process.env.FACEBOOK_API_TOKEN || '';

// Webhook do Pixgo
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const { data } = req.body;

    await prisma.webhookPixgo.create({
      data: {
        tipo: data.type,
        dados: JSON.stringify(data),
        processado: false
      }
    });

    if (data.type === 'charge.completed' || data.type === 'charge.updated') {
      const pixgoPaymentId = data.id || data.charge_id;

      const doacao = await prisma.doacao.findUnique({
        where: { pixgoPaymentId }
      });

      if (doacao && doacao.status === 'pendente') {
        await prisma.doacao.update({
          where: { id: doacao.id },
          data: {
            status: 'pago',
            pixgoStatus: 'completed',
            entregueEm: new Date()
          }
        });

        await prisma.evento.create({
          data: {
            doacaoId: doacao.id,
            tipo: 'pago',
            dados: JSON.stringify({ pixgoStatus: data.status })
          }
        });

        await enviarFacebookPixel(doacao);
      }
    }

    return res.json({ success: true });
  } catch (erro) {
    console.error('Erro webhook:', erro);
    return res.status(500).json({ success: false });
  }
});

// Criar doação com cobrança Pixgo
router.post('/criar-doacao', async (req: Request, res: Response) => {
  try {
    const { nome, email, whatsapp, valor, mensagem } = req.body;

    if (!nome || !email || !valor) {
      return res.status(400).json({
        success: false,
        error: 'dados_incompletos',
        message: 'Nome, email e valor são obrigatórios'
      });
    }

    const doacao = await prisma.doacao.create({
      data: {
        nome,
        email,
        whatsapp,
        valor: Math.round(valor * 100),
        mensagem,
        status: 'pendente'
      }
    });

    // Criar cobrança Pixgo
    const cobranca = await axios.post(
      'https://api.pixgo.com/charges',
      {
        amount: valor,
        description: `Doação de ${nome}`,
        customer: {
          email,
          name: nome,
          phone: whatsapp
        },
        metadata: { doacaoId: doacao.id }
      },
      {
        headers: {
          'Authorization': `Bearer ${PIXGO_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    await prisma.doacao.update({
      where: { id: doacao.id },
      data: {
        pixgoPaymentId: cobranca.data.id,
        pixKey: cobranca.data.pix_key
      }
    });

    return res.json({
      success: true,
      data: {
        doacaoId: doacao.id,
        pixKey: cobranca.data.pix_key,
        qrCode: cobranca.data.qr_code,
        valor: doacao.valor
      }
    });
  } catch (erro) {
    console.error('Erro:', erro);
    return res.status(500).json({ success: false, error: 'erro_ao_criar' });
  }
});

// Enviar evento para Facebook
async function enviarFacebookPixel(doacao: any) {
  try {
    await axios.post(
      `https://graph.instagram.com/v18.0/${FACEBOOK_PIXEL_ID}/events`,
      {
        data: [
          {
            event_name: 'Purchase',
            event_time: Math.floor(Date.now() / 1000),
            user_data: {
              em: doacao.email,
              ph: doacao.whatsapp
            },
            custom_data: {
              value: doacao.valor / 100,
              currency: 'BRL'
            }
          }
        ]
      },
      { params: { access_token: FACEBOOK_TOKEN } }
    );
  } catch (erro) {
    console.error('Erro Facebook:', erro);
  }
}

export default router;
