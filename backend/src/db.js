const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  idMessage: { type: String, index: true, unique: true },
  chatId: { type: String, index: true },
  sender: { type: String, index: true },
  type: String,
  text: String,
  createdAt: { type: Date, default: Date.now, index: true },
  status: { type: String, default: 'NEW', index: true },
  decision: String,
  ruleId: String
});

const BlacklistSchema = new mongoose.Schema({
  phone: { type: String, unique: true },
  reason: String,
  ruleId: String,
  createdAt: { type: Date, default: Date.now },
  expiresAt: Date
});

const WhitelistSchema = new mongoose.Schema({
  phone: { type: String, unique: true },
  note: String,
  createdAt: { type: Date, default: Date.now }
});

const MemberSchema = new mongoose.Schema({
  phone: { type: String, unique: true },
  firstSeen: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now },
  joinTime: Date
});

const Event = mongoose.model('Event', EventSchema);
const Blacklist = mongoose.model('Blacklist', BlacklistSchema);
const Whitelist = mongoose.model('Whitelist', WhitelistSchema);
const Member = mongoose.model('Member', MemberSchema);

async function connect(url) {
  await mongoose.connect(url, { autoIndex: true });
}

module.exports = { connect, Event, Blacklist, Whitelist, Member };
