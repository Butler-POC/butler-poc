// Created: 2026-05-30 10:04
import 'dotenv/config';
import { createApp } from './app';

const PORT = Number(process.env.PORT) || 3000;

const app = createApp();

app.listen(PORT, () => {
  console.log(`[butler-server] listening on http://localhost:${PORT}`);
});
