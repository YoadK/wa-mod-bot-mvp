#!/usr/bin/env node
/**
 * Test script to simulate incoming WhatsApp messages
 * Usage: node test-message.js [type] [text]
 *
 * Examples:
 *   node test-message.js spam "Check out this deal! https://bit.ly/scam"
 *   node test-message.js keyword "הימור על פורקס"
 *   node test-message.js clean "Hello everyone!"
 *   node test-message.js media
 */

require('dotenv').config();
const axios = require('axios');

const PORT = process.env.PORT || 3000;
const API_URL = `http://localhost:${PORT}/webhooks/green`;

// Test phone numbers
const SPAM_SENDER = '972501234567@c.us';
const CLEAN_SENDER = '972507654321@c.us';
const NEW_MEMBER = '972509999999@c.us';

// Test group ID
const GROUP_ID = process.env.COMMUNITY_GROUP_IDS?.split(',')[0] || '1234567890-1111@g.us';

const messageTypes = {
  spam: {
    sender: SPAM_SENDER,
    type: 'textMessage',
    text: 'Amazing deal! Check this out: https://bit.ly/scam'
  },
  keyword: {
    sender: SPAM_SENDER,
    type: 'textMessage',
    text: 'רוצה להרוויח? הלוואה מהירה! פורקס וקריפטו!'
  },
  clean: {
    sender: CLEAN_SENDER,
    type: 'textMessage',
    text: 'Hello everyone, how are you doing today?'
  },
  media: {
    sender: NEW_MEMBER,
    type: 'imageMessage',
    text: ''
  },
  link: {
    sender: SPAM_SENDER,
    type: 'textMessage',
    text: 'Join our group: https://chat.whatsapp.com/invite123'
  }
};

async function sendTestMessage(type = 'spam', customText = null) {
  const template = messageTypes[type] || messageTypes.spam;

  const payload = {
    typeWebhook: 'incomingMessageReceived',
    idMessage: `TEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    senderData: {
      chatId: GROUP_ID,
      sender: template.sender
    },
    messageData: {
      typeMessage: template.type,
      textMessageData: {
        textMessage: customText || template.text
      }
    }
  };

  try {
    console.log('Sending test message to webhook...');
    console.log('Type:', type);
    console.log('Sender:', template.sender);
    console.log('Text:', customText || template.text);
    console.log('---');

    const response = await axios.post(API_URL, payload);
    console.log('✓ Message sent successfully!');
    console.log('Response status:', response.status);
    console.log('\nCheck your worker logs and dashboard to see the moderation result.');
  } catch (error) {
    console.error('✗ Error sending message:');
    console.error(error.response?.data || error.message);
    process.exit(1);
  }
}

// Parse CLI arguments
const args = process.argv.slice(2);
const type = args[0] || 'spam';
const customText = args.slice(1).join(' ') || null;

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node test-message.js [type] [text]

Available types:
  spam      - Message with URL shortener (triggers r_shortener)
  keyword   - Hebrew spam keywords (triggers r_kw)
  clean     - Legitimate message (should be allowed)
  media     - Image/video from new member (triggers r_probation_media if <15min)
  link      - WhatsApp invite link (triggers r_link)

Custom text:
  node test-message.js spam "your custom spam text here"
  node test-message.js clean "Hello world"

Examples:
  node test-message.js spam
  node test-message.js keyword "הימור על קריפטו"
  node test-message.js clean "Hi everyone!"
  `);
  process.exit(0);
}

console.log('=== WhatsApp Test Message Generator ===\n');
sendTestMessage(type, customText);
