import { writeFile, readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join, dirname } from 'path'

interface BanData {
  timestamp: number;
  watchdog_total: number;
  staff_total: number;
  watchdog_increment: number;
  staff_increment: number;
}

const DATA_DIR = join(process.cwd(), 'data')
const BAN_HISTORY_FILE = join(DATA_DIR, 'ban_history.json')

// Create data directory if not exists
async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true })
  }
}

// Save ban history to file
export async function saveBanHistory(history: BanData[]) {
  try {
    await ensureDataDir()
    await writeFile(BAN_HISTORY_FILE, JSON.stringify(history), 'utf-8')
  } catch (error) {
    console.error('Error saving ban history:', error)
  }
}

// Load ban history from file
export async function loadBanHistory(): Promise<BanData[]> {
  try {
    await ensureDataDir()
    if (!existsSync(BAN_HISTORY_FILE)) {
      return []
    }
    const data = await readFile(BAN_HISTORY_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading ban history:', error)
    return []
  }
} 