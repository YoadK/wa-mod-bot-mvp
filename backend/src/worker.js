require('dotenv').config();
const { connect, Event, Blacklist, Whitelist, Member } = require('./db');
const { greenClient } = require('./services/greenApi');
const { sendToSheets } = require('./services/sheets');
const { evaluate } = require('./rules');
const { log, err } = require('./utils/logger');

const green = greenClient({
    url: process.env.GREEN_URL,
    id: process.env.GREEN_ID,
    token: process.env.GREEN_TOKEN
});

const COMMUNITY_GROUP_IDS = (process.env.COMMUNITY_GROUP_IDS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

/**
 * Remove a user from all community groups except the provided groupId.
 * Best-effort: ignores individual errors.
 */
async function removeFromCommunity(sender, exceptGroupId) {
    const targets = COMMUNITY_GROUP_IDS.filter(id => id && id !== exceptGroupId);
    for (const gid of targets) {
        try { await green.removeGroupParticipant(gid, sender); } catch { }
    }
}

async function processOne() {
    const ev = await Event.findOneAndUpdate(
        { status: 'NEW' },
        { $set: { status: 'PROCESSING' } },
        { sort: { createdAt: 1 }, new: true }
    );
    if (!ev) return false;

    try {
        const wl = await Whitelist.findOne({ phone: ev.sender }).lean();
        const bl = await Blacklist.findOne({ phone: ev.sender }).lean();

        if (bl) {
            try { await green.deleteMessage(ev.chatId, ev.idMessage); } catch { }
            try { await green.removeGroupParticipant(ev.chatId, ev.sender); } catch { }
            await removeFromCommunity(ev.sender, ev.chatId);
            await sendToSheets({
                timestamp: new Date().toISOString(),
                phone: ev.sender,
                ruleId: 'blacklist',
                reason: 'blacklist',
                sourceGroup: ev.chatId,
                text: (ev.text || '').slice(0, 300)
            });
            await Event.updateOne({ _id: ev._id }, { $set: { status: 'DONE', decision: 'block', ruleId: 'blacklist' } });
            return true;
        }

        const member = await Member.findOne({ phone: ev.sender }).lean();
        const joinedAgoMinutes = member?.joinTime ? Math.max(0, (Date.now() - new Date(member.joinTime).getTime()) / 60000) : -1;

        const decision = evaluate({
            text: ev.text || '',
            type: ev.type,
            joinedAgoMinutes,
            senderIsWhitelisted: !!wl
        });

        if (decision.action === 'allow') {
            await Event.updateOne({ _id: ev._id }, { $set: { status: 'DONE', decision: 'allow' } });
            return true;
        }

        await green.deleteMessage(ev.chatId, ev.idMessage);
        await green.removeGroupParticipant(ev.chatId, ev.sender);

        // Remove from other community groups as well
        await removeFromCommunity(ev.sender, ev.chatId);

        // Log to Google Sheets for auditing
        await sendToSheets({
            timestamp: new Date().toISOString(),
            phone: ev.sender,
            ruleId: decision.ruleId,
            reason: 'rule',
            sourceGroup: ev.chatId,
            text: (ev.text || '').slice(0, 300)
        });

        await Blacklist.updateOne(
            { phone: ev.sender },
            { $set: { reason: 'rule', ruleId: decision.ruleId } },
            { upsert: true }
        );

        await Event.updateOne(
            { _id: ev._id },
            { $set: { status: 'DONE', decision: 'block', ruleId: decision.ruleId } }
        );

        log('blocked', ev.sender, 'rule', decision.ruleId);
        return true;
    } catch (e) {
        err('worker error', e?.response?.data || e.message);
        await Event.updateOne({ _id: ev?._id }, { $set: { status: 'ERROR' } });
        return true;
    }
}

(async function main() {
    await connect(process.env.MONGO_URL);
    log('Worker started');
    setInterval(processOne, 1000);
})();
