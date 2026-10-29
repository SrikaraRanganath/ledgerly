import { sqlite } from './client'
const q = 'SELECT * FROM ledger_entries WHERE account_id = 1 ORDER BY entry_date DESC LIMIT 50'
console.log(sqlite.prepare('EXPLAIN QUERY PLAN ' + q).all())