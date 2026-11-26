import { Logger } from "@nestjs/common";
import * as loadEsm from "load-esm";

const logger = new Logger("FileTypeDetection");

async function fileTypeFromBuffer(buffer: Uint8Array | ArrayBuffer) {
  /**
   * Import 'file-type' ES-Module in CommonJS Node.js module
   */
  return await (async () => {
    try {
      // Dynamically import the ESM module, including types
      const { fileTypeFromBuffer } = await loadEsm.loadEsm<typeof import("file-type")>("file-type");
      return fileTypeFromBuffer(buffer);
    } catch (error) {
      logger.error("Failed to import the file-type module", error);
    }
    return null;
  })();
}

export { fileTypeFromBuffer };
