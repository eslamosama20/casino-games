const fs = require('fs');
const path = require('path');

const questionsFilePath = path.join(__dirname, '../src/data/questions.json');
const data = JSON.parse(fs.readFileSync(questionsFilePath, 'utf8'));

// 1. Update the category definition
const catIndex = data.categories.findIndex(c => c.id === 'audio_mystery');
if (catIndex !== -1) {
  data.categories[catIndex] = {
    id: 'audio_mystery',
    name: 'إفيهات وأفلام مصرية 🎭',
    icon: 'movie-open-star',
    color: '#F43F5E',
    description: 'خمن صاحب الإفيه أو الفيلم أو الأغنية المصرية الشهيرة!'
  };
}

// 2. Convert all audio_clip questions into written text questions
let convertedCount = 0;
data.questions = data.questions.map(q => {
  if (q.mediaType === 'audio_clip' || q.id.startsWith('audio_')) {
    convertedCount++;
    const { mediaType, mediaUrl, mediaTitle, revealDuration, ...rest } = q;
    return {
      ...rest,
      category: 'audio_mystery'
    };
  }
  return q;
});

fs.writeFileSync(questionsFilePath, JSON.stringify(data, null, 2), 'utf8');
console.log(`Successfully converted ${convertedCount} catchphrase questions to written text only!`);
