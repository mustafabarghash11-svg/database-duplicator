import { createServerFn } from '@tanstack/react-start'

// مثال: جلب بيانات الموقع من قاعدة البيانات / ملف / API خارجي
export const getSiteData = createServerFn({ method: 'GET' })
  .handler(async () => {
    // ⚠️ ضع هنا كود السيرفر فقط (DB, fs, secrets, ...)
    // مثال:
    // const { data } = await db.from('site').select('*')
    // return data

    return {
      title: 'My Site',
      description: 'Site description',
      updatedAt: new Date().toISOString(),
    }
  })

// لو عندك دالة تأخذ مدخلات:
export const getSiteItem = createServerFn({ method: 'GET' })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    // const item = await db.from('items').select('*').eq('id', id).single()
    // return item
    return { id, name: 'Example' }
  })
