import { Hono } from 'hono'
import { like, or } from 'drizzle-orm'
import { db } from '../db/client'
import { accounts, products } from '../db/schema'
import { stripWildcards } from '../lib/utils'

export const catalog = new Hono()

catalog.get('/products', (c) => {
  const q = c.req.query('q')?.trim()
  const rows = q
    ? db.select().from(products).where(or(like(products.nameEn, `%${stripWildcards(q)}%`), like(products.nameAr, `%${stripWildcards(q)}%`), like(products.sku, `%${stripWildcards(q)}%`))).all()
    : db.select().from(products).all()
  return c.json(rows)
})
catalog.get('/accounts', (c) => c.json(db.select().from(accounts).all()))