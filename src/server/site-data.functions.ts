import { createServerFn } from '@tanstack/react-start'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { SiteData } from '@/lib/khayal-store'

// مكان تخزين البيانات على السيرفر
const DATA_FILE = path.join(process.cwd(), 'data', 'site-data.json')

async function ensureDir() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
}

async function readFromDisk(): Promise<SiteData | null> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8')
    return JSON.parse(raw) as SiteData
  } catch {
    return null
  }
}

async function writeToDisk(data: SiteData) {
  await ensureDir()
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

// ===== جلب بيانات الموقع =====
export const getSiteData = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SiteData | null> => {
    return await readFromDisk()
  },
)

// ===== حفظ بيانات الموقع (محمي بـ PIN) =====
type SavePayload = { pin: string; data: SiteData }

export const saveSiteData = createServerFn({ method: 'POST' })
  .inputValidator((payload: SavePayload) => {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid payload')
    }
    if (typeof payload.pin !== 'string' || !payload.pin.trim()) {
      throw new Error('PIN مطلوب')
    }
    if (!payload.data || typeof payload.data !== 'object') {
      throw new Error('البيانات غير صحيحة')
    }
    return payload
  })
  .handler(async ({ data: payload }): Promise<SiteData> => {
    const expected = (process.env.DEVK_PIN ?? '87').trim()
    if (payload.pin.trim() !== expected) {
      throw new Error('كود غير صحيح')
    }

    await writeToDisk(payload.data)
    return payload.data
  })
        
