const linkRe = /(https?:\/\/|chat\.whatsapp\.com\/?)/i;
const shortenerRe = /(bit\.ly|t\.co|tinyurl\.com|goo\.gl|ow.ly|short.link|cutt.ly|rebrand.ly)/i;
const heKeywordsRe = /(הלווא|פורקס|קריפטו|הימור|סקס|xxx|porn|bet|forex|לוטו|קזינו|הימורים|loan|casino)/i;

function evaluate({ text = '', type = 'unknown', joinedAgoMinutes = 9999, senderIsWhitelisted = false }) {
    if (joinedAgoMinutes === -1) return { action: 'block', ruleId: 'unknown_join_time' };
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
