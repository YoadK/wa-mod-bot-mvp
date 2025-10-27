# WhatsApp Moderation Bot — Setup

Quick setup notes to run the backend API, the moderation worker, and the frontend.

Prereqs
- Node.js (v16+ recommended), npm
- A MongoDB instance and connection URI
- Green API credentials (GREEN_URL, GREEN_ID, GREEN_TOKEN)
- Windows / PowerShell examples below — adapt for other shells.

Install
1. Install dependencies:
   - Backend: `cd backend && npm install`
   - Frontend: `cd frontend && npm install`

Environment
- Create `backend/.env` with at least:
  ```
  MONGO_URL=mongodb://user:pass@host:27017/dbname
  GREEN_URL=https://api.green.example
  GREEN_ID=your_green_id
  GREEN_TOKEN=your_green_token
  COMMUNITY_GROUP_IDS=123@g.us,456@g.us
  PORT=3000
  ```

Start services (run each in its own terminal)
- Backend API:
  ```
  cd backend
  node src/index.js
  ```
- Worker:
  ```
  cd backend
  node src/worker.js
  ```
- Frontend:
  ```
  cd frontend
  npm start
  ```

Run both backend + worker together (optional)
```
cd backend
npx concurrently "node src/index.js" "node src/worker.js"
```

Quick checks
- Health: GET http://localhost:xxxx/healthz
- Example webhook test (adjust payload fields as needed):
  ```
  curl -X POST http://localhost:3000/webhooks/green -H "Content-Type: application/json" -d '{
    "typeWebhook":"incomingMessageReceived",
    "idMessage":"msg-123",
    "senderData":{"chatId":"111@g.us","sender":"+15551234567"},
    "messageData":{"typeMessage":"textMessage","textMessageData":{"textMessage":"hello"}}
  }'
  ```

Key files / behaviour to know
- backend/src/index.js — webhook endpoints, API
- backend/src/worker.js — processes Event documents, calls evaluate() and Green API
- backend/src/rules.js — message evaluation; returns `{ action, ruleId }`
- backend/src/db.js — Mongoose schemas (Event, Blacklist, Whitelist, Member)
- backend/src/utils/logger.js — centralized logging

Notes / gotchas
- Run backend and worker from the `backend` folder so dotenv loads `.env`.
- Unknown member join times are represented as `joinedAgoMinutes === -1` — rules should handle that explicitly.
- The worker consumes the `{ action, ruleId }` decision (e.g., `allow`, `block`, `review`).

If you want, I can add npm scripts to the backend package.json to run API/worker with simple commands. Feedback on missing details? 
```// filepath: \whatsapp_spam_filtering_bot\wa-mod-bot\wa-mod-bot-mvp-updated\README.md

# WhatsApp Moderation Bot — Setup

Quick setup notes to run the backend API, the moderation worker, and the frontend.

Prereqs
- Node.js (v16+ recommended), npm
- A MongoDB instance and connection URI
- Green API credentials (GREEN_URL, GREEN_ID, GREEN_TOKEN)
- Windows / PowerShell examples below — adapt for other shells.

Install
1. Install dependencies:
   - Backend: `cd backend && npm install`
   - Frontend: `cd frontend && npm install`

Environment
- Create `backend/.env` with at least:
  ```
  MONGO_URL=mongodb://user:pass@host:xxxxx/dbname
  GREEN_URL=https://api.green.example
  GREEN_ID=your_green_id
  GREEN_TOKEN=your_green_token
  COMMUNITY_GROUP_IDS=123@g.us,456@g.us
  PORT=xxxx
  ```

Start services (run each in its own terminal)
- Backend API:
  ```
  cd backend
  node src/index.js
  ```
- Worker:
  ```
  cd backend
  node src/worker.js
  ```
- Frontend:
  ```
  cd frontend
  npm start
  ```

Run both backend + worker together (optional)
```
cd backend
npx concurrently "node src/index.js" "node src/worker.js"
```

Quick checks
- Health: GET http://localhost:xxxx/healthz
- Example webhook test (adjust payload fields as needed):
  ```
  curl -X POST http://localhost:xxxx/webhooks/green -H "Content-Type: application/json" -d '{
    "typeWebhook":"incomingMessageReceived",
    "idMessage":"msg-123",
    "senderData":{"chatId":"111@g.us","sender":"+15551234567"},
    "messageData":{"typeMessage":"textMessage","textMessageData":{"textMessage":"hello"}}
  }'
  ```

Key files / behaviour to know
- backend/src/index.js — webhook endpoints, API
- backend/src/worker.js — processes Event documents, calls evaluate() and Green API
- backend/src/rules.js — message evaluation; returns `{ action, ruleId }`
- backend/src/db.js — Mongoose schemas (Event, Blacklist, Whitelist, Member)
- backend/src/utils/logger.js — centralized logging

Notes / gotchas
- Run backend and worker from the `backend` folder so dotenv loads `.env`.
- Unknown member join times are represented as `joinedAgoMinutes === -1` — rules should handle that explicitly.
- The worker consumes the `{ action, ruleId }` decision (e.g., `allow`, `block`, `review`).

If you want, I can add npm scripts to the backend package.json to run API/worker with simple commands. Feedback on missing details? 
