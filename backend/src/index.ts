import { loadConfig } from './config.js';
import { createApp } from './app.js';

const cfg = loadConfig();
const app = createApp();

app.listen(cfg.PORT, () => {
  console.log(`CreditKit API listening on http://localhost:${cfg.PORT}`);
});
