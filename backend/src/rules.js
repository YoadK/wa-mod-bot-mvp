const linkRe = /(https?:\/\/|chat\.whatsapp\.com\/?)/i;
const shortenerRe = /(bit\.ly|t\.co|tinyurl\.com|goo\.gl)/i;
const heKeywordsRe = /(הלווא|פורקס|קריפטו|הימור|סקס|xxx|porn|bet|forex)/i;

function evaluate({ text = '', type = 'unknown', joinedAgoMinutes = 9999, senderIsWhitelisted = false }) {
  if (senderIsWhitelisted) return { action: 'allow', ruleId: 'whitelist' };

  if (linkRe.test(text)) return { action: 'block', ruleId: 'r_link' };
  if (shortenerRe.test(text)) return { action: 'block', ruleId: 'r_shortener' };
  if (heKeywordsRe.test(text)) return { action: 'block', ruleId: 'r_kw' };

  if (joinedAgoMinutes < 15 && type !== 'textMessage' && type !== 'extendedTextMessage') {
    return { action: 'block', ruleId: 'r_probation_media' };
  }

  return { action: 'allow' };
}

module.exports = { evaluate };
