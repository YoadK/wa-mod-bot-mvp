const axios = require('axios');
const { err } = require('../utils/logger');

function buildBase(url, id) { return `${url}/waInstance${id}`; }

function greenClient({ url, id, token }) {
  const base = buildBase(url, id);
  const http = axios.create({ timeout: 8000 });

  return {
    async deleteMessage(chatId, idMessage) {
      try {
        const { data } = await http.post(`${base}/deleteMessage/${token}`, { chatId, idMessage });
        return data;
      } catch (e) { err('deleteMessage failed', e?.response?.data || e.message); throw e; }
    },

    async removeGroupParticipant(groupId, participantChatId) {
      try {
        const { data } = await http.post(`${base}/removeGroupParticipant/${token}`, { groupId, participantChatId });
        return data;
      } catch (e) { err('removeGroupParticipant failed', e?.response?.data || e.message); throw e; }
    }
  };
}

module.exports = { greenClient };
