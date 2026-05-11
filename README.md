# Synapse 🧠

> Real-time AI that detects when prediction markets are lying.

Synapse is a full-stack agentic platform that streams live market data from [Polymarket](https://polymarket.com), cross-references it against real-time news and social sentiment, and fires an AI-driven alert whenever the crowd odds diverge from reality.

---

## What It Does

- **Streams** live trades and order book changes from Polymarket via WebSocket
- **Buffers** high-frequency price updates through RabbitMQ to handle volatility spikes without data loss
- **Triggers** a Deep Research agent when a market moves >5% in a short window
- **Compares** current odds against scraped news using an LLM (GPT-4o / Claude) to flag irrational pricing
- **Displays** everything on a live Next.js dashboard with a real-time AI Insight ticker

---

## Architecture

```
Polymarket CLOB WSS
        │
        ▼
 Spring Boot (Ingestion)
        │
        ▼
    RabbitMQ
   ┌────┴────┐
   ▼         ▼
Spring AI   Database
(LLM Agent)
   │
   ▼
Next.js Dashboard (STOMP/SockJS)
```

---

## Tech Stack

| Layer       | Technologies                                         |
|-------------|------------------------------------------------------|
| Backend     | Spring Boot 3.x, Spring AMQP, Spring AI              |
| Streaming   | RabbitMQ (Message Broker)                            |
| AI / ML     | Spring AI, GPT-4o / Claude, Valyu / Serper (scraping)|
| Frontend    | Next.js, Tailwind CSS, Recharts, Lightweight Charts  |
| Data Source | Polymarket Gamma API, CLOB WebSocket (WSS)           |

---

## Key Engineering Highlights

- **Event-Driven Architecture** — RabbitMQ decouples ingestion from processing, ensuring zero message loss during high-volatility events
- **Agentic AI System** — not just an API call; a reactive agent that decides *when* and *what* to analyze based on live market conditions
- **Full-Stack Data Pipeline** — raw blockchain/WebSocket data flows through to a polished, real-time UI with no polling

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/your-username/synapse.git
cd synapse

# Start RabbitMQ
docker run -d --hostname synapse-rabbit --name rabbit -p 5672:5672 -p 15672:15672 rabbitmq:3-management

# Run the backend
cd backend
./mvnw spring-boot:run

# Run the frontend
cd frontend
npm install && npm run dev
```

---

## Roadmap

- [ ] Add support for additional prediction markets (Manifold, Kalshi)
- [ ] Fine-tune sentiment scoring model on prediction market data
- [ ] Backtesting engine to evaluate historical AI signal accuracy
- [ ] User alerts via email / Slack when a high-confidence mismatch is detected

---

*Built to demonstrate event-driven architecture, agentic AI design, and full-stack engineering.*
