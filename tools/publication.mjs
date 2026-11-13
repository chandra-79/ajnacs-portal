/* One site-local calendar for scheduling, generation and verification. */
export const PUBLICATION_TIME_ZONE = 'America/New_York';
export const PUBLICATION_DAYS = [1, 3, 5];

export function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value + 'T00:00:00Z')) &&
    new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
}

export function publicationDate({ override = process.env.TODAY, now = new Date() } = {}) {
  if (override !== undefined && override !== '') {
    if (!validDate(override)) throw new Error('TODAY must be a real YYYY-MM-DD calendar date');
    return override;
  }
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: PUBLICATION_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const part = type => parts.find(value => value.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function isPublicationDay(date) {
  return validDate(date) && PUBLICATION_DAYS.includes(new Date(date + 'T00:00:00Z').getUTCDay());
}

export function isTimeBoundHeadline(record,today=publicationDate()) {
  const year=Number(today.slice(0,4));
  return record.timeSensitive===true || [...String(record.title||'').matchAll(/\b20\d{2}\b/g)].some(match=>Number(match[0])<=year);
}

export function distributeSchedule(input, { today = publicationDate(), ranking = [] } = {}) {
  if (!validDate(today)) throw new Error('The scheduling day must be YYYY-MM-DD');
  const records = input.map(record => ({ ...record }));
  const paths = new Set();
  const occupied = new Set();
  const pending = [];
  const score = new Map(ranking.map(record => [record.slug, record.score]));
  for (const record of records) {
    const path = `${record.section}/${record.slug}`;
    if (paths.has(path)) throw new Error(`Duplicate publishing path: ${path}`);
    paths.add(path);
    if (validDate(record.date) && record.date <= today) {
      record.status = 'published';
    } else if (isPublicationDay(record.date) && !occupied.has(record.date)) {
      occupied.add(record.date);
      record.status = 'scheduled';
    } else {
      if (record.status === 'published') throw new Error(`Invalid published date: ${path}`);
      pending.push(record);
    }
  }
  pending.sort((a,b) => (score.get(b.slug) || 0) - (score.get(a.slug) || 0) || a.slug.localeCompare(b.slug));
  let cursor = new Date(today + 'T00:00:00Z');
  for (const record of pending) {
    do { cursor.setUTCDate(cursor.getUTCDate() + 1); }
    while (!isPublicationDay(cursor.toISOString().slice(0, 10)) || occupied.has(cursor.toISOString().slice(0, 10)));
    record.date = cursor.toISOString().slice(0, 10);
    record.status = 'scheduled';
    occupied.add(record.date);
  }
  // Dated snapshots must not wait behind years of evergreen material. Keep
  // the same reserved slot set and early timely anchors; exchange late
  // snapshots with evergreen occupants of the earliest available slots.
  const future=records.filter(record=>record.date>today).sort((a,b)=>a.date.localeCompare(b.date));
  const priority=new Set(future.filter(record=>isTimeBoundHeadline(record,today)));
  for(const record of [...priority])if(record.series){
    for(const chapter of future)if(chapter.series===record.series && (chapter.seriesOrder||0)<=(record.seriesOrder||0))priority.add(chapter);
  }
  const prioritySlots=future.slice(0,priority.size).map(record=>record.date);
  const anchors=new Set([...priority].filter(record=>prioritySlots.includes(record.date)).map(record=>record.date));
  const freePrioritySlots=prioritySlots.filter(date=>!anchors.has(date));
  const promote=[...priority].filter(record=>!prioritySlots.includes(record.date)).sort((a,b)=>a.date.localeCompare(b.date)||a.slug.localeCompare(b.slug));
  promote.forEach((record,index)=>{
    const nextDate=freePrioritySlots[index];
    const displaced=future.find(other=>other.date===nextDate);
    const previousDate=record.date;
    record.date=nextDate;
    if(displaced)displaced.date=previousDate;
  });
  // Preserve each series' reserved dates, but make future chapters arrive in
  // reading order. Already-published chapters keep their historical dates.
  const series = new Map();
  for (const record of records) {
    if (record.series && record.date > today) {
      if (!series.has(record.series)) series.set(record.series, []);
      series.get(record.series).push(record);
    }
  }
  for (const items of series.values()) {
    const slots = items.map(record=>record.date).sort();
    items.sort((a,b)=>(a.seriesOrder || 0)-(b.seriesOrder || 0) || a.slug.localeCompare(b.slug));
    items.forEach((record,index)=>{ record.date=slots[index]; });
  }
  return records;
}
