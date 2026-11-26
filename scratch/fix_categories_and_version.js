const fs = require('fs');
const path = require('path');

const questionsFilePath = path.join(__dirname, '../src/data/questions.json');
const data = JSON.parse(fs.readFileSync(questionsFilePath, 'utf8'));

// Bump version to 25 so cache bust happens on all clients
data.version = 25;

let fixedCount = 0;
data.questions = data.questions.map(q => {
  const cat = q.categoryId || q.category || 'general';
  if (!q.categoryId || !q.category) {
    fixedCount++;
  }
  return {
    ...q,
    categoryId: cat,
    category: cat
  };
});

fs.writeFileSync(questionsFilePath, JSON.stringify(data, null, 2), 'utf8');
console.log(`Version bumped to ${data.version}. Fixed ${fixedCount} questions to have both categoryId and category!`);

const blurCount = data.questions.filter(q => q.categoryId === 'image_blur').length;
console.log(`image_blur questions verified count: ${blurCount}`);
const audioCount = data.questions.filter(q => q.categoryId === 'audio_mystery').length;
console.log(`audio_mystery questions verified count: ${audioCount}`);
