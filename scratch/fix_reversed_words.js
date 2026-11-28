const fs = require('fs');
const path = require('path');

const questionsFilePath = path.join(__dirname, '../src/data/questions.json');
const data = JSON.parse(fs.readFileSync(questionsFilePath, 'utf8'));

const fixes = {
  rev_080: "اقرأ الكلمة المعكوسة: 'ن - ا - س - ل'؟",      // لسان -> ن ا س ل
  rev_083: "اقرأ الكلمة المعكوسة: 'س - ي - ئ - ر'؟",      // رئيس -> س ي ئ ر
  rev_088: "اقرأ الكلمة المعكوسة: 'م - ر - ه'؟",          // هرم -> م ر ه
  rev_091: "اقرأ الكلمة المعكوسة: 'ح - ا - ل - س'؟",      // سلاح -> ح ا ل س
  rev_095: "اقرأ الكلمة المعكوسة: 'ة - ف - ص - ا - ع'؟",  // عاصفة -> ة ف ص ا ع
  rev_097: "اقرأ الكلمة المعكوسة: 'ف - ح - ت - م'؟",      // متحف -> ف ح ت م
  rev_098: "اقرأ الكلمة المعكوسة: 'ر - ج - ا - ت'؟",      // تاجر -> ر ج ا ت
};

let fixedCount = 0;
for (const q of data.questions) {
  if (fixes[q.id]) {
    q.question = fixes[q.id];
    fixedCount++;
  }
}

// Audit all reversed_words questions
const revQuestions = data.questions.filter(q => q.categoryId === 'reversed_words');
const mismatches = [];
for (const q of revQuestions) {
  const m = q.question.match(/'([^']+)'/);
  if (m) {
    const shownLetters = m[1].split('-').map(s => s.trim()).join('');
    const expectedReversed = [...q.answer.trim()].reverse().join('');
    if (shownLetters !== expectedReversed) {
      mismatches.push({ id: q.id, answer: q.answer, shown: shownLetters, expected: expectedReversed });
    }
  }
}

console.log(`Fixed ${fixedCount} reversed_words questions.`);
console.log(`Audited ${revQuestions.length} reversed_words questions. Remaining mismatches: ${mismatches.length}`);
if (mismatches.length > 0) {
  console.log('Mismatches:', mismatches);
  // Auto-fix any remaining single-word mismatches where answer has no spaces
  for (const mm of mismatches) {
    if (!mm.answer.includes(' ')) {
      const q = data.questions.find(x => x.id === mm.id);
      const reversedFormatted = [...mm.answer.trim()].reverse().join(' - ');
      q.question = q.question.replace(/'[^']+'/, `'${reversedFormatted}'`);
      console.log(`Auto-fixed ${mm.id}: ${mm.answer} -> '${reversedFormatted}'`);
    }
  }
}

data.version = 28;
fs.writeFileSync(questionsFilePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Saved questions.json (version 28).');
