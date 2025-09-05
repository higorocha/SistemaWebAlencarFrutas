//src/config/momentConfig.js
import moment from 'moment-timezone';

// Configura o fuso horário padrão para Brasília
moment.tz.setDefault('America/Sao_Paulo');

// Configura o locale para português do Brasil
moment.locale('pt-br');

export default moment;
