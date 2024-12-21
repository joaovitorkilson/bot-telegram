import { Telegraf, Markup, session } from 'telegraf'
import { getAuthToken, createPayment, confirmPayment } from './routes.js'
import { getPixCode } from './crawler.js'

// telegram
const bot = new Telegraf(process.env.token)

bot.use(
  session({
    getSessionKey: (ctx) => ctx.chat?.id?.toString(), // Sessão única por chat
    ttl: 600, // Sessão expira após 10 minutos (600 segundos) de inatividade
  })
);

// Middleware para garantir que ctx.session existe
bot.use((ctx, next) => {
  if (!ctx.session) ctx.session = {}; // Inicializa a sessão se estiver indefinida
  return next();
});

// Botões de compra dos planos
const botoes = Markup.inlineKeyboard([
  Markup.button.callback('Plano Mensal: R$ 10,00', 'plan1'),
  Markup.button.callback('Plano Vitalício: R$ 15,00', 'plan2'),
], { columns: 1 })

const confirm = Markup.inlineKeyboard([
  Markup.button.callback('Confirmar', 'yes'),
])

// Mandar mensagem de boas vindas /start e renderiza botoes
bot.start(async ctx => {
  const name = ctx.update.message.from.first_name;
  await ctx.reply(`Seja bem vindo ${name}!`)
  await ctx.replyWithHTML(`Você está na página de compra do: <b>${process.env.channel}</b>`)
  await ctx.reply(`Escolha o plano que deseja adquirir:`, botoes)
})

// Renderiza a escolha do plano

bot.action('plan1', async ctx => {
  ctx.replyWithHTML('Você selecionou o plano <b>mensal</b>! (R$ 10,00)')
  await ctx.reply('Aguarde enquanto geramos o link do pix...')
  ctx.session.plan = 1
  ctx.session.auth_token = await getAuthToken().then(r => r.data.access_token)
  ctx.session.paymentResponse = await createPayment(1, ctx.session.auth_token).then(r => r.data)
  ctx.session.pix_code = await getPixCode(ctx.session.paymentResponse.redirectUrl)
  await ctx.replyWithHTML(`<code>${ctx.session.pix_code}</code>`)
  await ctx.reply('Cole o código no aplicativo do seu banco, o link estará ativo por 3 minutos!')
  await ctx.reply('Quando realizar o pagamento favor clicar em confirmar', confirm)
})


bot.action('plan2',async ctx => {
  ctx.replyWithHTML('Você selecionou o plano <b>vitalício</b>! (R$ 15,00)')
  await ctx.reply('Aguarde enquanto geramos o link do pix...')
  ctx.session.plan = 2
  ctx.session.auth_token = await getAuthToken().then(r => r.data.access_token)
  ctx.session.paymentResponse = await createPayment(2, ctx.session.auth_token).then(r => r.data)
  ctx.session.pix_code = await getPixCode(ctx.session.paymentResponse.redirectUrl)
  await ctx.replyWithHTML(`<code>${ctx.session.pix_code}</code>`)
  await ctx.reply('Cole o código no aplicativo do seu banco, o link estará ativo por 3 minutos!')
  await ctx.reply('Quando realizar o pagamento favor clicar em confirmar', confirm)
})

bot.action('yes', async ctx => {
  try {
    const { auth_token, paymentResponse } = ctx.session

    if (!auth_token || !paymentResponse) {
      await ctx.reply('Nenhuma transação ativa encontrada. Por favor selecione um plano novamente digitando "/start"')
      return
    }
    const response = await confirmPayment(auth_token); // Aguarda o resultado de confirmPayment
    let isConfirmed = false;

    for (let index = 0; index < response.data.length; index++) {
      if (response.data[index].reference === paymentResponse.reference) {
        isConfirmed = true;
        break;
      }
    }

    // Responde com base no resultado
    if (isConfirmed) {
      if (ctx.session.plan == 1) {
        await bot.telegram.sendMessage(process.env.id_owner, `Venda do plano mensal do ${process.env.channel} no valor de R$10,00 realizada.`)
      } else if (ctx.session.plan == 2) {
        await bot.telegram.sendMessage(process.env.id_owner, `Venda do plano mensal do ${process.env.channel} no valor de R$15,00 realizada.`)
      } else {
        console.log('erro')
      }
      await ctx.reply('Pagamento confirmado! Agradecemos a confiança!');
      await ctx.replyWithHTML(`Link do <b>${process.env.channel}</b>: ${process.env.link_channel}`)
      // limpa os dados da sessão após confirmar o pagamento
      ctx.session = null
    } else {
      await ctx.reply('Pagamento não encontrado. Favor clicar em Confirmar quando tiver realizado o pagamento', confirm);
    }
  } catch (error) {
    console.error(error); // Loga o erro para depuração
    await ctx.reply('Ocorreu um erro ao confirmar o pagamento. Tente novamente mais tarde.');
  }
});


bot.launch()