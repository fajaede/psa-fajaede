import { defineConfig } from "@prisma/config";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd()); // Laad de Next.js .env bestanden veilig in

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});