import app from "./app.js";
import { env } from "./config/env.js";

app.listen(env.puerto, () => {
  console.log(`API NFC en http://localhost:${env.puerto}`);
});