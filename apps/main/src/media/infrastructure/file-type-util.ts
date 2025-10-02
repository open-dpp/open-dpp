import { loadEsm } from 'load-esm'

async function fileTypeFromBuffer(buffer: Uint8Array | ArrayBuffer) {
  /**
   * Import 'file-type' ES-Module in CommonJS Node.js module
   */
  return await (async () => {
    try {
      // Dynamically import the ESM module, including types
      const { fileTypeFromBuffer }
        = await loadEsm<typeof import('file-type')>('file-type')
      return fileTypeFromBuffer(buffer)
    }
    catch (error) {
      console.error('Error importing module:', error)
    }
    return null
  })()
}

export { fileTypeFromBuffer }
