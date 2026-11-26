const fs = require('fs');
const path = require('path');

const questionsFilePath = path.join(__dirname, '../src/data/questions.json');
const data = JSON.parse(fs.readFileSync(questionsFilePath, 'utf8'));

// Map each of the 100 football players (by answer name) to their English & Arabic Wikipedia page titles
const playerWikiMap = {
  // 1-50 Egyptian & Arab Football Stars
  'محمد صلاح': { en: 'Mohamed_Salah', ar: 'محمد_صلاح' },
  'محمد أبو تريكة': { en: 'Mohamed_Aboutrika', ar: 'محمد_أبو_تريكة' },
  'محمود الخطيب': { en: 'Mahmoud_El_Khatib', ar: 'محمود_الخطيب' },
  'شيكابالا': { en: 'Shikabala', ar: 'شيكابالا' },
  'حسام حسن': { en: 'Hossam_Hassan', ar: 'حسام_حسن' },
  'عصام الحضري': { en: 'Essam_El_Hadary', ar: 'عصام_الحضري' },
  'محمد الشناوي': { en: 'Mohamed_El_Shenawy', ar: 'محمد_الشناوي' },
  'وائل جمعة': { en: 'Wael_Gomaa', ar: 'وائل_جمعة' },
  'محمد بركات': { en: 'Mohamed_Barakat', ar: 'محمد_بركات' },
  'أحمد حسام ميدو': { en: 'Mido_(footballer)', ar: 'أحمد_حسام_ميدو' },
  'عمر مرموش': { en: 'Omar_Marmoush', ar: 'عمر_مرموش' },
  'أحمد سيد زيزو': { en: 'Zizo_(footballer)', ar: 'أحمد_سيد_زيزو' },
  'إمام عاشور': { en: 'Emam_Ashour', ar: 'إمام_عاشور' },
  'محمود حسن تريزيجيه': { en: 'Trézéguet_(Egyptian_footballer)', ar: 'محمود_حسن_تريزيجيه' },
  'مصطفى محمد': { en: 'Mostafa_Mohamed_(footballer)', ar: 'مصطفى_محمد_(لاعب_كرة_قدم)' },
  'محمد النني': { en: 'Mohamed_Elneny', ar: 'محمد_النني' },
  'عبد الله السعيد': { en: 'Abdallah_El_Said', ar: 'عبد_الله_السعيد' },
  'حازم إمام': { en: 'Hazem_Emam', ar: 'حازم_إمام' },
  'حسني عبد ربه': { en: 'Hosny_Abd_Rabo', ar: 'حسني_عبد_ربه' },
  'محمد زيدان': { en: 'Mohamed_Zidan', ar: 'محمد_زيدان_(لاعب_كرة_قدم)' },
  'أحمد حسن': { en: 'Ahmed_Hassan', ar: 'أحمد_حسن_(لاعب_كرة_قدم)' },
  'حسام غالي': { en: 'Hossam_Ghaly', ar: 'حسام_غالي' },
  'علي معلول': { en: 'Ali_Maâloul', ar: 'علي_معلول' },
  'محمد عبد المنعم': { en: 'Mohamed_Abdelmonem', ar: 'محمد_عبد_المنعم_(لاعب_كرة_قدم)' },
  'أحمد حجازي': { en: 'Ahmed_Hegazi', ar: 'أحمد_حجازي_(لاعب_كرة_قدم)' },
  'عمرو السولية': { en: 'Amr_El_Solia', ar: 'عمرو_السولية' },
  'محمد مجدي قفشة': { en: 'Afsha_(footballer)', ar: 'محمد_مجدي_أفشة' },
  'محمود كهربا': { en: 'Kahraba_(footballer)', ar: 'محمود_كهربا' },
  'طاهر أبو زيد': { en: 'Taher_Abouzeid', ar: 'طاهر_أبو_زيد' },
  'إبراهيم حسن': { en: 'Ibrahim_Hassan', ar: 'إبراهيم_حسن' },
  'أحمد فتحي': { en: 'Ahmed_Fathy', ar: 'أحمد_فتحي' },
  'مجدي عبد الغني': { en: 'Magdi_Abdelghani', ar: 'مجدي_عبد_الغني' },
  'نادر السيد': { en: 'Nader_El-Sayed', ar: 'نادر_السيد' },
  'شريف إكرامي': { en: 'Sherif_Ekramy', ar: 'شريف_إكرامي' },
  'إكرامي الشحات': { en: 'Ekramy_El-Shahat', ar: 'إكرامي_الشحات' },
  'حسن شحاتة': { en: 'Hassan_Shehata', ar: 'حسن_شحاتة' },
  'عماد متعب': { en: 'Emad_Moteab', ar: 'عماد_متعب' },
  'محمد ناجي جدو': { en: 'Gedo', ar: 'محمد_ناجي_جدو' },
  'رياض محرز': { en: 'Riyad_Mahrez', ar: 'رياض_محرز' },
  'أشرف حكيمي': { en: 'Achraf_Hakimi', ar: 'أشرف_حكيمي' },
  'ياسين بونو': { en: 'Yassine_Bounou', ar: 'ياسين_بونو' },
  'حكيم زياش': { en: 'Hakim_Ziyech', ar: 'حكيم_زياش' },
  'سفيان أمرابط': { en: 'Sofyan_Amrabat', ar: 'سفيان_أمرابط' },
  'عز الدين أوناحي': { en: 'Azzedine_Ounahi', ar: 'عز_الدين_أوناحي' },
  'يوسف النصيري': { en: 'Youssef_En-Nesyri', ar: 'يوسف_النصيري' },
  'إسماعيل بن ناصر': { en: 'Ismaël_Bennacer', ar: 'إسماعيل_بن_ناصر' },
  'بغداد بونجاح': { en: 'Baghdad_Bounedjah', ar: 'بغداد_بونجاح' },
  'سالم الدوسري': { en: 'Salem_Al-Dawsari', ar: 'سالم_الدوسري' },
  'ياسر القحطاني': { en: 'Yasser_Al-Qahtani', ar: 'ياسر_القحطاني' },
  'طارق حامد': { en: 'Tarek_Hamed', ar: 'طارق_حامد' },

  // 51-100 World Football Legends
  'ليونيل ميسي': { en: 'Lionel_Messi', ar: 'ليونيل_ميسي' },
  'كريستيانو رونالدو': { en: 'Cristiano_Ronaldo', ar: 'كريستيانو_رونالدو' },
  'دييجو مارادونا': { en: 'Diego_Maradona', ar: 'دييغو_مارادونا' },
  'بيليه': { en: 'Pelé', ar: 'بيليه' },
  'زين الدين زيدان': { en: 'Zinedine_Zidane', ar: 'زين_الدين_زيدان' },
  'رونالدينيو': { en: 'Ronaldinho', ar: 'رونالدينيو' },
  'رونالدو الظاهرة': { en: 'Ronaldo_(Brazilian_footballer)', ar: 'رونالدو' },
  'كيليان مبابي': { en: 'Kylian_Mbappé', ar: 'كيليان_مبابي' },
  'إيرلينج هالاند': { en: 'Erling_Haaland', ar: 'إيرلينغ_هالاند' },
  'نيمار دا سيلفا': { en: 'Neymar', ar: 'نيمار' },
  'كريم بنزيما': { en: 'Karim_Benzema', ar: 'كريم_بنزيما' },
  'لوكا مودريتش': { en: 'Luka_Modrić', ar: 'لوكا_مودريتش' },
  'كيفين دي بروين': { en: 'Kevin_De_Bruyne', ar: 'كيفين_دي_بروين' },
  'روبرت ليفاندوفسكي': { en: 'Robert_Lewandowski', ar: 'روبرت_ليفاندوفسكي' },
  'أندريس إنييستا': { en: 'Andrés_Iniesta', ar: 'أندريس_إنييستا' },
  'تشافي هيرنانديز': { en: 'Xavi', ar: 'تشافي_هيرنانديز' },
  'تييري هنري': { en: 'Thierry_Henry', ar: 'تييري_هنري' },
  'ريكاردو كاكا': { en: 'Kaká', ar: 'كاكا' },
  'أندريا بيرلو': { en: 'Andrea_Pirlo', ar: 'أندريا_بيرلو' },
  'جانلويجي بوفون': { en: 'Gianluigi_Buffon', ar: 'جانلويجي_بوفون' },
  'إيكر كاسياس': { en: 'Iker_Casillas', ar: 'إيكر_كاسياس' },
  'مانويل نوير': { en: 'Manuel_Neuer', ar: 'مانويل_نوير' },
  'سيرجيو راموس': { en: 'Sergio_Ramos', ar: 'سيرخيو_راموس' },
  'كارليس بويول': { en: 'Carles_Puyol', ar: 'كارليس_بويول' },
  'فيرجيل فان دايك': { en: 'Virgil_van_Dijk', ar: 'فيرجيل_فان_دايك' },
  'زلاتان إبراهيموفيتش': { en: 'Zlatan_Ibrahimović', ar: 'زلاتان_إبراهيموفيتش' },
  'لويس سواريز': { en: 'Luis_Suárez', ar: 'لويس_سواريز' },
  'واين روني': { en: 'Wayne_Rooney', ar: 'واين_روني' },
  'ديفيد بيكهام': { en: 'David_Beckham', ar: 'ديفيد_بيكهام' },
  'ستيفن جيرارد': { en: 'Steven_Gerrard', ar: 'ستيفن_جيرارد' },
  'فرانك لامبارد': { en: 'Frank_Lampard', ar: 'فرانك_لامبارد' },
  'إيدين هازارد': { en: 'Eden_Hazard', ar: 'إيدين_هازارد' },
  'جاريث بيل': { en: 'Gareth_Bale', ar: 'غاريث_بيل' },
  'فينيسيوس جونيور': { en: 'Vinícius_Júnior', ar: 'فينيسيوس_جونيور' },
  'جود بيلينجهام': { en: 'Jude_Bellingham', ar: 'جود_بيلينغهام' },
  'لامين يامال': { en: 'Lamine_Yamal', ar: 'لامين_يامال' },
  'رودري': { en: 'Rodri_(footballer,_born_1996)', ar: 'رودري_(لاعب_كرة_قدم_إسباني)' },
  'توني كروس': { en: 'Toni_Kroos', ar: 'توني_كروس' },
  'مارسيلو': { en: 'Marcelo_(footballer,_born_1988)', ar: 'مارسيلو_فييرا' },
  'داني ألفيس': { en: 'Dani_Alves', ar: 'داني_ألفيس' },
  'سيرجيو أجويرو': { en: 'Sergio_Agüero', ar: 'سيرخيو_أغويرو' },
  'هاري كين': { en: 'Harry_Kane', ar: 'هاري_كين' },
  'أنخيل دي ماريا': { en: 'Ángel_Di_María', ar: 'أنخيل_دي_ماريا' },
  'باولو ديبالا': { en: 'Paulo_Dybala', ar: 'باولو_ديبالا' },
  'ديدييه دروجبا': { en: 'Didier_Drogba', ar: 'ديدييه_دروغبا' },
  'صامويل إيتو': { en: 'Samuel_Eto%27o', ar: 'صامويل_إيتو' },
  'فرانك ريبيري': { en: 'Franck_Ribéry', ar: 'فرانك_ريبيري' },
  'آريين روبن': { en: 'Arjen_Robben', ar: 'آريين_روبن' },
  'ساديو ماني': { en: 'Sadio_Mané', ar: 'ساديو_ماني' },
  'سون هيونج مين': { en: 'Son_Heung-min', ar: 'سون_هيونغ_مين' }
};

async function fetchWikiImage(lang, title) {
  try {
    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(decodeURIComponent(title))}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'CasinoGamesQuizApp/1.0 (https://github.com/eslamosama20/casino-games)' }
    });
    if (!res.ok) return null;
    const json = await res.json();
    // Prefer thumbnail (fast loading, ~330-600px, always exists if image exists) or originalimage
    let imgUrl = json.thumbnail?.source || json.originalimage?.source || null;
    if (!imgUrl) return null;
    // Strip utm query params so it's clean
    imgUrl = imgUrl.split('?')[0];
    // For thumb.wikimedia.org, bump 330px to 500px or use originalimage if it's < 1500px
    if (json.originalimage?.source) {
      const origClean = json.originalimage.source.split('?')[0];
      // Verify originalimage works with direct fetch (no User-Agent)
      const check = await fetch(origClean, { method: 'HEAD' });
      if (check.ok && (check.headers.get('content-type') || '').startsWith('image/')) {
        return origClean;
      }
    }
    // Otherwise check thumbnail URL
    const checkThumb = await fetch(imgUrl, { method: 'HEAD' });
    if (checkThumb.ok && (checkThumb.headers.get('content-type') || '').startsWith('image/')) {
      return imgUrl;
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function main() {
  const blurQuestions = data.questions.filter(q => q.categoryId === 'image_blur' || q.mediaType === 'image_blur');
  console.log(`Found ${blurQuestions.length} image_blur questions. Fetching real Wikipedia images...`);

  const results = {};
  const missing = [];

  // Process in batches of 10
  const names = Object.keys(playerWikiMap);
  for (let i = 0; i < names.length; i += 10) {
    const batch = names.slice(i, i + 10);
    await Promise.all(batch.map(async (name) => {
      const entry = playerWikiMap[name];
      let url = await fetchWikiImage('en', entry.en);
      if (!url && entry.ar) {
        url = await fetchWikiImage('ar', entry.ar);
      }
      if (url) {
        results[name] = url;
        console.log(`✓ ${name} -> ${url}`);
      } else {
        missing.push(name);
        console.log(`✗ MISSING: ${name}`);
      }
    }));
  }

  console.log(`\nSummary: ${Object.keys(results).length} found, ${missing.length} missing.`);
  if (missing.length > 0) {
    console.log('Missing players:', missing);
  }

  // Update questions.json
  for (const q of data.questions) {
    if (q.categoryId === 'image_blur' || q.mediaType === 'image_blur') {
      if (results[q.answer]) {
        q.mediaUrl = results[q.answer];
      }
    }
  }

  // Bump version to 26
  data.version = 26;
  fs.writeFileSync(questionsFilePath, JSON.stringify(data, null, 2), 'utf8');
  console.log('Saved updated questions.json (version 26)');
}

main();
