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
    const compressed = history.map(d => [
      d.timestamp,
      d.watchdog_increment,
      d.staff_increment
    ])
    await writeFile(BAN_HISTORY_FILE, JSON.stringify(compressed), 'utf-8')
  } catch (error) {
    console.error('Error saving ban history:', error)
  }
}

// Load ban history from file
export async function loadBanHistory(): Promise<BanData[]> {
  try {
    await ensureDataDir()
    if (!existsSync(BAN_HISTORY_FILE)) return []
    
    const data = await readFile(BAN_HISTORY_FILE, 'utf-8')
    const compressed = JSON.parse(data)
    
    return compressed.map((d: any[]) => ({
      timestamp: d[0],
      watchdog_increment: d[1],
      staff_increment: d[2],
      watchdog_total: 0,  // 不再存储总量
      staff_total: 0
    }))
  } catch (error) {
    console.error('Error loading ban history:', error)
    return []
  }
} 