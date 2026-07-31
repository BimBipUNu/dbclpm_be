import app from "./app";
import dotenv from "dotenv";
import { config } from "./config/env";

dotenv.config();

const PORT = config.server.port;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
