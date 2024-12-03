import { ipcMain } from 'electron'
import log from 'electron-log'
import { Worker } from 'worker_threads'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let subtitlesWorker = null

export function setupSubtitlesHandlers() {
  // Initialize worker if not already initialized
  if (!subtitlesWorker) {
    log.info('Initializing subtitles worker...')
    subtitlesWorker = new Worker(path.join(__dirname, 'subtitlesWorker.js'))
    
    subtitlesWorker.on('error', (error) => {
      log.error('Subtitles worker error:', error)
    })

    subtitlesWorker.on('exit', (code) => {
      log.info(`Subtitles worker exited with code ${code}`)
      subtitlesWorker = null
    })
  }

  ipcMain.handle('extract-subtitles', async (_, filePath) => {
    log.info('Extracting subtitles from:', filePath)
    
    try {
      const result = await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Subtitle extraction timed out'))
        }, 60000)

        const handleMessage = (result) => {
          clearTimeout(timeoutId)
          subtitlesWorker.removeListener('message', handleMessage)
          
          if (result.type === 'error') {
            reject(new Error(result.error))
          } else if (result.type === 'complete') {
            resolve(result.data)
          }
        }

        subtitlesWorker.on('message', handleMessage)
        subtitlesWorker.postMessage({ filePath })
      })

      log.info('Subtitles extracted successfully')
      return { success: true, data: result }
    } catch (error) {
      log.error('Error extracting subtitles:', error)
      return { success: false, error: error.message }
    }
  })

  // Cleanup function
  return () => {
    if (subtitlesWorker) {
      log.info('Terminating subtitles worker...')
      subtitlesWorker.terminate()
      subtitlesWorker = null
    }
  }
}