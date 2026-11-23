const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'src', 'data', 'questions.json');
const currentData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// 1. Add new categories if not present
const newCategories = [
  {
    id: 'description_guess',
    name: 'مين أنا؟ (وصف وتخمين)',
    icon: 'card-search-outline',
    color: '#EC4899',
    description: 'أوصاف لأشياء وشخصيات وأماكن.. خمن المطلوب بالظبط!'
  },
  {
    id: 'history',
    name: 'تاريخ وأبطال',
    icon: 'pillar',
    color: '#D97706',
    description: 'فراعنة، قادة، معارك وأحداث غيرت مجرى التاريخ'
  },
  {
    id: 'geography',
    name: 'جغرافيا وعواصم',
    icon: 'earth',
    color: '#06B6D4',
    description: 'عواصم ودول، بحار وقارات، وتضاريس العالم الشهيرة'
  }
];

newCategories.forEach(newCat => {
  if (!currentData.categories.some(c => c.id === newCat.id)) {
    currentData.categories.push(newCat);
  }
});

// 2. Prepare description_guess questions (50 items)
const descQuestions = [
  {
    id: "desc_001",
    categoryId: "description_guess",
    question: "أنا شيء أبيض أو شفاف، موجود في كل مطبخ، بدوب لو نزلت المية، وبدوني الأكل ملوش طعم.. مين أنا؟",
    answer: "الملح",
    hint: "موجود في الملاحة على السفرة",
    difficulty: "easy"
  },
  {
    id: "desc_002",
    categoryId: "description_guess",
    question: "بمشي من غير رجلين، وبطير من غير جناحين، وبعيط وأبكي من غير عينين.. مين أنا؟",
    answer: "السحابة (أو الغيمة / المطر)",
    hint: "موجودة في السما فوق",
    difficulty: "medium"
  },
  {
    id: "desc_003",
    categoryId: "description_guess",
    question: "كل ما تكبر في العمر تقصر، وكل ما تصغر تطول، ولو ولعت فيها تنورلك الضلمة.. مين أنا؟",
    answer: "الشمعة",
    hint: "بتنور في أعياد الميلاد",
    difficulty: "easy"
  },
  {
    id: "desc_004",
    categoryId: "description_guess",
    question: "مصنوع من حديد، بمشي على شريطين، بشيل آلاف البشر وبصفر بصوت عالي يرن في المحطة.. مين أنا؟",
    answer: "القطار (القطر)",
    hint: "وسيلة مواصلات بين المحافظات",
    difficulty: "easy"
  },
  {
    id: "desc_005",
    categoryId: "description_guess",
    question: "أكلة مصرية شعبية مشهورة، ميكس مكرونة ورز وعدس وشعرية وبصل مقرمش ودقة وشطة بتولع.. مين أنا؟",
    answer: "الكشري",
    hint: "بيتاكل في علبة فويل أو طبق ستانلس",
    difficulty: "easy"
  },
  {
    id: "desc_006",
    categoryId: "description_guess",
    question: "شخصية كرتونية مصرية أسمر ولابس جلابية وطاقية، معاه معزة اسمها رشيدة ومغني التتر الكينج محمد منير.. مين أنا؟",
    answer: "بكار",
    hint: "بيجي في رمضان من النوبة",
    difficulty: "easy"
  },
  {
    id: "desc_007",
    categoryId: "description_guess",
    question: "اختراع صغير في جيبك، بتلمسه بصوابعك، بينور ويصورك ويوصلك بأي حد في العالم.. مين أنا؟",
    answer: "الموبايل (الهاتف الذكي)",
    hint: "أنت ماسكه في إيدك دلوقتي",
    difficulty: "easy"
  },
  {
    id: "desc_008",
    categoryId: "description_guess",
    question: "حيوان معروف بالصبر والتحمل، عنده سنام وبيمشي في الصحراء وممكن يقعد أيام من غير ما يشرب.. مين أنا؟",
    answer: "الجمل (سفينة الصحراء)",
    hint: "حيوان صحراوي شهير",
    difficulty: "easy"
  },
  {
    id: "desc_009",
    categoryId: "description_guess",
    question: "شيء كل ما تاخد منه يكبر.. وكل ما تحط فيه يصغر.. مين أنا؟",
    answer: "الحفرة",
    hint: "في الأرض لو حفرت زيادة بتوسع",
    difficulty: "medium"
  },
  {
    id: "desc_010",
    categoryId: "description_guess",
    question: "عندي أسنان كتير جداً بس عمري ما بعض ولا بأكل بيها، وبسرحلك شعرك.. مين أنا؟",
    answer: "المشط",
    hint: "موجود على التسريحة",
    difficulty: "easy"
  },
  {
    id: "desc_011",
    categoryId: "description_guess",
    question: "مليان خرام وثقوب في كل حتة، ومع ذلك بحبس المية وبغسل بيا المواعين.. مين أنا؟",
    answer: "الإسفنج (سفنجة المطبخ)",
    hint: "لونه أصفر أو أخضر في الحوض",
    difficulty: "easy"
  },
  {
    id: "desc_012",
    categoryId: "description_guess",
    question: "حاجة ملكك لوحدك، بس الناس التانية بتستخدمها وتنادي بيها أكتر منك.. مين أنا؟",
    answer: "اسمك (الاسم)",
    hint: "مكتوب في بطاقتك الشخصية",
    difficulty: "medium"
  },
  {
    id: "desc_013",
    categoryId: "description_guess",
    question: "بطلع في السما بعد المطر والشمس طالعة، مكون من 7 ألوان مبهجة ومحدش يقدر يلمسني.. مين أنا؟",
    answer: "قوس قزح",
    hint: "ظاهرة ضوئية طبيعية بألوان الطيف",
    difficulty: "easy"
  },
  {
    id: "desc_014",
    categoryId: "description_guess",
    question: "شخصية صعيدية سينمائية شهيرة، جه من الصعيد لابس بدلة صفراء ودخل الجامعة الأمريكية وحب عبلة.. مين أنا؟",
    answer: "خلف الدهشوري خلف (محمد هنيدي)",
    hint: "صعيدي في الجامعة الأمريكية",
    difficulty: "easy"
  },
  {
    id: "desc_015",
    categoryId: "description_guess",
    question: "مشروب لونه أسود وريحته بتفوق الصبح، بيتشرب سادة أو على الريحة أو مظبوط أو زيادة في فنجان.. مين أنا؟",
    answer: "القهوة",
    hint: "بيتعمل في كنكة",
    difficulty: "easy"
  },
  {
    id: "desc_016",
    categoryId: "description_guess",
    question: "شيء بيمشي قدامك ومتقدرش تسبقه، ولما تقف في الشمس بتلاقيه أسود على الأرض وراسك في راسه.. مين أنا؟",
    answer: "الضل (خيالك / ظلك)",
    hint: "بيختفي في الضلمة",
    difficulty: "easy"
  },
  {
    id: "desc_017",
    categoryId: "description_guess",
    question: "عندي رقبة طويلة جداً، باكل ورق الشجر العالي، وجلدي منقط بني وأصفر.. مين أنا؟",
    answer: "الزرافة",
    hint: "أطول حيوان بري",
    difficulty: "easy"
  },
  {
    id: "desc_018",
    categoryId: "description_guess",
    question: "جهاز في المطبخ، بتدخل الأكل جواه بارد يلف لفتين ويطلع في دقيقة بيغلي وسخن.. مين أنا؟",
    answer: "الميكروويف",
    hint: "بيشتغل بموجات حرارية سريعة",
    difficulty: "easy"
  },
  {
    id: "desc_019",
    categoryId: "description_guess",
    question: "شيء بتشاركه بينك وبين صاحبك.. لو حد تالت عرفه مبقاش موجود أصلاً.. مين أنا؟",
    answer: "السر",
    hint: "بنقوله في الودن وبنحلف نكتمه",
    difficulty: "medium"
  },
  {
    id: "desc_020",
    categoryId: "description_guess",
    question: "أنا طائر بس عمري ما طرت في السما، بعيش في التلج ولابس بدلة سودا بقميص أبيض وبتمايل في المشي.. مين أنا؟",
    answer: "البطريق",
    hint: "بيعيش في القطب الجنوبي",
    difficulty: "easy"
  },
  {
    id: "desc_021",
    categoryId: "description_guess",
    question: "حاجة بتسمعها وبتتكلمها بس ملهاش جسد ولا لسان، وبتكرر كلامك في الأوضة الفاضية أو بين الجبال.. مين أنا؟",
    answer: "صدى الصوت",
    hint: "ارتداد الصوت في الأماكن الواسعة",
    difficulty: "medium"
  },
  {
    id: "desc_022",
    categoryId: "description_guess",
    question: "فاكهة قشرتها صفراء بنرميها، مفيدة جداً وبتقوي الأعصاب وبوتاسيوم عالي، والقرد بيموت فيها.. مين أنا؟",
    answer: "الموز",
    hint: "فاكهة استوائية صفراء",
    difficulty: "easy"
  },
  {
    id: "desc_023",
    categoryId: "description_guess",
    question: "شيء بيدخل المية ومبيبلش، وبيمشي في الشمس ومبيعرقش، وبيعكس شكلك لما تقف قدامه.. مين أنا؟",
    answer: "المرآة (أو الضوء / الخيال)",
    hint: "بتسرح شعرك قدامها",
    difficulty: "medium"
  },
  {
    id: "desc_024",
    categoryId: "description_guess",
    question: "ورقة صغيرة بفلوس بتشتريها وتلزقها على جوابك عشان يطير ويوصل لبلد تانية.. مين أنا؟",
    answer: "طابع البريد",
    hint: "بيتباع في البوسطة",
    difficulty: "medium"
  },
  {
    id: "desc_025",
    categoryId: "description_guess",
    question: "أنا بيت ماليش ولا باب ولا شباك ولا سقف، وبكسر البيت ده عشان آكل اللي جواه.. مين أنا؟",
    answer: "البيضة",
    hint: "الفرخة بتبيضها وبنعمل منها أومليت",
    difficulty: "easy"
  },
  {
    id: "desc_026",
    categoryId: "description_guess",
    question: "شخصية كرتونية بحرية لونه أصفر ومربع، بيعيش في قاع الهامور وبيشتغل طباخ في مقرمشات سلطع.. مين أنا؟",
    answer: "سبونج بوب سكوير بانتس",
    hint: "صاحبه بسيط نجم البحر ومستر سلطع",
    difficulty: "easy"
  },
  {
    id: "desc_027",
    categoryId: "description_guess",
    question: "جماد عنده قلب بس مبيفكرش ولا بينبض، ولو قطعت قلبه بيطلعلك خشب وشجر.. مين أنا؟",
    answer: "جذع الشجرة (أو قلم الرصاص)",
    hint: "منه الورق والخشب",
    difficulty: "hard"
  },
  {
    id: "desc_028",
    categoryId: "description_guess",
    question: "شيء موجود في السما وفي البحر وفي شارة الرتبة العسكرية، وليه خمس أطراف.. مين أنا؟",
    answer: "النجمة (نجم البحر / نجم السما)",
    hint: "بتلمع بالليل في السما",
    difficulty: "easy"
  },
  {
    id: "desc_029",
    categoryId: "description_guess",
    question: "حاجة بتلف حوالين الأوضة والبيت كله بس عمرها ما بتتحرك من مكانها.. مين أنا؟",
    answer: "الحيطة (الجدار)",
    hint: "بندهنها وبنعلق عليها براويز",
    difficulty: "medium"
  },
  {
    id: "desc_030",
    categoryId: "description_guess",
    question: "أنا مفتاح بس عمري ما بفتح قفل ولا باب خشب، لكن بفتح سيستم وعقول وعندي أرقام وحروف.. مين أنا؟",
    answer: "أزرار الكيبورد (لوحة المفاتيح)",
    hint: "بتكتب بيه على الكمبيوتر",
    difficulty: "medium"
  },
  {
    id: "desc_031",
    categoryId: "description_guess",
    question: "حيوان بطيء جداً، بيشيل بيته كله على ضهره، وممكن يعيش أكتر من 100 سنة.. مين أنا؟",
    answer: "السلحفاة",
    hint: "نافست الأرنب في السباق الشهير",
    difficulty: "easy"
  },
  {
    id: "desc_032",
    categoryId: "description_guess",
    question: "شيء في جيبك، مصنوع من ورق أو معدن، الناس بتجري وراه طول اليوم وبدونه متقدرش تشتري حاجة.. مين أنا؟",
    answer: "الفلوس (النقود / المال)",
    hint: "جنيهات ودولارات",
    difficulty: "easy"
  },
  {
    id: "desc_033",
    categoryId: "description_guess",
    question: "أنا طائر ليلي، عيني واسعة وكبيرة وبشوف في الضلمة، مشهور بالحكمة عند الغرب وبالنحس عند بعض العرب.. مين أنا؟",
    answer: "البومة",
    hint: "بتلف رقبتها 270 درجة",
    difficulty: "easy"
  },
  {
    id: "desc_034",
    categoryId: "description_guess",
    question: "أنا اختراع بيتحط على العين، فيا عدستين وشنابر، وبخليك تقرأ وتشوف اللي مش شايفه بوضوح.. مين أنا؟",
    answer: "النظارة",
    hint: "طبية أو شمسية",
    difficulty: "easy"
  },
  {
    id: "desc_035",
    categoryId: "description_guess",
    question: "حاجة بتنزل من عينك لما تفرح أوي أو لما تحزن وتبكي أوي.. مين أنا؟",
    answer: "الدمعة (الدموع)",
    hint: "مية مالحة بتنزل على الخد",
    difficulty: "easy"
  },
  {
    id: "desc_036",
    categoryId: "description_guess",
    question: "بمشي وبجري طول النهار والليل ومعنديش رجلين، وعندي عقربين بس عمري ما لدغت حد.. مين أنا؟",
    answer: "الساعة",
    hint: "في إيدك أو معلقة على الحيطة",
    difficulty: "easy"
  },
  {
    id: "desc_037",
    categoryId: "description_guess",
    question: "أنا كائن صغير جداً، بس لو قرصتك بتورمك وتسهرك الليل، وعندي زن في الودن يجنن.. مين أنا؟",
    answer: "الناموسة (البعوضة)",
    hint: "بتكتر في الصيف والحر",
    difficulty: "easy"
  },
  {
    id: "desc_038",
    categoryId: "description_guess",
    question: "أنا خضار أحمر مدور، بيتحط في السلطة ويضرب في الخلاط يعمل صلصة، وبقولوا عليا 'مجنونة'.. مين أنا؟",
    answer: "الطماطم (القوطة)",
    hint: "مجنونة يا قوطة",
    difficulty: "easy"
  },
  {
    id: "desc_039",
    categoryId: "description_guess",
    question: "أنا شيء لو غليتني بتجمد، ولو سبتني في الهوا بنشف، ولما تسلقني بتطلع مني قشرة بيضا وصفار.. مين أنا؟",
    answer: "البيض المسلوق",
    hint: "فطار المصريين الشهير",
    difficulty: "easy"
  },
  {
    id: "desc_040",
    categoryId: "description_guess",
    question: "أنا شيء كل ما تضربه يكبر ويطير في الهوا، ولو لمستني بدبوس بفرقع في ثانية.. مين أنا؟",
    answer: "البلونة",
    hint: "في أعياد الميلاد والسبوع",
    difficulty: "easy"
  },
  {
    id: "desc_041",
    categoryId: "description_guess",
    question: "شخصية فرعونية ملكية، قناعي دهب خالص، ومقبرتي اتلقت كاملة سنة 1922 وفيها كنوز الدنيا.. مين أنا؟",
    answer: "توت عنخ آمون",
    hint: "الفرعون الذهبي الشاب",
    difficulty: "easy"
  },
  {
    id: "desc_042",
    categoryId: "description_guess",
    question: "أنا مبنى عالي جداً في الجزيرة بالقاهرة، شبه زهرة اللوتس وبشوف منه مصر كلها.. مين أنا؟",
    answer: "برج القاهرة",
    hint: "بناه نعوم شبيب في الستينيات",
    difficulty: "easy"
  },
  {
    id: "desc_043",
    categoryId: "description_guess",
    question: "حاجة بتشربها أول ما تصحى من البقرة أو الجاموسة، بيضا ومفيدة للعضم والكالسيوم.. مين أنا؟",
    answer: "اللبن (الحليب)",
    hint: "بيتعمل منه جبنة وزبادي",
    difficulty: "easy"
  },
  {
    id: "desc_044",
    categoryId: "description_guess",
    question: "أنا عاصمة مصرية قديمة، فيها ثلث آثار العالم، ومعبد الكرنك وطريق الكباش ووادي الملوك.. مين أنا؟",
    answer: "مدينة الأقصر (طيبة القديمة)",
    hint: "محافظة في صعيد مصر",
    difficulty: "easy"
  },
  {
    id: "desc_045",
    categoryId: "description_guess",
    question: "أنا نبات أخضر صغير، ريحتي حلوة وبيحطوني في الشاي يظبط الدماغ.. مين أنا؟",
    answer: "النعناع",
    hint: "شاي بالنعناع",
    difficulty: "easy"
  },
  {
    id: "desc_046",
    categoryId: "description_guess",
    question: "أنا شيء لو اتكلمت كسرتني.. مين أنا؟",
    answer: "الصمت (السكوت)",
    hint: "الهدوء التام",
    difficulty: "medium"
  },
  {
    id: "desc_047",
    categoryId: "description_guess",
    question: "شخصية تاريخية مصرية، أسس بنك مصر وصنع نهضة اقتصادية واستقلال مالي لمصر.. مين أنا؟",
    answer: "طلعت حرب باشا",
    hint: "ميدانه وشارعه شهير في وسط البلد",
    difficulty: "medium"
  },
  {
    id: "desc_048",
    categoryId: "description_guess",
    question: "أنا شيء موجود في كل حارة مصرية، بلف وأدور وأشوي فراخ ولحمة وريحة الفحم طالعة مني.. مين أنا؟",
    answer: "الشواية (أو الكبابجي)",
    hint: "كباب وكفتة على الفحم",
    difficulty: "easy"
  },
  {
    id: "desc_049",
    categoryId: "description_guess",
    question: "حيوان قطبي ضخم، لونه أبيض فروه تقيل وبيصطاد سمك من تحت الجليد.. مين أنا؟",
    answer: "الدب القطبي",
    hint: "أكبر مفترس على اليابسة في الجليد",
    difficulty: "easy"
  },
  {
    id: "desc_050",
    categoryId: "description_guess",
    question: "أنا شيء بتفتحه لما الدنيا تمطر أو الشمس تحرق راسك، وبرفع ضل فوقك من القماش والحديد.. مين أنا؟",
    answer: "الشمسية (المظلة)",
    hint: "بتتفتح وتتقفل بزرار",
    difficulty: "easy"
  }
];

// 3. Prepare history questions (50 items)
const historyQuestions = [
  {
    id: "hist_001",
    categoryId: "history",
    question: "في أي عام ميلادي وقعت حرب أكتوبر المجيدة وعبور الجيش المصري لخط بارليف؟",
    answer: "1973 ميلادياً",
    hint: "في العاشر من رمضان",
    difficulty: "easy"
  },
  {
    id: "hist_002",
    categoryId: "history",
    question: "من هو القائد الإسلامي صلاح الدين الأيوبي الذي انتصر على الصليبيين وحرر القدس في معركة شهيرة؟ ما اسم المعركة؟",
    answer: "معركة حطين (عام 1187م)",
    hint: "وقعت في شهر يوليو بالقرب من طبريا",
    difficulty: "medium"
  },
  {
    id: "hist_003",
    categoryId: "history",
    question: "من هو الفرعون صاحب الهرم الأكبر في الجيزة؟",
    answer: "الملك خوفو",
    hint: "من ملوك الأسرة الرابعة",
    difficulty: "easy"
  },
  {
    id: "hist_004",
    categoryId: "history",
    question: "من هو أول رئيس لجمهورية مصر العربية بعد إلغاء الملكية عام 1953؟",
    answer: "محمد نجيب",
    hint: "تولى الرئاسة بعد حركة الضباط الأحرار",
    difficulty: "easy"
  },
  {
    id: "hist_005",
    categoryId: "history",
    question: "من هو القائد المملوكي الذي قاد الجيش المصري وهزم التتار والمغول في معركة عين جالوت عام 1260؟",
    answer: "سيف الدين قطز (مع رفيقه الظاهر بيبرس)",
    hint: "صاحب صرخة 'وا إسلاماه'",
    difficulty: "easy"
  },
  {
    id: "hist_006",
    categoryId: "history",
    question: "في أي عام تم افتتاح قناة السويس للمرة الأولى للملاحة الدولية في حفل أسطوري في عهد الخديوي إسماعيل؟",
    answer: "1869 ميلادياً",
    hint: "في النصف الثاني من القرن التاسع عشر",
    difficulty: "medium"
  },
  {
    id: "hist_007",
    categoryId: "history",
    question: "من هو مؤسس الدولة الطولونية في مصر وباني المسجد الشهير بمئذنته الملتوية في القاهرة؟",
    answer: "أحمد بن طولون",
    hint: "المسجد في حي السيدة زينب",
    difficulty: "easy"
  },
  {
    id: "hist_008",
    categoryId: "history",
    question: "من هي الملكة الفرعونية الشهيرة التي أرسلت بعثة تجارية إلى بلاد بونت ولها معبد عظيم بالدير البحري؟",
    answer: "الملكة حتشبسوت",
    hint: "حكمت مصر كرجل ولبست الذقن المستعارة",
    difficulty: "easy"
  },
  {
    id: "hist_009",
    categoryId: "history",
    question: "من هو الوالي الذي يُلقب بـ 'مؤسس مصر الحديثة' وحكم مصر من عام 1805 إلى 1848؟",
    answer: "محمد علي باشا",
    hint: "صاحب القلعة وجامع المرمر",
    difficulty: "easy"
  },
  {
    id: "hist_010",
    categoryId: "history",
    question: "في أي عام انتهت الحرب العالمية الثانية باستسلام ألمانيا واليابان؟",
    answer: "1945 ميلادياً",
    hint: "بعد إلقاء القنبلتين الذريتين",
    difficulty: "easy"
  },
  {
    id: "hist_011",
    categoryId: "history",
    question: "من هو عالم الآثار البريطاني الذي اكتشف مقبرة الملك توت عنخ آمون كاملة عام 1922؟",
    answer: "هوارد كارتر (Howard Carter)",
    hint: "كان ممولاً من اللورد كارنارفون",
    difficulty: "medium"
  },
  {
    id: "hist_012",
    categoryId: "history",
    question: "معركة بحرية شهيرة عام 31 قبل الميلاد هُزم فيها أنطونيوس وكليوباترا أمام أوكتافيوس.. ما اسمها؟",
    answer: "معركة أكتيوم البحرية (Actium)",
    hint: "أدت لدخول الرومان مصر وسقوط البطالمة",
    difficulty: "hard"
  },
  {
    id: "hist_013",
    categoryId: "history",
    question: "من هو الزعيم الهندي الذي قاد حركة استقلال الهند ضد الاستعمار البريطاني باستخدام المقاومة السلمية 'اللاعنف'؟",
    answer: "المهاتما غاندي (Mahatma Gandhi)",
    hint: "لقبه المهاتما يعني الروح العظيمة",
    difficulty: "easy"
  },
  {
    id: "hist_014",
    categoryId: "history",
    question: "من هو العالم الفرنسي الذي تمكن من فك رموز حجر رشيد وقراءة اللغة الهيروغليفية القديمة؟",
    answer: "جان فرانسوا شامبليون (Champollion)",
    hint: "عالم فرنسي فك الرموز عام 1822",
    difficulty: "medium"
  },
  {
    id: "hist_015",
    categoryId: "history",
    question: "من هو الرئيس الأمريكي الذي ألغى الرق والعبودية في أمريكا وقاد الاتحاد في الحرب الأهلية؟",
    answer: "أبراهام لينكولن (Abraham Lincoln)",
    hint: "صاحب تمثال النصب التذكاري في واشنطن واللحية الشهيرة",
    difficulty: "easy"
  },
  {
    id: "hist_016",
    categoryId: "history",
    question: "في أي سنة ميلادية فتح المسلمون بقيادة عمرو بن العاص مصر في عهد الخليفة عمر بن الخطاب؟",
    answer: "641 ميلادياً (20 هجرياً)",
    hint: "في القرن السابع الميلادي",
    difficulty: "medium"
  },
  {
    id: "hist_017",
    categoryId: "history",
    question: "من هو القائد القرطاجي الشهير الذي عبر جبال الألب بالأفيال لمحاربة الإمبراطورية الرومانية؟",
    answer: "حنبعل (هانيبال باركا)",
    hint: "قائد عسكري عبقري من تونس القديمة (قرطاج)",
    difficulty: "medium"
  },
  {
    id: "hist_018",
    categoryId: "history",
    question: "من هو الزعيم المصري الذي قاد ثورة 1919 ونُفي إلى جزيرة مالطا ثم جزيرة سيشل؟",
    answer: "سعد زغلول",
    hint: "زوجته صفية زغلول أم المصريين",
    difficulty: "easy"
  },
  {
    id: "hist_019",
    categoryId: "history",
    question: "ما هي الحضارة القديمة التي بنت مدينة 'ماتشو بيتشو' المعلقة بين الجبال في بيرو؟",
    answer: "حضارة الإنكا (Inca)",
    hint: "حضارة أمريكا الجنوبية القديمة",
    difficulty: "medium"
  },
  {
    id: "hist_020",
    categoryId: "history",
    question: "من هو الملك الفرعوني صاحب أطول فترة حكم في تاريخ مصر القديمة وبطل معركة قادش؟",
    answer: "رمسيس الثاني (رمسيس الأكبر)",
    hint: "صاحب معبد أبو سمبل وتمثاله الشهير",
    difficulty: "easy"
  },
  {
    id: "hist_021",
    categoryId: "history",
    question: "في أي عام سقط جدار برلين الذي كان يفصل بين ألمانيا الشرقية والغربية؟",
    answer: "1989 ميلادياً",
    hint: "قبل عامين من تفكك الاتحاد السوفيتي",
    difficulty: "medium"
  },
  {
    id: "hist_022",
    categoryId: "history",
    question: "ما اسم المعاهدة التاريخية للسلام التي وقعتها مصر وإسرائيل عام 1979 في واشنطن؟",
    answer: "معاهدة كامب ديفيد (معاهدة السلام المصرية الإسرائيلية)",
    hint: "وقعها الرئيس محمد أنور السادات ومناحم بيجن",
    difficulty: "easy"
  },
  {
    id: "hist_023",
    categoryId: "history",
    question: "من هو الخليفة العباسي الشهير الذي ارتبط اسمه بالعصر الذهبي للعلوم وقصص ألف ليلة وليلة؟",
    answer: "هارون الرشيد",
    hint: "والد الأمين والمأمون",
    difficulty: "easy"
  },
  {
    id: "hist_024",
    categoryId: "history",
    question: "من هو الرحالة الإيطالي الذي وصل إلى الأمريكتين عام 1492 ظناً منه أنه وصل إلى الهند؟",
    answer: "كريستوفر كولومبوس (Christopher Columbus)",
    hint: "رحلته مولها ملك وملكة إسبانيا",
    difficulty: "easy"
  },
  {
    id: "hist_025",
    categoryId: "history",
    question: "من هي الدولة الأوروبية التي شنت غزو الأرمادا الإسبانية الشهير عام 1588؟",
    answer: "إسبانيا (ضد إنجلترا)",
    hint: "كانت القوة البحرية العظمى وقتها",
    difficulty: "hard"
  },
  {
    id: "hist_026",
    categoryId: "history",
    question: "من هو الضابط والزعيم المصري قائد الثورة العرابية عام 1881 وصاحب جملة 'لقد ولدتنا أمهاتنا أحراراً'؟",
    answer: "أحمد عرابي",
    hint: "وقف أمام الخديوي توفيق في ساحة عابدين",
    difficulty: "easy"
  },
  {
    id: "hist_027",
    categoryId: "history",
    question: "ما هي المدينة الإيطالية القديمة التي دفنت بالكامل تحت رماد بركان فيزوف عام 79 ميلادياً؟",
    answer: "مدينة بومبي (Pompeii)",
    hint: "حفظت منازلها وجثثها بالرماد البركاني",
    difficulty: "medium"
  },
  {
    id: "hist_028",
    categoryId: "history",
    question: "من هو القائد المسلم الذي فتح الأندلس عام 711 ميلادياً وسُمي المضيق باسمه؟",
    answer: "طارق بن زياد",
    hint: "مضيق جبل طارق",
    difficulty: "easy"
  },
  {
    id: "hist_029",
    categoryId: "history",
    question: "في أي عام قامت الثورة الفرنسية وسقوط سجن الباستيل الشهير؟",
    answer: "1789 ميلادياً",
    hint: "أواخر القرن الثامن عشر بشعار حرية إخاء مساواة",
    difficulty: "medium"
  },
  {
    id: "hist_030",
    categoryId: "history",
    question: "من هو الإمبراطور الفرنسي العسكري القصير القامة الذي احتل معظم أوروبا ونُفي لجزيرة سانت هيلانة؟",
    answer: "نابليون بونابرت",
    hint: "قاد الحملة الفرنسية على مصر عام 1798",
    difficulty: "easy"
  },
  {
    id: "hist_031",
    categoryId: "history",
    question: "من هو الفيلسوف اليوناني القديم أستاذ الإسكندر الأكبر وتلميذ أفلاطون؟",
    answer: "أرسطو (Aristotle)",
    hint: "يُلقب بالمعلم الأول",
    difficulty: "medium"
  },
  {
    id: "hist_032",
    categoryId: "history",
    question: "في أي عام وقع حادث غرق السفينة العملاقة 'تيتانيك' بعد اصطدامها بجبل جليدي؟",
    answer: "1912 ميلادياً",
    hint: "في شهر أبريل في رحلتها الأولى من إنجلترا لأمريكا",
    difficulty: "easy"
  },
  {
    id: "hist_033",
    categoryId: "history",
    question: "من هو القائد المغولي السفاح الذي أسس إمبراطورية المغول واحتل مساحات شاسعة من آسيا؟",
    answer: "جنكيز خان (Genghis Khan)",
    hint: "جده هولاكو الذي دمر بغداد",
    difficulty: "easy"
  },
  {
    id: "hist_034",
    categoryId: "history",
    question: "من هو آخر ملوك مصر الفعليين قبل إعلان الجمهورية والذي غادر على متن يخت المحروسة؟",
    answer: "الملك فاروق الأول",
    hint: "تنازل عن العرش لابنه الرضيع أحمد فؤاد الثاني",
    difficulty: "easy"
  },
  {
    id: "hist_035",
    categoryId: "history",
    question: "ما هي المعركة التاريخية الفاصلة التي هُزم فيها نابليون بونابرت نهائياً عام 1815 في بلجيكا؟",
    answer: "معركة واترلو (Waterloo)",
    hint: "أمام الجيش البريطاني والبروسي",
    difficulty: "medium"
  },
  {
    id: "hist_036",
    categoryId: "history",
    question: "من هو أول رائد فضاء في تاريخ البشرية صعد إلى الفضاء الخارجي عام 1961؟",
    answer: "يوري جاجارين (رائد فضاء سوفيتي)",
    hint: "من الاتحاد السوفيتي على متن مركبة فوستوك 1",
    difficulty: "medium"
  },
  {
    id: "hist_037",
    categoryId: "history",
    question: "من هو الخليفة الراشد الذي تم في عهده جمع القرآن الكريم في مصحف موحد نُسخ منه للمدن الإسلامية؟",
    answer: "عثمان بن عفان رضي الله عنه",
    hint: "يُعرف بالمصحف العثماني وذو النورين",
    difficulty: "easy"
  },
  {
    id: "hist_038",
    categoryId: "history",
    question: "ما اسم الإمبراطورية الرومانية الشرقية التي كانت عاصمتها القسطنطينية حتى فتحها محمد الفاتح عام 1453؟",
    answer: "الإمبراطورية البيزنطية",
    hint: "دامت أكثر من ألف عام بعد سقوط روما",
    difficulty: "medium"
  },
  {
    id: "hist_039",
    categoryId: "history",
    question: "من هو الرئيس المصري الراحل الذي أمم قناة السويس عام 1956 وبنى السد العالي؟",
    answer: "جمال عبد الناصر",
    hint: "زعيم ثورة 23 يوليو وأحد أشهر قادة التحرر الوطني",
    difficulty: "easy"
  },
  {
    id: "hist_040",
    categoryId: "history",
    question: "ما هي أقدم ملحمة شعرية وبطولية مكتوبة عرفها التاريخ البشري في بلاد الرافدين؟",
    answer: "ملحمة جلجامش (Gilgamesh)",
    hint: "بطلها كان يبحث عن سر الخلود",
    difficulty: "hard"
  },
  {
    id: "hist_041",
    categoryId: "history",
    question: "من هو السلطان العثماني الذي لقب بـ 'الفاتح' بعد أن فتح مدينة القسطنطينية وعمره 21 سنة فقط؟",
    answer: "السلطان محمد الفاتح",
    hint: "حول كنيسة آيا صوفيا إلى مسجد",
    difficulty: "easy"
  },
  {
    id: "hist_042",
    categoryId: "history",
    question: "في أي عام تم تفجير برجي التجارة العالمي في نيويورك في أحداث 11 سبتمبر؟",
    answer: "2001 ميلادياً",
    hint: "في مطلع الألفية الحالية",
    difficulty: "easy"
  },
  {
    id: "hist_043",
    categoryId: "history",
    question: "من هو الإمبراطور الروماني الذي اشتهر بإشعال حريق روما الكبير وكان يعزف القيثارة أثناء الحريق؟",
    answer: "الإمبراطور نيرون (Nero)",
    hint: "من أشهر طغاة روما القديمة",
    difficulty: "medium"
  },
  {
    id: "hist_044",
    categoryId: "history",
    question: "من هو باني تمثال أبو الهول وجامع الأهرامات صاحب الهرم الثاني في الجيزة؟",
    answer: "الملك خفرع",
    hint: "ابن الملك خوفو",
    difficulty: "easy"
  },
  {
    id: "hist_045",
    categoryId: "history",
    question: "في أي سنة ميلادية تفكك الاتحاد السوفيتي رسمياً ونهاية الحرب الباردة؟",
    answer: "1991 ميلادياً",
    hint: "في عهد ميخائيل جورباتشوف",
    difficulty: "medium"
  },
  {
    id: "hist_046",
    categoryId: "history",
    question: "من هو الطبيب والعالم المسلم الملقب بـ 'الشيخ الرئيس' ومؤلف كتاب 'القانون في الطب'؟",
    answer: "ابن سينا (Avicenna)",
    hint: "عالم وطبيب وفيلسوف فارسي المولد مسلم",
    difficulty: "medium"
  },
  {
    id: "hist_047",
    categoryId: "history",
    question: "ما اسم المعاهدة التاريخية التي أنهت الحرب العالمية الأولى عام 1919 في فرنسا؟",
    answer: "معاهدة فرساي (Treaty of Versailles)",
    hint: "وقعت في قصر فرساي الشهير بباريس",
    difficulty: "medium"
  },
  {
    id: "hist_048",
    categoryId: "history",
    question: "من هو الزعيم الجنوب أفريقي المناضل ضد نظام الفصل العنصري (الأبارتايد) وقضى 27 سنة في السجن؟",
    answer: "نيلسون مانديلا (Nelson Mandela)",
    hint: "أصبح أول رئيس أسود لجنوب أفريقيا",
    difficulty: "easy"
  },
  {
    id: "hist_049",
    categoryId: "history",
    question: "من هو القائد الصليبي ملك إنجلترا الشهير الذي حارب صلاح الدين وعُرف بشجاعته الفائقة؟",
    answer: "ريتشارد قلب الأسد (Richard the Lionheart)",
    hint: "ملك إنجلترا وقائد الحملة الصليبية الثالثة",
    difficulty: "easy"
  },
  {
    id: "hist_050",
    categoryId: "history",
    question: "ما هي أول عاصمة إسلامية لمصر بناها عمرو بن العاص عام 641م؟",
    answer: "مدينة الفسطاط",
    hint: "بنى فيها أول جامع في مصر وإفريقيا",
    difficulty: "easy"
  }
];

// 4. Prepare geography questions (50 items)
const geoQuestions = [
  {
    id: "geo_001",
    categoryId: "geography",
    question: "ما هي عاصمة أستراليا الفيدرالية؟ (كتير بيتلخبطوا ويقولوا سيدني!)",
    answer: "كانبيرا (Canberra)",
    hint: "مدينة صُممت خصيصاً لتكون العاصمة بين سيدني وملبورن",
    difficulty: "easy"
  },
  {
    id: "geo_002",
    categoryId: "geography",
    question: "ما هي عاصمة المغرب الرسمية؟ (كتير بيفتكروها كازابلانكا!)",
    answer: "الرباط",
    hint: "مدينة على المحيط الأطلسي وفيها برج حسان",
    difficulty: "easy"
  },
  {
    id: "geo_003",
    categoryId: "geography",
    question: "ما هي عاصمة كندا؟ (كتير بيقولوا تورونتو أو مونتريال!)",
    answer: "أوتاوا (Ottawa)",
    hint: "مدينة تقع في مقاطعة أونتاريو على حدود كيبك",
    difficulty: "medium"
  },
  {
    id: "geo_004",
    categoryId: "geography",
    question: "ما هو أطول نهر في العالم من حيث الطول؟",
    answer: "نهر النيل (في قارة أفريقيا)",
    hint: "يمر بـ 11 دولة أفريقية وينتهي في البحر المتوسط بمصر",
    difficulty: "easy"
  },
  {
    id: "geo_005",
    categoryId: "geography",
    question: "ما هي أعلى قمة جبلية على سطح الكرة الأرضية؟",
    answer: "قمة إيفرست (في سلسلة جبال الهيمالايا)",
    hint: "ارتفاعها حوالي 8848 متراً بين نيبال والصين",
    difficulty: "easy"
  },
  {
    id: "geo_006",
    categoryId: "geography",
    question: "ما هو أكبر محيط على وجه الأرض من حيث المساحة والعمق؟",
    answer: "المحيط الهادئ (Pacific Ocean)",
    hint: "يغطي أكثر من ثلث مساحة الكرة الأرضية",
    difficulty: "easy"
  },
  {
    id: "geo_007",
    categoryId: "geography",
    question: "ما هي أصغر دولة في العالم من حيث المساحة وعدد السكان وتقع داخل مدينة روما؟",
    answer: "دولة الفاتيكان (Vatican City)",
    hint: "مقر البابا والكنيسة الكاثوليكية",
    difficulty: "easy"
  },
  {
    id: "geo_008",
    categoryId: "geography",
    question: "ما هي أكبر دولة في العالم من حيث المساحة الجغرافية الإجمالية؟",
    answer: "روسيا (الاتحاد الروسي)",
    hint: "تمتد عبر قارتي أوروبا وآسيا وتغطي 11 منطقة زمنية",
    difficulty: "easy"
  },
  {
    id: "geo_009",
    categoryId: "geography",
    question: "ما هي عاصمة البرازيل؟ (كتير بيفتكروها ريو دي جانيرو أو ساو باولو!)",
    answer: "برازيليا (Brasilia)",
    hint: "مدينة مصممة على شكل طائرة في قلب البرازيل",
    difficulty: "medium"
  },
  {
    id: "geo_010",
    categoryId: "geography",
    question: "دولة عربية إسلامية تقع بالكامل في المحيط الهندي وتتكون من 4 جزر بركانية رئيسية.. ما هي؟",
    answer: "جزر القمر (عاصمتها موروني)",
    hint: "عضو في جامعة الدول العربية وعلمها فيه أربعة نجوم وهلال",
    difficulty: "medium"
  },
  {
    id: "geo_011",
    categoryId: "geography",
    question: "ما هو المضيق المائي الشهير الذي يفصل بين قارة أفريقيا وقارة أوروبا ويربط البحر المتوسط بالمحيط الأطلسي؟",
    answer: "مضيق جبل طارق",
    hint: "بين المغرب وإسبانيا",
    difficulty: "easy"
  },
  {
    id: "geo_012",
    categoryId: "geography",
    question: "ما هي عاصمة تركيا السياسية الرسمية؟ (كتير بيقولوا إسطنبول!)",
    answer: "أنقرة (Ankara)",
    hint: "أصبحت العاصمة في عهد كمال أتاتورك",
    difficulty: "easy"
  },
  {
    id: "geo_013",
    categoryId: "geography",
    question: "ما هي أخفض نقطة يابسة على سطح الكرة الأرضية تحت مستوى سطح البحر؟",
    answer: "شاطئ البحر الميت (بين الأردن وفلسطين)",
    hint: "مياهه شديدة الملوحة والناس بتطفو فوقه",
    difficulty: "easy"
  },
  {
    id: "geo_014",
    categoryId: "geography",
    question: "ما هي أكبر جزيرة في العالم من حيث المساحة (وليست قارة) وتتبع دولة الدنمارك؟",
    answer: "جرينلاند (Greenland)",
    hint: "مغطاة بالجليد بالكامل في القطب الشمالي",
    difficulty: "medium"
  },
  {
    id: "geo_015",
    categoryId: "geography",
    question: "ما هي الدولة الوحيدة في العالم التي تُعد دولة وقارة كاملة في نفس الوقت؟",
    answer: "أستراليا",
    hint: "مشهورة بحيوان الكنغر والكوالا",
    difficulty: "easy"
  },
  {
    id: "geo_016",
    categoryId: "geography",
    question: "ما هي عاصمة الولايات المتحدة الأمريكية؟ (كتير بيتلخبطوا ويقولوا نيويورك!)",
    answer: "واشنطن العاصمة (Washington D.C.)",
    hint: "فيها البيت الأبيض ومبنى الكابيتول",
    difficulty: "easy"
  },
  {
    id: "geo_017",
    categoryId: "geography",
    question: "نهر شهير في أوروبا يمر بـ 10 دول أوروبية و4 عواصم ويسمى بنهر العواصم.. ما هو؟",
    answer: "نهر الدانوب (Danube River)",
    hint: "يمر بفيينا وبراتيسلافا وبودابست وبلجراد",
    difficulty: "medium"
  },
  {
    id: "geo_018",
    categoryId: "geography",
    question: "ما هي عاصمة سويسرا الفعلية الفيدرالية؟ (كتير بيقولوا جنيف أو زيورخ!)",
    answer: "مدينة برن (Bern)",
    hint: "مدينة سويسرية عريقة تشتهر ببرج الساعة والدببة",
    difficulty: "hard"
  },
  {
    id: "geo_019",
    categoryId: "geography",
    question: "سلسلة جبلية شهيرة تفصل قارة أوروبا عن قارة آسيا في روسيا.. ما اسمها؟",
    answer: "جبال الأورال (Ural Mountains)",
    hint: "الحد الفاصل الجغرافي بين روسيا الأوروبية وروسيا الآسيوية",
    difficulty: "medium"
  },
  {
    id: "geo_020",
    categoryId: "geography",
    question: "ما هي عاصمة اليابان الصاخبة والتي تعتبر من أكبر مدن العالم من حيث التعداد السكاني؟",
    answer: "طوكيو (Tokyo)",
    hint: "كانت تسمى قديماً إيدو",
    difficulty: "easy"
  },
  {
    id: "geo_021",
    categoryId: "geography",
    question: "ما هي أكبر صحراء حارة في العالم وتغطي شمال قارة أفريقيا؟",
    answer: "الصحراء الكبرى الأفريقية",
    hint: "تمتد في مصر وليبيا والجزائر والمغرب والسودان وتونس",
    difficulty: "easy"
  },
  {
    id: "geo_022",
    categoryId: "geography",
    question: "دولة أفريقية عربية يمر بها خط الاستواء وتقع في شرق أفريقيا وعاصمتها مقديشو.. ما هي؟",
    answer: "الصومال",
    hint: "صاحبة أطول ساحل بحري في قارة أفريقيا",
    difficulty: "easy"
  },
  {
    id: "geo_023",
    categoryId: "geography",
    question: "ما هي عاصمة دولة الإمارات العربية المتحدة؟ (كتير بيقولوا دبي!)",
    answer: "أبوظبي",
    hint: "أكبر إمارة من حيث المساحة ومقر رئيس الدولة",
    difficulty: "easy"
  },
  {
    id: "geo_024",
    categoryId: "geography",
    question: "ما هي أطول سلسلة جبال قارية في العالم وتمتد على طول الساحل الغربي لأمريكا الجنوبية؟",
    answer: "سلسلة جبال الأنديز (Andes)",
    hint: "تمر بسبع دول من بينها الأرجنتين وتشيلي وبيرو",
    difficulty: "medium"
  },
  {
    id: "geo_025",
    categoryId: "geography",
    question: "ما هي القناة المائية التي تفصل بين أمريكا الشمالية وأمريكا الجنوبية وتربط المحيط الأطلسي بالمحيط الهادئ؟",
    answer: "قناة بنما (Panama Canal)",
    hint: "تقع في دولة بنما وافتتحت عام 1914",
    difficulty: "easy"
  },
  {
    id: "geo_026",
    categoryId: "geography",
    question: "دولة أوروبية تشتهر بطواحين الهواء وزهور التوليب ونصف أراضيها تحت مستوى سطح البحر.. ما هي؟",
    answer: "هولندا (الأراضي المنخفضة - Netherlands)",
    hint: "عاصمتها أمستردام",
    difficulty: "easy"
  },
  {
    id: "geo_027",
    categoryId: "geography",
    question: "ما هي عاصمة نيوزيلندا؟ (كتير بيقولوا أوكلاند!)",
    answer: "ويلينغتون (Wellington)",
    hint: "أقصى عاصمة جنوبية في العالم",
    difficulty: "hard"
  },
  {
    id: "geo_028",
    categoryId: "geography",
    question: "ما هي الدولة الأكثر سكاناً في العالم حالياً بعد تجاوزها للصين عام 2023؟",
    answer: "الهند",
    hint: "عاصمتها نيودلهي",
    difficulty: "easy"
  },
  {
    id: "geo_029",
    categoryId: "geography",
    question: "ما هي عاصمة دولة كينيا ومقر برنامج الأمم المتحدة للبيئة؟",
    answer: "نيروبي (Nairobi)",
    hint: "مدينة مشهورة بحديقة السفاري الوطنية بجوار ناطحات السحاب",
    difficulty: "medium"
  },
  {
    id: "geo_030",
    categoryId: "geography",
    question: "ما هي عاصمة جنوب أفريقيا التشريعية؟ (جنوب أفريقيا لها 3 عواصم!)",
    answer: "كيب تاون (Cape Town)",
    hint: "المدينة الشهيرة بجبل الطاولة ورأس الرجاء الصالح",
    difficulty: "medium"
  },
  {
    id: "geo_031",
    categoryId: "geography",
    question: "مضيق بحري استراتيجي يربط الخليج العربي ببحر عُمان والمحيط الهندي وتمر منه ناقلات النفط.. ما هو؟",
    answer: "مضيق هرمز",
    hint: "بين سلطنة عُمان وإيران والإمارات",
    difficulty: "easy"
  },
  {
    id: "geo_032",
    categoryId: "geography",
    question: "ما هي الدولة التي يطلق عليها 'أرض الشمس المشرقة'؟",
    answer: "اليابان",
    hint: "علمها فيه دائرة حمراء تمثل قرص الشمس",
    difficulty: "easy"
  },
  {
    id: "geo_033",
    categoryId: "geography",
    question: "ما هي عاصمة الأرجنتين وعاصمة رقصة التانغو الشهيرة ومسقط رأس مارادونا وميسي؟",
    answer: "بوينس آيرس (Buenos Aires)",
    hint: "تعني باللغة الإسبانية 'الهواء العليل'",
    difficulty: "easy"
  },
  {
    id: "geo_034",
    categoryId: "geography",
    question: "ما هي أكبر بحيرة مغلقة في العالم وتُسمى بحراً لضخامتها وملوحتها؟",
    answer: "بحر قزوين (Caspian Sea)",
    hint: "تحيط به روسيا وكازاخستان وتركمانستان وإيران وأذربيجان",
    difficulty: "medium"
  },
  {
    id: "geo_035",
    categoryId: "geography",
    question: "ما هي عاصمة دولة البرتغال الواقعة على المحيط الأطلسي؟",
    answer: "لشبونة (Lisbon)",
    hint: "بلد كريستيانو رونالدو وعاصمتها الساحلية",
    difficulty: "easy"
  },
  {
    id: "geo_036",
    categoryId: "geography",
    question: "أعمق خندق وبقعة مائية تحت المحيط في العالم يصل عمقها إلى 11 ألف متر تقريباً.. ما اسمها؟",
    answer: "خندق ماريانا (Mariana Trench)",
    hint: "يقع في غرب المحيط الهادئ بالقرب من جزر الفلبين واليابان",
    difficulty: "hard"
  },
  {
    id: "geo_037",
    categoryId: "geography",
    question: "ما هي عاصمة النرويج وتُلقب بمدينة الفايكنج؟",
    answer: "أوسلو (Oslo)",
    hint: "فيها يُمنح جائزة نوبل للسلام سنوياً",
    difficulty: "medium"
  },
  {
    id: "geo_038",
    categoryId: "geography",
    question: "ما هي الدولة العربية الوحيدة التي تقع أراضيها بالكامل داخل قارة أوروبا أو على أطرافها الجنوبية في البحر المتوسط وتتحدث لغة أصلها عربي؟",
    answer: "جمهورية مالطا (Malta)",
    hint: "جزيرة صغيرة جنوب صقلية عاصمتها فاليتا",
    difficulty: "hard"
  },
  {
    id: "geo_039",
    categoryId: "geography",
    question: "ما هو النهر الأكثر تدفقاً للمياه في العالم ويحتوي على أكبر حوض غابات مطيرة؟",
    answer: "نهر الأمازون (في أمريكا الجنوبية)",
    hint: "يمر في البرازيل والبيرو وكولومبيا",
    difficulty: "easy"
  },
  {
    id: "geo_040",
    categoryId: "geography",
    question: "ما هي عاصمة دولة كوريا الجنوبية ومركز التكنولوجيا وموسيقى الكيبوب؟",
    answer: "سول (Seoul)",
    hint: "يمر بها نهر الهان وتضم مقرات سامسونج وهيونداي",
    difficulty: "easy"
  },
  {
    id: "geo_041",
    categoryId: "geography",
    question: "مدينة إيطالية فريدة من نوعها مبنية بالكامل فوق 118 جزيرة داخل بحيرة شاطئية والتنقل فيها بالجندول والزوارق.. ما هي؟",
    answer: "مدينة البندقية (فينيسيا - Venice)",
    hint: "مدينة القنوات المائية الشهيرة",
    difficulty: "easy"
  },
  {
    id: "geo_042",
    categoryId: "geography",
    question: "ما هي عاصمة المملكة العربية السعودية؟",
    answer: "الرياض",
    hint: "فيها برج المملكة وبوليفارد رياض سيتي",
    difficulty: "easy"
  },
  {
    id: "geo_043",
    categoryId: "geography",
    question: "ما هي عاصمة دولة روسيا التي يقع فيها الميدان الأحمر وقصر الكرملين؟",
    answer: "موسكو (Moscow)",
    hint: "فيها كاتدرائية سانت باسيل الملونة بأبراج البصل",
    difficulty: "easy"
  },
  {
    id: "geo_044",
    categoryId: "geography",
    question: "دولة أوروبية تشبه في خريطتها الجغرافية شكل الحذاء الطويل أو 'البوت'.. ما هي؟",
    answer: "إيطاليا",
    hint: "عاصمتها روما وفي جنوبها جزيرة صقلية",
    difficulty: "easy"
  },
  {
    id: "geo_045",
    categoryId: "geography",
    question: "ما هو المضيق الذي يربط البحر الأحمر بخليج عدن وبحر العرب ويقع في جنوبه باب المندب؟ ما اسمه؟",
    answer: "مضيق باب المندب",
    hint: "بين اليمن وجيبوتي وإريتريا",
    difficulty: "easy"
  },
  {
    id: "geo_046",
    categoryId: "geography",
    question: "ما هي عاصمة اليونان التاريخية ومهد الفلسفة والديمقراطية وفيها معبد البارثينون؟",
    answer: "أثينا (Athens)",
    hint: "أقيمت فيها أول ألعاب أولمبية حديثة عام 1896",
    difficulty: "easy"
  },
  {
    id: "geo_047",
    categoryId: "geography",
    question: "ما هي الدولة التي تمتلك أكبر عدد من الجزر في العالم وتزيد عن 260 ألف جزيرة؟",
    answer: "السويد (Sweden)",
    hint: "دولة اسكندنافية عاصمتها ستوكهولم",
    difficulty: "hard"
  },
  {
    id: "geo_048",
    categoryId: "geography",
    question: "شلالات عملاقة تقع على الحدود بين الولايات المتحدة وكندا وتعتبر من أشهر المعالم السياحية.. ما اسمها؟",
    answer: "شلالات نياجرا (Niagara Falls)",
    hint: "تقع بين ولاية نيويورك ومقاطعة أونتاريو",
    difficulty: "easy"
  },
  {
    id: "geo_049",
    categoryId: "geography",
    question: "ما هي عاصمة العراق التاريخية التي تقع على ضفاف نهر دجلة؟",
    answer: "بغداد",
    hint: "دار السلام وبناها أبو جعفر المنصور",
    difficulty: "easy"
  },
  {
    id: "geo_050",
    categoryId: "geography",
    question: "ما هي الدولة الأوروبية المحايدة الشهيرة التي تقع في قلب جبال الألب وعاصمتها برن وتشتهر بالشوكولاتة والساعات؟",
    answer: "سويسرا",
    hint: "علمها مربع لونه أحمر بوسطه صليب أبيض",
    difficulty: "easy"
  }
];

// 5. Prepare additional General Knowledge questions (30 items)
const additionalGeneralQuestions = [
  {
    id: "gen_061",
    categoryId: "general",
    question: "ما هو أسرع كائن حي على وجه الأرض عند الانقضاض في الهواء؟",
    answer: "صقر الشاهين (Peregrine Falcon)",
    hint: "تصل سرعة انقضاضه لأكثر من 380 كم/ساعة",
    difficulty: "medium"
  },
  {
    id: "gen_062",
    categoryId: "general",
    question: "كم عدد القلوب لدى الأخطبوط؟",
    answer: "3 قلوب (ولون دمه أزرق!)",
    hint: "قلب للجسم وقلبين للخياشيم",
    difficulty: "medium"
  },
  {
    id: "gen_063",
    categoryId: "general",
    question: "ما هو المعدن الوحيد الذي يكون في حالة سائلة في درجة حرارة الغرفة العادية؟",
    answer: "الزئبق (Mercury)",
    hint: "كان يُستخدم في مقياس الحرارة (الترمومتر)",
    difficulty: "easy"
  },
  {
    id: "gen_064",
    categoryId: "general",
    question: "ما هو العضو الوحيد في جسم الإنسان القادر على تجديد خلاياه وإعادة النمو إذا تم استئصال جزء منه؟",
    answer: "الكبد (Liver)",
    hint: "المسؤول عن تنقية السموم من الدم",
    difficulty: "medium"
  },
  {
    id: "gen_065",
    categoryId: "general",
    question: "ما هو الغاز الأكثر وفرة ونسبة في الغلاف الجوي للأرض بنسبة حوالي 78%؟",
    answer: "غاز النيتروجين (Nitrogen)",
    hint: "وليس الأكسجين الذي تبلغ نسبته 21% فقط",
    difficulty: "easy"
  },
  {
    id: "gen_066",
    categoryId: "general",
    question: "ما هي أصلب مادة طبيعية معروفة على كوكب الأرض ولا تُخدش إلا بمثلها؟",
    answer: "الألماس (Diamond)",
    hint: "مكون من ذرات الكربون النقي تحت ضغط وحرارة عالية",
    difficulty: "easy"
  },
  {
    id: "gen_067",
    categoryId: "general",
    question: "كم عدد عظام جسم الإنسان البالغ السليم؟",
    answer: "206 عظمة",
    hint: "الأطفال يولدون بنحو 300 عظمة تلتحم مع النمو",
    difficulty: "easy"
  },
  {
    id: "gen_068",
    categoryId: "general",
    question: "ما هو الكوكب الأقرب إلى الشمس في مجموعتنا الشمسية؟",
    answer: "كوكب عطارد (Mercury)",
    hint: "أصغر كواكب المجموعة الشمسية ويدور حولها في 88 يوماً",
    difficulty: "easy"
  },
  {
    id: "gen_069",
    categoryId: "general",
    question: "ما هو الحيوان الذي يستطيع النوم وهو واقف على قدميه؟",
    answer: "الحصان (والفيل أيضاً)",
    hint: "يمتلك جهاز تثبيت عضلي في أرجله",
    difficulty: "easy"
  },
  {
    id: "gen_070",
    categoryId: "general",
    question: "من هو مخترع المصباح الكهربائي العملي ومسجل أكثر من ألف براءة اختراع؟",
    answer: "توماس إديسون (Thomas Edison)",
    hint: "مخترع أمريكي أضاء العالم",
    difficulty: "easy"
  },
  {
    id: "gen_071",
    categoryId: "general",
    question: "ما هي فصيلة الدم التي تُلقب بـ 'المعطي العام' لجميع الفصائل؟",
    answer: "فصيلة O سالب (O negative)",
    hint: "حرف واحد بدون موجب",
    difficulty: "medium"
  },
  {
    id: "gen_072",
    categoryId: "general",
    question: "ما هو أكبر حيوان ثديي عاش ويعيش على كوكب الأرض حتى اليوم؟",
    answer: "الحوت الأزرق (Blue Whale)",
    hint: "يصل طوله لأكثر من 30 متراً ووزنه 180 طناً ولسانه بوزن فيل",
    difficulty: "easy"
  },
  {
    id: "gen_073",
    categoryId: "general",
    question: "ما هو أسرع حيوان بري على اليابسة وتصل سرعته لأكثر من 100 كم/ساعة؟",
    answer: "الفهد الصياد (الشيتا - Cheetah)",
    hint: "قط بري سريع جداً في مطاردة الفرائس",
    difficulty: "easy"
  },
  {
    id: "gen_074",
    categoryId: "general",
    question: "ما هو علم دراسة الحشرات وتصنيفها باللغة العلمية؟",
    answer: "علم الحشرات (Entomology)",
    hint: "فرع من فروع علم الأحياء والحيوان",
    difficulty: "hard"
  },
  {
    id: "gen_075",
    categoryId: "general",
    question: "كم عدد ألوان قوس قزح الأساسية؟",
    answer: "7 ألوان",
    hint: "أحمر برتقالي أصفر أخضر أزرق نيلي بنفسجي",
    difficulty: "easy"
  },
  {
    id: "gen_076",
    categoryId: "general",
    question: "ما هو أطول عظم في جسم الإنسان ويتحمل وزن الجسم؟",
    answer: "عظمة الفخذ (Femur)",
    hint: "في الساق بين الحوض والركبة",
    difficulty: "easy"
  },
  {
    id: "gen_077",
    categoryId: "general",
    question: "ما هو الفيتامين الذي يصنعه الجسم تلقائياً عند التعرض لأشعة الشمس المباشرة؟",
    answer: "فيتامين د (Vitamin D)",
    hint: "ضروري جداً لامتصاص الكالسيوم وصحة العظام",
    difficulty: "easy"
  },
  {
    id: "gen_078",
    categoryId: "general",
    question: "ما هو الكوكب الملقب بـ 'الكوكب الأحمر' بسبب انتشار أكسيد الحديد على سطحه؟",
    answer: "كوكب المريخ (Mars)",
    hint: "رابع الكواكب بعداً عن الشمس وتستكشفه مركبات ناسا",
    difficulty: "easy"
  },
  {
    id: "gen_079",
    categoryId: "general",
    question: "ما هو الحيوان الوحيد الذي لا يستطيع القفز نهائياً من بين الثدييات الكبيرة؟",
    answer: "الفيل (Elephant)",
    hint: "بسبب وزنه الهائل وتشريح مفاصل قدمه",
    difficulty: "medium"
  },
  {
    id: "gen_080",
    categoryId: "general",
    question: "ما هي عملة دولة الكويت والتي تعتبر من أعلى العملات قيمة وسعراً في العالم؟",
    answer: "الدينار الكويتي (KWD)",
    hint: "يتكون من 1000 فلس",
    difficulty: "easy"
  },
  {
    id: "gen_081",
    categoryId: "general",
    question: "ما هو الطائر الوحيد القادر على الطيران إلى الخلف في الهواء؟",
    answer: "طائر الطنان (Hummingbird)",
    hint: "أصغر طائر في العالم ويحرك جناحيه 80 مرة في الثانية",
    difficulty: "medium"
  },
  {
    id: "gen_082",
    categoryId: "general",
    question: "ما هو العنصر الكيميائي الذي يمثله الرمز 'Au' في الجدول الدوري؟",
    answer: "الذهب (Gold - من الكلمة اللاتينية Aurum)",
    hint: "المعدن الأصفر النفيس عيار 21 و24",
    difficulty: "easy"
  },
  {
    id: "gen_083",
    categoryId: "general",
    question: "كم عدد أسنان الإنسان البالغ الطبيعية المكتملة (بما فيها ضروس العقل)؟",
    answer: "32 سناً (16 في الفك العلوي و16 في السفلي)",
    hint: "الأطفال لديهم 20 سناً لبنية فقط",
    difficulty: "easy"
  },
  {
    id: "gen_084",
    categoryId: "general",
    question: "ما هي المادة المسؤولة عن إعطاء الجلد والشعر والعينين لونها الطبيعي والحماية من الشمس؟",
    answer: "الميلانين (Melanin)",
    hint: "صبغة طبيعية تفرزها خلايا الجلد",
    difficulty: "medium"
  },
  {
    id: "gen_085",
    categoryId: "general",
    question: "ما هو أكبر عضو في جسم الإنسان من حيث المساحة والوزن الخارجي؟",
    answer: "الجلد (Skin)",
    hint: "يغطي كامل الجسم ويحميه من العوامل الخارجية",
    difficulty: "easy"
  },
  {
    id: "gen_086",
    categoryId: "general",
    question: "ما هي أصغر عظمة في جسم الإنسان وتوجد داخل الأذن الوسطى؟",
    answer: "عظمة الركاب (Stapes)",
    hint: "طولها حوالي 3 ملم فقط وتنقل الاهتزازات الصوتية",
    difficulty: "medium"
  },
  {
    id: "gen_087",
    categoryId: "general",
    question: "ما هو اسم الوكالة الفيدرالية الأمريكية المسؤولة عن أبحاث الفضاء والرحلات الفضائية؟",
    answer: "وكالة ناسا (NASA)",
    hint: "أطلقت تلسكوب جيمس ويب وهبطت على القمر",
    difficulty: "easy"
  },
  {
    id: "gen_088",
    categoryId: "general",
    question: "ما هو الصوت الصادر عن الضفدع في اللغة العربية؟",
    answer: "النقيق",
    hint: "الضفدع ينق نقيقاً",
    difficulty: "medium"
  },
  {
    id: "gen_089",
    categoryId: "general",
    question: "كم عدد أيام السنة الكبيسة الميلادية (Leap Year)؟",
    answer: "366 يوماً (شهر فبراير يأتي 29 يوماً)",
    hint: "تأتي مرة واحدة كل 4 سنوات",
    difficulty: "easy"
  },
  {
    id: "gen_090",
    categoryId: "general",
    question: "ما هو الكوكب الأكبر حجماً وكتلة في المجموعة الشمسية ويمتلك بقعة حمراء عملاقة؟",
    answer: "كوكب المشتري (Jupiter)",
    hint: "كوكب غازي عملاق ولديه أكثر من 90 قمراً",
    difficulty: "easy"
  }
];

// Add all questions avoiding duplicate IDs
const allNewQuestions = [...descQuestions, ...historyQuestions, ...geoQuestions, ...additionalGeneralQuestions];

let addedCount = 0;
allNewQuestions.forEach(q => {
  if (!currentData.questions.some(existing => existing.id === q.id)) {
    currentData.questions.push(q);
    addedCount++;
  }
});

// Bump dataset version
currentData.version = (currentData.version || 8) + 1;

fs.writeFileSync(dataPath, JSON.stringify(currentData, null, 2), 'utf8');

console.log(`Success! Added ${addedCount} new questions. Total categories: ${currentData.categories.length}, Total questions: ${currentData.questions.length}, Version: ${currentData.version}`);
