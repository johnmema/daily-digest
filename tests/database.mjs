// Run with @electric-sql/pglite installed in a temporary test workspace.
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
export async function testDatabase(db, root) {
  await db.exec('create role anon; create role authenticated; create role service_role;')
  for (const f of ['20260609000000_initial_schema.sql','20260612000000_add_paper_category.sql','20260626000000_add_topic_category.sql','20261023000000_direct_publishing.sql']) await db.exec(readFileSync(root+'supabase/migrations/'+f,'utf8'))
  const topic=(await db.query("insert into topics(title) values('Test topic') returning id")).rows[0].id
  const payload={run_date:'2026-10-24',topic_id:topic,topic:'Test topic',category:'essay',title:'Test',content:'test',sources:[],word_count:2600,read_time_minutes:12}
  const publish=async p=>(await db.query('select publish_daily_digest($1::jsonb) as result',[JSON.stringify(p)])).rows[0].result
  const a=await publish(payload);assert.equal(a.replayed,false)
  const b=await publish(payload);assert.equal(b.replayed,true);assert.equal(a.paper_id,b.paper_id)
  assert.equal((await db.query('select count(*)::int as n from papers')).rows[0].n,1)
  assert.equal((await db.query('select status from topics where id=$1',[topic])).rows[0].status,'done')
  await assert.rejects(()=>publish({...payload,run_date:'2026-10-25'}))
  // A failed ledger insert must roll back the preceding paper insert too.
  await db.exec("create function test_fail() returns trigger language plpgsql as $$ begin raise exception 'test rollback'; end $$; create trigger test_failure before insert on digest_editions for each row execute function test_fail();")
  await assert.rejects(()=>publish({...payload,topic_id:undefined,topic:'Another topic',run_date:'2026-10-25'}))
  assert.equal((await db.query('select count(*)::int as n from papers')).rows[0].n,1)
  await db.exec('drop trigger test_failure on digest_editions; drop function test_fail(); set role anon;')
  await assert.rejects(()=>publish({...payload,run_date:'2026-10-26'}));await assert.rejects(()=>db.query('select * from digest_editions'))
  await db.exec('reset role;')
}
