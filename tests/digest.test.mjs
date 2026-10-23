import test from 'node:test'
import assert from 'node:assert/strict'
import { validateDigest } from '../.test-build/digest-payload.js'
import { digestAuthorized } from '../.test-build/digest-auth.js'
const sample = () => ({ run_date:'2026-10-24',topic:'Example topic',category:'essay',title:'Example title',content:Array(2600).fill('word').join(' '),sources:Array.from({length:6},(_,i)=>({title:`Source ${i}`,url:`https://example.org/${i}`})) })
test('accepts valid payload and derives count/time instead of trusting client',()=>{
 const p=validateDigest({...sample(),word_count:1,read_time_minutes:1});assert.equal(p.word_count,2600);assert.equal(p.read_time_minutes,12)
})
test('rejects short/long content',()=>{for(const n of [2499,3501]) assert.throws(()=>validateDigest({...sample(),content:Array(n).fill('w').join(' ')}))})
test('rejects invalid dates and UUIDs',()=>{for(const run_date of ['2026-02-30','2026-1-01','not-a-date']) assert.throws(()=>validateDigest({...sample(),run_date}));assert.throws(()=>validateDigest({...sample(),topic_id:'bad'}))})
test('rejects missing fields/category',()=>{assert.throws(()=>validateDigest({...sample(),title:''}));assert.throws(()=>validateDigest({...sample(),category:'random'}))})
test('requires six distinct safe source URLs',()=>{assert.throws(()=>validateDigest({...sample(),sources:sample().sources.slice(0,5)}));assert.throws(()=>validateDigest({...sample(),sources:Array(6).fill({title:'x',url:'https://example.org'})}));assert.throws(()=>validateDigest({...sample(),sources:[{title:'x',url:'javascript:alert(1)'},...sample().sources.slice(1)]}))})
test('fails closed without token; requires exact bearer; legacy value irrelevant',()=>{
 delete process.env.DIGEST_PUBLISH_TOKEN;assert.equal(digestAuthorized('Bearer undefined'),false)
 process.env.DIGEST_PUBLISH_TOKEN='a'.repeat(64);process.env.CRON_SECRET='legacy'
 assert.equal(digestAuthorized('Bearer '+'a'.repeat(64)),true);assert.equal(digestAuthorized('Bearer legacy'),false);assert.equal(digestAuthorized(null),false);assert.equal(digestAuthorized('Bearer '+'b'.repeat(64)),false)
})
