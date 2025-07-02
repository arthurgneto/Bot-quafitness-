const { create } = require('@wppconnect-team/wppconnect');

const estados = new Map(); // Armazena estado dos contatos
const timeouts = new Map(); // Armazena timeouts por número

function emHorarioComercial() {
  const agora = new Date();
  const hora = agora.getHours();
  const dia = agora.getDay(); // 0 = domingo, 6 = sábado
  if (dia === 0) return false;
  if (dia === 6) return hora >= 8 && hora < 12;
  return hora >= 6 && hora < 21.5;
}

function comMarcaDagua(texto) {
  return `${texto}\n\n💻 Produzido por Hexatec`;
}

const menu = comMarcaDagua(`🏋️ *Academia Aquafitness* – Escolha uma opção:

1️⃣ Musculação
2️⃣ Hidroginástica
3️⃣ Natação Adulto
4️⃣ Funcional Kids
5️⃣ Natação Infantil
6️⃣ Natação Infantil + Funcional Kids
7️⃣ Serviços (Taxas)
8️⃣ Avaliações (Física e Nutricional)
9️⃣ Pilates Individual
🔟 Pilates em Grupo
1️⃣1️⃣ Pacotes de Avaliação
1️⃣2️⃣ Horários das Aulas
1️⃣3️⃣ Localização
1️⃣4️⃣ Falar com atendente`);

create({
  session: 'academia',
  headless: true,
  useChrome: false,
  puppeteerOptions: {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  },
  catchQR: (base64Qr, asciiQR) => {
    console.clear();
    console.log('📲 Escaneie o QR Code abaixo para conectar o WhatsApp:\n');
    console.log(asciiQR);
  },
})
  .then((client) => {
    console.log('🤖 Bot iniciado com sucesso!');

    client.onMessage(async (msg) => {
      // 🛑 Filtros para não responder a si mesmo, atualizações, status e canais
      if (msg.fromMe || msg.from === msg.to || msg.from.includes('broadcast') || msg.from.includes('status')) {
        return;
      }

      const contato = msg.from;
      const texto = msg.body?.trim().toLowerCase();
      const estado = estados.get(contato) || {};

      if (texto === 'menu') {
        estados.set(contato, { iniciado: true });
        return client.sendText(contato, `🔁 Atendimento reiniciado!\n\n${menu}`);
      }

      if (estado.coletandoDados) {
        if (!estado.nome) {
          estado.nome = msg.body;
          estados.set(contato, estado);
          return client.sendText(contato, '✅ Agora, informe seu interesse (ex: musculação, pilates, avaliação, hidroginástica, natação):');
        } else if (!estado.interesse) {
          estado.interesse = msg.body;
          estados.set(contato, estado);
          return client.sendText(contato, '📞 Por fim, informe seu número com DDD:');
        } else if (!estado.telefone) {
          estado.telefone = msg.body;

          await client.sendText(contato, comMarcaDagua('✅ Obrigado! Seus dados foram enviados ao atendente. Entraremos em contato em breve. Caso queira reiniciar, digite *menu*.'));

          const msgFinal = `📥 *Novo Contato - Academia Aquafitness*\n\n👤 Nome: ${estado.nome}\n🎯 Interesse: ${estado.interesse}\n📱 Telefone: ${estado.telefone}\n\n🕒 Captado via bot.`;

          const numero = '5514997246169@c.us';

          if (numero.endsWith('@c.us')) {
            try {
              const status = await client.checkNumberStatus(numero);
              if (status && status.canReceiveMessage) {
                await client.sendText(numero, msgFinal);
              } else {
                console.warn('⚠️ Número não pode receber mensagens.');
              }
            } catch (err) {
              console.error('❌ Erro ao verificar/enviar para atendente:', err);
            }
          } else {
            console.warn('🚫 Número inválido (pode ser grupo, broadcast ou status). Mensagem bloqueada.');
          }

          estados.delete(contato);

          const timeout = setTimeout(() => {
            client.sendText(contato, '🔒 Atendimento automático encerrado. Para reiniciar, digite *menu*.');
            timeouts.delete(contato);
          }, 2 * 60 * 1000);
          timeouts.set(contato, timeout);

          return;
        }
      }

      if (!estado.iniciado) {
        const saudacao = emHorarioComercial()
          ? '👋 Olá! Seja bem-vindo à *Academia Aquafitness*!'
          : '👋 Olá! No momento estamos fora do horário de atendimento humano.';
        await client.sendText(contato, `${saudacao}\n\n${menu}`);
        estados.set(contato, { iniciado: true });
        return;
      }

      switch (texto) {
        case '1':
          return client.sendText(contato, `🏋️ *Musculação*\n\nInclui Funcional + Fit Dance\n📆 Mensal: R$ 110,00\n📆 Semestral: R$ 85,00\n📆 Anual: R$ 80,00\n💳 Avulso: R$ 20,00`);
        case '2':
          return client.sendText(contato, `💧 *Hidroginástica*\n\nInclui Funcional + Fit Dance\n2x Semana - Mensal: R$ 165,00\n3x Semana - Mensal: R$ 205,00\n2x Semana - Semestral: R$ 145,00\n3x Semana - Semestral: R$ 185,00`);
        case '3':
          return client.sendText(contato, `🏊 *Natação Adulto*\n\nInclui Funcional + Fit Dance\n2x Mensal: R$ 175,00\n3x Mensal: R$ 215,00\n2x Semestral: R$ 155,00\n3x Semestral: R$ 195,00`);
        case '4':
          return client.sendText(contato, `👧 *Funcional Kids*\n\n2x Mensal: R$ 85,00\n2x Semestral: R$ 75,00\n🕒 Terça e Quinta às 18h10`);
        case '5':
          return client.sendText(contato, `🧒 *Natação Infantil*\n\n2x Mensal: R$ 175,00\n3x Mensal: R$ 225,00\n2x Semestral: R$ 155,00\n3x Semestral: R$ 205,00`);
        case '6':
          return client.sendText(contato, `👦 *Natação Infantil + Funcional Kids*\n\n2x Mensal: R$ 195,00\n3x Mensal: R$ 240,00\n2x Semestral: R$ 180,00\n3x Semestral: R$ 225,00`);
        case '7':
          return client.sendText(contato, `💼 *Serviços*\n\n📌 Taxa de Avaliação Inicial: R$ 35,00\n📌 Taxa de Matrícula: R$ 20,00`);
        case '8':
          return client.sendText(contato, `🧪 *Avaliações*\n\n📊 Avaliação Física: R$ 100,00\n🥗 Avaliação Nutricional: R$ 250,00`);
        case '9':
          return client.sendText(contato, `🧘 *Pilates Individual*\n\nMensal: 1x R$ 170,00 | 2x R$ 290,00 | 3x R$ 390,00\nSemestral: 1x R$ 150,00 | 2x R$ 250,00 | 3x R$ 345,00\nAvulso: R$ 50,00`);
        case '10':
          return client.sendText(contato, `🧘‍♀️ *Pilates em Grupo (até 3 pessoas)*\n\nMensal: 1x R$ 130,00 | 2x R$ 200,00 | 3x R$ 280,00\nSemestral: 1x R$ 118,00 | 2x R$ 180,00 | 3x R$ 260,00\nAvulso: R$ 35,00`);
        case '11':
          return client.sendText(contato, `📊 *Pacotes Avaliação*\n\nBioimpedância: 12x R$ 9,90\nAdipômetro: 12x R$ 24,90`);
        case '12':
          return client.sendText(contato, `🕒 *Horários das Aulas – Academia Aquafitness* 🕒

📚 *Aulas*
• 17h - Funcional (2ª, 3ª, 4ª)
• 18h30 - Funcional (2ª, 4ª)
• 19h30 - FITDANCE (2ª)
• 20h30 - GAP (4ª)

🏊‍♀️ *Piscina – 2ª, 4ª e 6ª*
• 07h - Natação Adulto (iniciante/avançado)
• 08h - Hidroginástica
• 09h - Natação Infantil (7 a 12 anos)
• 09h50 - Natação Infantil (2 a 6 anos)
• 16h30 - Natação Adulto (iniciante/avançado)
• 17h20 - Natação Infantil (3 a 12 anos)
• 18h10 - Natação Infantil (3 a 12 anos)
• 19h10 - Hidroginástica
• 20h - Natação Adulto (iniciante/avançado)

🏊‍♂️ *Piscina – 3ª e 5ª*
• 06h - Natação Avançado
• 13h - Natação Avançado
• 14h - Natação Avançado
• 15h - Natação Infantil (2 a 4 anos)
• 16h - Hidro Power
• 16h - Natação Infantil (3 a 6 anos)
• 17h - Natação Infantil (2 a 12 anos)
• 18h - Natação Infantil (2 a 6 anos)
• 18h - Natação Adulto (iniciante/avançado)
• 19h10 - Natação Infantil (3 a 12 anos)`);
      case '13':
        return client.sendText(contato, `📍 *Endereço:*\nR. Maestro Oscár Mendes, 1-135 - Novo Jardim Pagani, Bauru - SP, 17024-270\n📞 (14) 99876-0595\n🌐 Google Maps: https://www.google.com/maps/place/aquafitness+bauru/data=!4m2!3m1!1s0x94bf67d90cebcf13:0x37cf3654375fcc9?sa=X&ved=1t:242&ictx=111`);
      case '14':
        estados.set(contato, { coletandoDados: true });
        return client.sendText(contato, '👋 Para te ajudar melhor, informe seu *nome completo*:');
      default:
        return client.sendText(contato, '❓ Opção inválida. Digite o número correspondente ou envie *menu* para ver novamente:\n\n' + menu);
    }
  });
})
.catch((erro) => {
  console.error('❌ Erro ao iniciar o bot:', erro);
});
