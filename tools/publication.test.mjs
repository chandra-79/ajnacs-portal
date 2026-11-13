import { test } from 'node:test';
import assert from 'node:assert/strict';
import { publicationDate, distributeSchedule, isPublicationDay, validDate, isTimeBoundHeadline } from './publication.mjs';
import { readFileSync } from 'node:fs';
import { importedSlug } from './source-id.mjs';

test('publishing uses the site date across UTC midnight and daylight-saving changes', () => {
  assert.equal(publicationDate({ override:'', now:new Date('2026-11-13T03:00:00Z') }), '2026-11-12');
  assert.equal(publicationDate({ override:'', now:new Date('2026-07-04T03:00:00Z') }), '2026-07-03');
  assert.equal(publicationDate({ override:'', now:new Date('2026-11-01T06:30:00Z') }), '2026-11-01');
});

test('an invalid date cannot accidentally publish the queue', () => {
  for (const value of ['tomorrow','2026-02-30','2026-13-01','2026-01-01T00:00:00Z']) {
    assert.equal(validDate(value), false);
    assert.throws(() => publicationDate({ override:value }));
  }
});

test('published dates and valid future assignments survive scheduling unchanged', () => {
  const records = [
    { slug:'published',section:'insights',date:'2024-10-08',status:'published' },
    { slug:'assigned',section:'insights',date:'2026-11-16',status:'scheduled' },
    { slug:'new-one',section:'insights' }, { slug:'new-two',section:'insights' },
    { slug:'new-three',section:'insights' },
  ];
  const result = distributeSchedule(records,{today:'2026-11-12'});
  assert.equal(result[0].date,'2024-10-08');
  assert.equal(result[1].date,'2026-11-16');
  const dates = result.slice(1).map(record=>record.date);
  assert.equal(new Set(dates).size,dates.length);
  assert.ok(dates.every(date=>date>'2026-11-12' && isPublicationDay(date)));
  assert.deepEqual(distributeSchedule(result,{today:'2026-11-12'}),result);
  assert.equal(records[2].date,undefined,'does not mutate input');
});

test('a duplicate future date gets its own slot but duplicate URLs fail loudly', () => {
  const result = distributeSchedule([
    {slug:'a',section:'insights',date:'2026-11-13'},
    {slug:'b',section:'insights',date:'2026-11-13'},
  ],{today:'2026-11-12'});
  assert.deepEqual(result.map(x=>x.date),['2026-11-13','2026-11-16']);
  assert.throws(()=>distributeSchedule([{slug:'a',section:'insights'},{slug:'a',section:'insights'}],{today:'2026-11-12'}),/Duplicate/);
});

test('future series chapters use their reserved slots in reading order without redating history', () => {
  const result=distributeSchedule([
    {slug:'old',section:'insights',date:'2026-09-03',series:'Course',seriesOrder:3},
    {slug:'part-one',section:'insights',date:'2026-12-02',series:'Course',seriesOrder:1},
    {slug:'part-two',section:'insights',date:'2026-11-13',series:'Course',seriesOrder:2},
  ],{today:'2026-11-12'});
  assert.equal(result[0].date,'2026-09-03');
  assert.equal(result[1].date,'2026-11-13');
  assert.equal(result[2].date,'2026-12-02');
  assert.deepEqual(distributeSchedule(result,{today:'2026-11-12'}),result);
});

test('the complete planned queue has distinct, valid Monday/Wednesday/Friday dates', () => {
  const manifest = JSON.parse(readFileSync(new URL('../content/manifest.json',import.meta.url),'utf8'));
  const future = manifest.filter(record=>record.date>'2026-11-12');
  assert.ok(future.length>400);
  assert.equal(new Set(future.map(record=>record.date)).size,future.length);
  assert.ok(future.every(record=>isPublicationDay(record.date)));
});

test('same-named guide and short essay retain separate source identities on re-import', () => {
  const prior=new Map([['architecture-decision-records',{slug:'architecture-decision-records',title:'The short essay'}]]);
  const collisions=new Set(['architecture-decision-records']);
  const guide={coll:'blog',file:'architecture-decision-records.mdx',fm:{title:'The guide'}};
  assert.equal(importedSlug(guide,'architecture-decision-records',collisions,prior),'architecture-decision-records-guide');
  assert.equal(importedSlug({coll:'thoughts',file:'architecture-decision-records.md',fm:{title:'The short essay'}},'architecture-decision-records',collisions,prior),'architecture-decision-records');
});

test('dated snapshots take the earliest future slots without moving history, slot sets or early anchors',()=>{
 const records=[
  {slug:'history',section:'insights',title:'Published 2025',date:'2026-11-11'},
  {slug:'evergreen-a',section:'insights',title:'An evergreen guide',date:'2026-11-13'},
  {slug:'ai',section:'insights',title:'AI tools in 2026',date:'2026-11-16'},
  {slug:'evergreen-b',section:'insights',title:'Another evergreen guide',date:'2026-11-18'},
  {slug:'serverless',section:'insights',title:'Serverless in 2026',date:'2027-01-18'},
  {slug:'quantum',section:'insights',title:'Quantum in 2025',date:'2029-08-06'},
 ];
 const result=distributeSchedule(records,{today:'2026-11-12'}),bySlug=Object.fromEntries(result.map(r=>[r.slug,r]));
 assert.equal(bySlug.history.date,'2026-11-11');assert.equal(bySlug.ai.date,'2026-11-16');
 assert.equal(bySlug.serverless.date,'2026-11-13');assert.equal(bySlug.quantum.date,'2026-11-18');
 assert.deepEqual(result.map(r=>r.date).sort(),records.map(r=>r.date).sort());
 assert.deepEqual(distributeSchedule(result,{today:'2026-11-12'}),result);
 assert.equal(isTimeBoundHeadline({title:'A 2027 forecast'},'2026-11-12'),false);
 assert.equal(isTimeBoundHeadline({title:'Urgent update',timeSensitive:true},'2026-11-12'),true);
});

test('a time-bound series chapter brings its unpublished prerequisites forward in reading order',()=>{
 const records=[
  {slug:'evergreen-a',section:'insights',title:'Evergreen A',date:'2026-11-13'},
  {slug:'evergreen-b',section:'insights',title:'Evergreen B',date:'2026-11-16'},
  {slug:'first',section:'insights',title:'Foundations',date:'2027-01-18',series:'Course',seriesOrder:1},
  {slug:'second',section:'insights',title:'Practice in 2026',date:'2029-08-06',series:'Course',seriesOrder:2},
 ];
 const result=distributeSchedule(records,{today:'2026-11-12'});
 assert.equal(result[2].date,'2026-11-13');assert.equal(result[3].date,'2026-11-16');
 assert.deepEqual(result.map(r=>r.date).sort(),records.map(r=>r.date).sort());
 assert.deepEqual(distributeSchedule(result,{today:'2026-11-12'}),result);
});

test('the real future calendar does not bury dated snapshots behind years of evergreen posts',()=>{
 const today=publicationDate(),manifest=JSON.parse(readFileSync(new URL('../content/manifest.json',import.meta.url),'utf8'));
 const future=manifest.filter(r=>r.date>today).sort((a,b)=>a.date.localeCompare(b.date));
 const timely=future.filter(r=>isTimeBoundHeadline(r,today));
 const priority=new Set(timely);
 for(const r of timely)if(r.series)for(const chapter of future)if(chapter.series===r.series&&(chapter.seriesOrder||0)<=(r.seriesOrder||0))priority.add(chapter);
 const window=new Set(future.slice(0,priority.size).map(r=>r.date));
 for(const r of priority)assert.ok(window.has(r.date),`${r.slug} is dated but deferred until ${r.date}`);
});
