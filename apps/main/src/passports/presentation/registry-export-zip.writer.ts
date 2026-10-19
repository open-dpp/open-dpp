import archiver, { Archiver } from "archiver";
import { Response } from "express";
import { RegistryExportFile } from "../domain/registry-export-file";
import { EuRegistryExportResult } from "../application/services/eu-registry-export.service";

/**
 * Streams the files of an EU registry export as ZIP into `res`: one `<product-group>-<nnn>.json`
 * per registry file and, if some passports could not be exported, a `failed-passports.json`.
 * Errors before the first file (e.g. no matching passports) are thrown so they become a 4xx;
 * an error afterwards aborts the response.
 */
export async function writeRegistryExportZip(
  res: Response,
  files: AsyncGenerator<RegistryExportFile, EuRegistryExportResult>,
  options: {
    now?: Date;
    archive?: Archiver;
  } = {},
): Promise<void> {
  const { now = new Date(), archive = archiver("zip", { zlib: { level: 9 } }) } = options;
  // Pulling the first step before touching `res` lets an error still become a regular 4xx.
  let step = await files.next();

  res.set({
    "Content-Type": "application/zip",
    "Content-Disposition": `attachment; filename="eu-registry-export-${now.toISOString().slice(0, 10)}.zip"`,
  });
  // Archiver reports some failures only as event, which would be thrown uncaught otherwise.
  archive.on("error", (error) => {
    archive.abort();
    res.destroy(error);
  });
  archive.pipe(res);

  try {
    let fileNumber = 0;
    while (!step.done) {
      fileNumber++;
      archive.append(JSON.stringify(step.value.toPlain(), null, 2), {
        name: `${step.value.productGroup.toLowerCase()}-${String(fileNumber).padStart(3, "0")}.json`,
      });
      step = await files.next();
    }
    if (step.value.failedPassportIds.length > 0) {
      archive.append(
        JSON.stringify(
          step.value.failedPassportIds.map((passportId) => ({
            passportId,
            reason: "No published permalink",
          })),
          null,
          2,
        ),
        { name: "failed-passports.json" },
      );
    }
    await archive.finalize();
  } catch (error) {
    archive.abort();
    res.destroy(error instanceof Error ? error : undefined);
  }
}
