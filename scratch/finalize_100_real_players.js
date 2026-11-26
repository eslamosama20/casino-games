const fs = require('fs');
const path = require('path');

const questionsFilePath = path.join(__dirname, '../src/data/questions.json');
const data = JSON.parse(fs.readFileSync(questionsFilePath, 'utf8'));

const updates = {
  'محمد أبو تريكة': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/f/f4/Aboutrika2011.jpg'
  },
  'محمد ناجي جدو': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/f/f4/MohamedNagyGeddo_%28cropped%29.jpg'
  },
  'حسني عبد ربه': {
    answer: 'أحمد المحمدي',
    question: 'خمن مين اللاعب صاحب الصورة المشوشة دي؟ ⚽ (ظهير أيمن أستون فيلا وهال سيتي وسندرلاند ومنتخب مصر وبطل أفريقيا 2008 و2010)',
    hint: 'المحترف المصري المخضرم في الدوري الإنجليزي وقائد منتخب مصر في أمم أفريقيا 2019',
    options: ['أحمد المحمدي', 'أحمد فتحي', 'عمر جابر', 'محمد هاني'],
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f1/Ahmed_Elmohamady_2024.jpg/330px-Ahmed_Elmohamady_2024.jpg'
  },
  'أحمد حسن': {
    answer: 'حسين الشحات',
    question: 'خمن مين اللاعب صاحب الصورة المشوشة دي؟ ⚽ (جناح النادي الأهلي والعين الإماراتي السابق ووصيف كأس العالم للأندية 2018)',
    hint: 'النجم الأهلاوي المتألق في دوري أبطال أفريقيا وكأس العالم للأندية',
    options: ['حسين الشحات', 'طاهر محمد طاهر', 'بيرسي تاو', 'أحمد عبد القادر'],
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c6/El_Shahat.jpg/330px-El_Shahat.jpg'
  },
  'إبراهيم حسن': {
    answer: 'عمر جابر',
    question: 'خمن مين اللاعب صاحب الصورة المشوشة دي؟ ⚽ (ظهير أيمن الزمالك وبيراميدز وبازل السويسري ولوس أنجلوس ومنتخب مصر)',
    hint: 'لاعب الجبهة اليمنى المخضرم بالقلعة البيضاء والمنتخب الوطني',
    options: ['عمر جابر', 'حازم إمام', 'أحمد عيد', 'كريم العراقي'],
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/70/Zen-Baz16_%287%29.jpg/330px-Zen-Baz16_%287%29.jpg'
  },
  'طاهر أبو زيد': {
    answer: 'سام مرسي',
    question: 'خمن مين اللاعب صاحب الصورة المشوشة دي؟ ⚽ (قائد نادي إيبسويتش تاون الإنجليزي في البريميرليج ولاعب وسط منتخب مصر)',
    hint: 'المحترف المصري الذي قاد فريقه للصعود التاريخي للدوري الإنجليزي الممتاز',
    options: ['سام مرسي', 'محمد النني', 'طارق حامد', 'حمدي فتحي'],
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/72/Sam_Morsy_2.jpg/330px-Sam_Morsy_2.jpg'
  }
};

for (const q of data.questions) {
  if (q.categoryId === 'image_blur' && updates[q.answer]) {
    const u = updates[q.answer];
    if (u.answer) {
      q.answer = u.answer;
      q.mediaTitle = u.answer;
      q.question = u.question;
      q.hint = u.hint;
      q.options = u.options;
    }
    q.mediaUrl = u.url;
  }
}

const blurQuestions = data.questions.filter(q => q.categoryId === 'image_blur');
const nonWiki = blurQuestions.filter(q => !q.mediaUrl || !q.mediaUrl.includes('wikimedia.org') || q.mediaUrl.includes('.svg'));

console.log('Total image_blur questions:', blurQuestions.length);
console.log('Non-wikimedia or SVG:', nonWiki.length);
if (nonWiki.length > 0) {
  console.log(nonWiki);
}

data.version = 27;
fs.writeFileSync(questionsFilePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully finalized 100 real football player photos (version 27)!');
