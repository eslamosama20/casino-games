const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'src', 'data', 'questions.json');
const currentData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Target: At least 100 questions per category!
// Categories:
// 1. football (65 -> 100) = +35
// 2. movies (61 -> 100) = +39
// 3. general (90 -> 100) = +10
// 4. riddles (55 -> 100) = +45
// 5. music_proverbs (58 -> 100) = +42
// 6. reversed_words (60 -> 100) = +40
// 7. emoji_movies (60 -> 100) = +40
// 8. challenges (60 -> 100) = +40
// 9. description_guess (50 -> 100) = +50
// 10. history (50 -> 100) = +50
// 11. geography (50 -> 100) = +50

console.log('Starting feeding script...');
