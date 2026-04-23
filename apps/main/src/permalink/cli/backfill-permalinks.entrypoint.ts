import { NestFactory } from "@nestjs/core";
import { AppModule } from "../../app.module";
import { runBackfill } from "./backfill-permalinks";

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["log", "error", "warn"],
  });
  try {
    await runBackfill(app);
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
