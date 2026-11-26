const fs = require('fs');
const path = require('path');

const questionsFilePath = path.join(__dirname, '../src/data/questions.json');
const data = JSON.parse(fs.readFileSync(questionsFilePath, 'utf8'));

const queries = [
  { name: 'محمد أبو تريكة', q: 'Mohamed Aboutrika', ar: 'محمد أبو تريكة' },
  { name: 'حسام حسن', q: 'Hossam Hassan footballer', ar: 'حسام حسن' },
  { name: 'وائل جمعة', q: 'Wael Gomaa', ar: 'وائل جمعة' },
  { name: 'حسني عبد ربه', q: 'Hosny Abd Rabo', ar: 'حسني عبد ربه' },
  { name: 'إبراهيم حسن', q: 'Ibrahim Hassan footballer', ar: 'إبراهيم حسن' },
  { name: 'أحمد حسن', q: 'Ahmed Hassan Egyptian footballer', ar: 'أحمد حسن' },
  { name: 'طاهر أبو زيد', q: 'Taher Abouzeid', ar: 'طاهر أبو زيد' },
  { name: 'محمد ناجي جدو', q: 'Gedo Egyptian footballer', ar: 'محمد ناجي جدو' }
];

async function search(lang, q) {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrlimit=5&prop=pageimages&pithumbsize=500&format=json`;
  const r = await fetch(url, { headers: { 'User-Agent': 'CasinoGamesQuizApp/1.0' } });
  const d = await r.json();
  const pages = Object.values(d.query?.pages || {});
  return pages
    .filter(p => p.thumbnail?.source && !p.thumbnail.source.includes('.svg'))
    .map(p => ({ title: p.title, img: p.thumbnail.source.split('?')[0] }));
}

async function main() {
  const fixed = {};
  for (const item of queries) {
    let res = await search('en', item.q);
    if (!res.length) res = await search('ar', item.ar);
    console.log(item.name, '=>', res[0] || 'NONE');
    if (res[0]) {
      const head = await fetch(res[0].img, { method: 'HEAD' });
      console.log('   HTTP:', head.status, head.headers.get('content-type'));
      if (head.ok) fixed[item.name] = res[0].img;
    }
  }

  for (const q of data.questions) {
    if ((q.categoryId === 'image_blur' || q.mediaType === 'image_blur') && fixed[q.answer]) {
      q.mediaUrl = fixed[q.answer];
    }
  }

  // Also check if ANY image_blur question still has unsplash or svg
  const bad = data.questions.filter(q =>
    (q.categoryId === 'image_blur' || q.mediaType === 'image_blur') &&
    (!q.mediaUrl || q.mediaUrl.includes('unsplash.com') || q.mediaUrl.includes('.svg'))
  );
  console.log('\nRemaining non-wiki or svg questions:', bad.map(b => ({ answer: b.answer, url: b.mediaUrl })));

  fs.writeFileSync(questionsFilePath, JSON.stringify(data, null, 2), 'utf8');
}

main();
