const axios = require('axios');
const { err } = require('../utils/logger');

const URL = process.env.SHEETS_WEBHOOK_URL;

/**
 * Send a moderation entry to Google Sheets via Apps Script Web App.
 * Safe to call even if URL is not configured.
 * @param {Object} entry {timestamp, phone, ruleId, reason, sourceGroup, text}
 */
async function sendToSheets(entry) {
  if (!URL) return; // Optional in MVP
  try {
    await axios.post(URL, entry, { timeout: 8000 });
  } catch (e) {
    err('sendToSheets failed', e?.response?.data || e.message);
  }
}

module.exports = { sendToSheets };
