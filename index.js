require('colors');
const fs         = require('fs'),
      Discord    = require('discord.js'),
      bot        = new Discord.Client(),
      prompts    = require('prompts'),
      CryptoJS   = require('crypto-js'),
      fetch      = require('node-fetch'),
      configPath = process.cwd() + '/config.json';

let config       = '',
    configPrefix = '',
    configToken  = '';

process.title = 'Renegadowsz - gene1ry0dan';

fs.promises.access(configPath, fs.constants.F_OK)
  .then(() => login())
  .catch(() => register());

process.on('SIGINT', () => exitSelect());

bot.on('message', (message) => {
    if (message.author.id !== bot.user.id) return;
    if (!message.content.startsWith(config.prefix)) return;

    let msg                   = message.content,
        msgArg                = msg.slice(configPrefix.length).split(/ +/),
        msgCommand            = msgArg.shift().toLowerCase(),
        msgWithoutCommandName = msg.slice((configPrefix + msgCommand + 1).length),
        msgWithoutCmd         = msgArg[0] ? msgWithoutCommandName.slice(msgArg[0].length + 1 /*+1 for space*/) : '';

  
    if (msgCommand === 'help') {
        message.delete().then(() => displayCommands());
    }

   
    /**
     * Apague mensagens de uma dm
     */
    if (msgCommand === 'clear' || msgCommand === 'apagar') message.delete().then(() => {
        let numberMsg = parseInt(msgArg[0], 10);
        if (isNaN(numberMsg)) return console.log('Argumento inválido'.red);

        massFetchMessages(message.channel, numberMsg).then(messages => {
            let msg_array = messages.filter(m => m.author.id === bot.user.id).slice(0, numberMsg),
                totalMsg  = msg_array.length,
                delMsg    = '';

            if (totalMsg <= 0) return console.log('Não há mensagens para apagar.'.red);

            if (message.channel.type === 'dm') {
                delMsg = `${message.channel.recipient.username}#${message.channel.recipient.discriminator}`;
            } else if (message.channel.type === 'group') {
                delMsg = `a Group`;
            } else {
                delMsg = `${message.channel.guild.name} -> ${message.channel.name}`;
            }

            console.log(`Apagando %s mensagens em %s.`.cyan, totalMsg.toString().bold, delMsg.bold);

            msg_array.filter(m => !m.system).map(m => m.delete()
                                                       .then(() => console.log(`Apagado %s em %s.`.cyan, m.content.bold, delMsg.bold))
                                                       .catch(() => console.log(`Não foi possível deletar %s em %s.`.red, m.content.bold, delMsg.bold)));
        }).catch(() => console.log(`Não foi possível carregar mensagens.`.red));
    });

    /**
     * Apague todas as mensagens de uma dm
     */
    if (msgCommand === 'clearall' || msgCommand === 'apagarg') message.delete().then(() => {
        bot.user.client.users.forEach(member => {
            if (!bot.users.get(member.id).dmChannel) return;

            massFetchMessages(bot.users.get(member.id).dmChannel).then(messages => {
                let msg_array = messages.filter(m => m.author.id === bot.user.id),
                    totalMsg  = msg_array.length,
                    delMsg    = `${member.username}#${member.discriminator}`;

                if (totalMsg <= 0) return;

                console.log(`Apagando %s mensagens de %s`.cyan, totalMsg.toString().bold, `${member.username}#${member.discriminator}`.bold);

                msg_array.filter(m => !m.system).map(m => m.delete()
                                                           .then(() => console.log(`Apagado %s em %s.`.cyan, m.content.bold, delMsg.bold))
                                                           .catch(() => console.log(`Não foi possível deletar %s em %s.`.red, m.content.bold, delMsg.bold)));
            }).catch(() => console.log(`Não foi possível carregar mensagens de %s`.red, `${member.username}#${member.discriminator}`.bold));
        });

    });

    if (msgCommand === 'backup') message.delete().then(() => {
        const friends = bot.user.friends.array(),
              guilds  = bot.guilds.array();

        try {
            fs.writeFileSync('backup.json', JSON.stringify({
                friends: friends,
                guilds: guilds,
            }));
            console.log(`Backup com sucesso de: ${friends.length.toString().bold} amigos e ${guilds.length.toString().bold} servers.`.cyan);
        } catch {
            console.log('Não foi possível concluir o backup.'.red);
        }
    });

    /**
     * Restaura seus amigos de um backup
     */
    if (msgCommand === 'restaurar') message.delete().then(() => {
        if (fs.existsSync('backup.json') === false) {
            return console.log('Não foi possível encontrar seu backup.'.red);
        }

        const friends = fs.readFileSync('backup.json', 'utf-8');
        let jsonFriends = JSON.parse(friends);

        console.log(`Um total de ${jsonFriends.friends.length.toString().bold} amigos serão restaurados.`.cyan);

        jsonFriends.friends.forEach(friend => {
            fetch(`https://discord.com/api/v6/users/@me/relationships/${friend.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': configToken,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({}),
            }).then((response) => {
                let response_data = response.clone();

                if (response_data.status === 204) {
                    console.log('Enviou um pedido de amizade para %s'.cyan, (friend.username + friend.discriminator).bold);
                } else {
                    console.log('Não foi possível enviar um pedido de amizade para %s'.red, (friend.username + friend.discriminator).bold);
                }
            }).catch((error) => {
                console.warn(error);
            });
        });
    });

    if (message.channel.type === 'dm') {
        //DM
    }
});

/**
 * Format unicode characters to its emoji equivalent
 * @param string
 * @returns {[]}
 */
const formatToEmoji     = (string) => {
    let SPACE_CHARS    = ['🔴', '⚫', '⚪', '🔵', '🔲', '🔘', '🟪', '🟩', '🟡', '🟠', '🟨', '🟤', '⬜', '🟥', '🟫', '🟧', '🟣', '🟢', '🟦', '⬛'],
        CODE_POINT     = 127365, 
        NUMERAL_EMOJI  = '\uFE0F\u20E3', 
        FORMATTED_CHAR = [];

    
    String(string).split('').forEach(char => {
        
        let outputChar = String.fromCodePoint(char.toLocaleLowerCase().codePointAt(0) + CODE_POINT),
            
            RAND_SPACE = SPACE_CHARS[Math.floor(Math.random() * SPACE_CHARS.length)];

      
        if (isNaN(Number(char)) === false) outputChar = char + NUMERAL_EMOJI;

        
        if (char === ' ' && SPACE_CHARS.length > 0) {
            
            SPACE_CHARS.splice(SPACE_CHARS.indexOf(RAND_SPACE), 1);
            outputChar = RAND_SPACE;
        }

        FORMATTED_CHAR.push(outputChar);
    });

    return FORMATTED_CHAR;
},

      /**
       *Bypass fetch message
       * @param channel
       * @param limit
       * @returns {Promise<[]>}
       */
      massFetchMessages = async (channel, limit = 1000) => {
          const sum_messages = [];
          let last_id;

          while (true) {
              const options = { limit: 100 };
              if (last_id) {
                  options.before = last_id;
              }

              const messages = await channel.fetchMessages(options);
              sum_messages.push(...messages.array());
              last_id = messages.last().id;

              if (messages.size !== 100 || sum_messages.length >= limit) {
                  break;
              }
          }

          return sum_messages;
      }


const successLogin    = () => console.log(`Logado em: %s`.cyan, bot.user.tag.bold),

      welcomeMessage  = () => {
          console.clear();
          console.log(`%s
%s`, ` ██████╗ ███████╗███╗   ██╗███████╗ ██████╗  █████╗ ██████╗  ██████╗ 
██╔══██╗██╔════╝████╗  ██║██╔════╝██╔════╝ ██╔══██╗██╔══██╗██╔═══██╗
██████╔╝█████╗  ██╔██╗ ██║█████╗  ██║  ███╗███████║██║  ██║██║   ██║
██╔══██╗██╔══╝  ██║╚██╗██║██╔══╝  ██║   ██║██╔══██║██║  ██║██║   ██║
██║  ██║███████╗██║ ╚████║███████╗╚██████╔╝██║  ██║██████╔╝╚██████╔╝
╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝  ╚═════╝ 
                                                                    
                                                       ░          `.rainbow, 'por Renegadowsz\r\n'.red);
      },

      displayCommands = () => console.log(`
Bem vindo ao centro de comando

Prefixo do SELF' => ${configPrefix.bold}

${configPrefix}${'help'.bold} => Descrição do Self
${configPrefix}[${'apagar'.bold}, ${'clear'.bold}] {${'Número de mensagens'.bold}} => Descrição do cleardm.
${configPrefix}[${'clearall'.bold}, ${'apagarg'.bold}] => Apague todas as mensagens enviada em um privado.
${configPrefix}${'backup'.bold} => Armazena todos os seus amigos e servidores que você está.
${configPrefix}${'restaurar'.bold} => Envia todas os pedidos para a amizade do backup.\r\n`.cyan
      ),

      exitSelect      = () => prompts({
          type: 'select',
          name: 'choice',
          message: 'Antes de sair, selecione sua ação',
          choices: [
              {
                  title: 'Saída',
                  description: 'Saia do processo atual',
                  value: 1
              },
              {
                  title: 'Mostrar Comandos',
                  description: 'Mostra a lista dos comandos que você pode usar',
                  value: 2
              },
              {
                  title: 'Deletar configuração',
                  description: 'Excluir o arquivo config.json resultará na perda de seu token e prefixo de comando',
                  value: 3
              },
          ],
          initial: 0
      }).then(response => {
          switch (response.choice) {
              case 1:
                  welcomeMessage();
                  console.log('Adeus, espero que você tenha se divertido usando %s.'.cyan, 'gene1ry0dan'.rainbow.bold);
                  return process.exit();
              case 2:
                  welcomeMessage();
                  displayCommands();
                 
                  return bot.login(configToken).catch(() => register(false));
              case 3:
                  console.log('Apagando sua configuração...'.cyan);
                  fs.unlinkSync(configPath);
                  return register(false);
          }
      }),

      login           = (showWelcome = true) => {
          showWelcome === true && welcomeMessage();
          config = require(configPath);
          configPrefix = config.prefix;

          prompts({
              type: 'password',
              name: 'pass',
              message: 'Senha para o SELF:',
              validate: async pass => { 
                  let showError = false;

                  const decryptedToken = CryptoJS.AES.decrypt(config.token, pass).toString(CryptoJS.enc.Utf8);
                  await bot.login(decryptedToken).catch(e => showError = e.message);

                  // if is a string it should return the error message to the prompt
                  if (showError !== false) return showError;

                  // if valid set bot token and return true (should return valid on the prompt)
                  configToken = decryptedToken;
                  return true;
              }
          }).then(response => {
              if (Object.entries(response).length === 0) return exitSelect();
              successLogin();
          });
      },

      register        = (showWelcome = true) => {
          if (fs.existsSync(configPath)) return login(false);
          showWelcome === true && welcomeMessage();
          console.log('Registrando configuração...'.cyan);

          prompts([
              {
                  type: 'text',
                  name: 'prefix',
                  message: 'Prefixo do SELF:',
              },
              {
                  type: 'password',
                  name: 'pass',
                  message: 'Senha do SELF:',
              },
              {
                  type: 'password',
                  name: 'token',
                  message: 'Discord Token:',
              },
          ]).then(response => {
              if (Object.entries(response).length === 0) return;

              const encryptedToken = CryptoJS.AES.encrypt(response.token, response.pass).toString();
              fs.writeFileSync(configPath, JSON.stringify({ prefix: response.prefix, token: encryptedToken }));
              console.log(`Registrou sua configuração com sucesso, fazendo login...`.green);

              // Attempt to login with the provided token
              bot.login(response.token).then(() => {
                  config = require(configPath);
                  configPrefix = response.prefix;
                  configToken = response.token;
                  successLogin();
              }).catch(e => {
                  console.log(e.message.red, 'Como o login não foi bem-sucedido, estamos tentando registrar novamente...\n'.cyan);

                  fs.unlinkSync(configPath);
                  register(false);
              });
          });
      };
