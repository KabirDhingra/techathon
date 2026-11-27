'use strict';

function answer(message, context) {
  const ctx = context && typeof context === 'object' ? context : {};
  const raw = typeof message === 'string' ? message : (message == null ? '' : String(message));
  const lower = raw.toLowerCase();
  const padded = ' ' + lower.replace(/[^a-z0-9\u0900-\u097f]+/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
  const hasDevanagari = /[\u0900-\u097f]/.test(raw);

  function hasAny(words) {
    for (let i = 0; i < words.length; i++) {
      if (padded.indexOf(' ' + words[i] + ' ') !== -1) return true;
    }
    return false;
  }

  const hinglishMarkers = [
    'kaise', 'kya', 'kahan', 'kahin', 'kaun', 'kyun', 'kyon', 'mat', 'kar', 'karo',
    'karein', 'ho', 'hai', 'hain', 'nahi', 'thik', 'theek', 'jaldi', 'aurat', 'ladki',
    'bachao', 'chot', 'sui', 'kanch', 'ghar', 'raat', 'paise', 'paisa', 'dhoka', 'madad',
    'batao', 'bataiye', 'dekho', 'suno', 'abhi', 'yahan', 'vahan', 'chahiye', 'milega',
    'hoga', 'rahega', 'samajh', 'poocho', 'karu', 'karun', 'karoon', 'gira', 'gaya',
    'hua', 'dikhe', 'chhua', 'lagao', 'dabao', 'banao', 'rakho', 'jana', 'jao', 'aate',
    'sakte', 'sakta', 'paas', 'saath', 'pehle', 'phir', 'aur', 'bhi', 'sirf', 'turant',
    'najdeeki', 'nazdeeki', 'accha', 'se', 'mein', 'par', 'ko', 'ki', 'ke', 'ka'
  ];

  let lang = 'en';
  if (ctx.lang === 'hi' || hasDevanagari) {
    lang = 'hi';
  } else if (hasAny(hinglishMarkers)) {
    lang = 'hinglish';
  }

  const topics = [
    {
      key: 'emergency',
      words: [
        'emergency', 'sos', 'accident', 'injury', 'injured', 'bleeding', 'bleed', 'hurt',
        'danger', 'ambulance', 'fire', 'bachao', 'bchao', 'durghatna', 'chot', 'aag',
        'khatra', 'ghabrahat', 'save me', '108', '101',
        'आपदा', 'दुर्घटना', 'चोट', 'खून', 'आग', 'खतरा', 'बचाओ'
      ],
      en: 'Stay calm and move to a safe spot. 1) Hold the SOS button for 3 seconds so your team is alerted. 2) Call 112 now. 3) For serious injury call 108, and for fire call 101. 4) Share your exact landmark and keep your phone charged. Do not move an injured person unless there is immediate danger.',
      hi: 'शांत रहें और पहले सुरक्षित जगह पर जाएँ। 1) SOS बटन को 3 सेकंड तक दबाएँ, ताकि टीम को तुरंत पता चले। 2) अभी 112 पर कॉल करें। 3) गंभीर चोट हो तो 108 और आग लगे तो 101 पर कॉल करें। 4) अपना सटीक स्थान बताएँ और फ़ोन चार्ज रखें। तुरंत खतरा न हो तो घायल व्यक्ति को हिलाएँ नहीं।',
      hinglish: 'Pehle shant ho kar safe jagah par jao. 1) SOS button ko 3 second tak dabao, team ko turant pata chal jayega. 2) Abhi 112 par call karo. 3) Serious chot ho to 108 aur aag lage to 101 par call karo. 4) Apna exact landmark batao aur phone charge rakho. Bina zarurat ghayal ko mat hilao.'
    },
    {
      key: 'sharps',
      words: [
        'glass', 'broken glass', 'sharps', 'sharp', 'needle', 'syringe', 'blade', 'cutter',
        'kanch', 'kach', 'sui', 'toota', 'tuta', 'churi', 'काँच', 'काच', 'सुई', 'सिरिंज',
        'धारदार', 'ब्लेड'
      ],
      en: 'Do not touch it with bare hands. 1) Put on thick gloves and use tongs or a broom and dustpan. 2) Place the glass, needle or syringe in a rigid, labelled box, never a loose bag. 3) Report it to your supervisor and log it in the app. 4) Wash with soap if skin touches it, and call 108 if you are cut.',
      hi: 'इसे नंगे हाथों से न छूएँ। 1) मोटे दस्ताने पहनें और चिमटा या झाड़ू-डस्टपैन इस्तेमाल करें। 2) काँच, सुई या सिरिंज को कड़े, लेबल वाले डिब्बे में रखें, ढीले बैग में नहीं। 3) सुपरवाइज़र को बताएँ और ऐप में एंट्री करें। 4) त्वचा छू जाए तो साबुन से धोएँ और कट जाए तो 108 पर कॉल करें।',
      hinglish: 'Ise nange hathon se mat chhua. 1) Moote gloves lagao aur chimta ya jhadu-dustpan use karo. 2) Kanch, sui ya syringe ko hard, label wale box mein rakho, loose bag mein nahi. 3) Supervisor ko batao aur app mein entry karo. 4) Hath chhua to sabun se dho lo aur cut ho gaya to 108 par call karo.'
    },
    {
      key: 'chemical',
      words: [
        'chemical', 'chemicals', 'spill', 'spilled', 'leak', 'leaking', 'acid', 'solvent',
        'dhuaan', 'रसायन', 'रिसाव', 'केमिकल', 'एसिड', 'धुआँ'
      ],
      en: 'Move upwind and keep others away. 1) Do not touch or smell the spill. 2) Put on gloves and a mask if available, close the area and alert your supervisor. 3) Use absorbent cloth or sand only if you are trained; never mix chemicals with water. 4) If it touches skin or eyes, rinse with clean water and call 108. For fire call 101.',
      hi: 'हवा की दिशा की तरफ़ जाएँ और दूसरों को दूर रखें। 1) रिसाव को छूएँ या सूँघें नहीं। 2) दस्ताने और मास्क लगाएँ, इलाका बंद करें और सुपरवाइज़र को सूचित करें। 3) प्रशिक्षित हों तो ही सोखने वाला कपड़ा या रेत इस्तेमाल करें; रसायन को पानी में न मिलाएँ। 4) त्वचा या आँखों पर गिरे तो साफ़ पानी से धोएँ और 108 पर कॉल करें। आग हो तो 101।',
      hinglish: 'Hawa ki disha mein jao aur doosron ko door rakho. 1) Spill ko chhua ya sungh mat. 2) Gloves aur mask lagao, area band karo aur supervisor ko batlao. 3) Training ho to hi absorbent cloth ya ret use karo; chemical ko pani mein mat milao. 4) Skin ya aankhon par gire to saaf pani se dho lo aur 108 par call karo. Aag ho to 101.'
    },
    {
      key: 'medical',
      words: [
        'red bag', 'red bin', 'medical waste', 'biohazard', 'biomedical', 'bio medical',
        'hospital waste', 'contaminated', 'lal bag', 'medical kachra', 'लाल बैग', 'लाल बिन',
        'मेडिकल कचरा', 'जैविक कचरा', 'संक्रामक'
      ],
      en: 'Treat it as infectious waste. 1) Wear gloves and a mask. 2) Put the item directly into the red bag or red bin; never open, sort or reuse it. 3) Tie the bag and label it with the date and area. 4) Hand it only to the authorised collector and record the pickup in the app. 5) Sanitise hands and report any puncture to your supervisor.',
      hi: 'इसे संक्रामक कचरा मानें। 1) दस्ताने और मास्क पहनें। 2) वस्तु सीधे लाल बैग या लाल बिन में डालें; इसे खोलें, छाँटें या दोबारा न इस्तेमाल करें। 3) बैग बाँधें और तारीख़ व इलाका लिखें। 4) केवल अधिकृत संग्राहक को दें और ऐप में उठाव दर्ज करें। 5) हाथ सैनिटाइज़ करें और किसी चुभन की सूचना दें।',
      hinglish: 'Ise infectious waste samjho. 1) Gloves aur mask lagao. 2) Cheez seedha red bag ya red bin mein daalo; use kholo, chhanto ya dobara mat use karo. 3) Bag band karo aur date aur area likho. 4) Sirf authorised collector ko do aur app mein pickup record karo. 5) Hath sanitize karo aur kisi chubhan ki supervisor ko baat karo.'
    },
    {
      key: 'ewaste',
      words: [
        'battery', 'batteries', 'e-waste', 'ewaste', 'electronic waste', 'mobile', 'charger',
        'circuit', 'lithium', 'बैटरी', 'ई-वेस्ट', 'इलेक्ट्रॉनिक कचरा', 'लीथियम'
      ],
      en: 'Handle e-waste as a fire risk. 1) Do not crush, open or burn any battery or phone. 2) Keep batteries dry and away from heat; tape the terminals if exposed. 3) Store them in a cool, labelled, non-metal box. 4) Give them only to the authorised e-waste vendor and log it in the app. 5) If you see smoke or swelling, move away and call 101.',
      hi: 'ई-कचरे को आग के खतरे के रूप में संभालें। 1) किसी बैटरी या फ़ोन को कुचलें, खोलें या जलाएँ नहीं। 2) बैटरियाँ सूखी और गर्मी से दूर रखें; खुले टर्मिनल पर टेप लगाएँ। 3) उन्हें ठंडे, लेबल वाले, गैर-धातु डिब्बे में रखें। 4) केवल अधिकृत विक्रेता को दें और ऐप में दर्ज करें। 5) धुआँ या सूजन दिखे तो दूर जाएँ और 101 पर कॉल करें।',
      hinglish: 'E-waste ko fire risk ki tarah handle karo. 1) Battery ya phone ko crush, open ya jalao mat. 2) Batteries dry aur garmi se door rakho; khule terminals par tape laga do. 3) Cool, label wale, non-metal box mein rakho. 4) Sirf authorised vendor ko do aur app mein record karo. 5) Dhuaan ya swelling dikhe to door jao aur 101 par call karo.'
    },
    {
      key: 'ppe',
      words: [
        'ppe', 'ppe kit', 'gloves', 'glove', 'mask', 'boots', 'goggles', 'helmet',
        'safety kit', 'safety gear', 'dastane', 'dastana', 'मास्क', 'दस्ताने', 'पीपीई',
        'सुरक्षा किट', 'जूते'
      ],
      en: 'Your safety kit comes first. 1) Wear gloves, mask, boots and eye protection before touching any waste. 2) Check for tears and replace damaged gear. 3) Sanitise hands after removing gloves and never touch your face with them. 4) Ask your supervisor for a fresh PPE kit if yours is missing. 5) Report any cut or rash immediately.',
      hi: 'आपकी सुरक्षा सबसे पहले है। 1) किसी भी कचरे को छूने से पहले दस्ताने, मास्क, जूते और आँखों की सुरक्षा पहनें। 2) फाड़ या नुकसान जाँचें और खराब सामान बदलें। 3) दस्ताने उतारने के बाद हाथ सैनिटाइज़ करें और उनसे चेहरा न छूएँ। 4) किट न हो तो सुपरवाइज़र से नई PPE माँगें। 5) कट या खुजली की तुरंत सूचना दें।',
      hinglish: 'Aapki safety sabse pehle. 1) Kisi bhi waste ko chhune se pehle gloves, mask, boots aur eye protection lagao. 2) Fad ya damage check karo aur kharaab gear badlo. 3) Gloves utarne ke baad hath sanitize karo aur unse chehra mat chhuo. 4) Kit na ho to supervisor se nayi PPE kit maango. 5) Kya cut ya khujali ho to turant batao.'
    },
    {
      key: 'eshram',
      words: [
        'eshram', 'e shram', 'e-shram', 'shram', 'labour card', 'unorganised', 'registration',
        'register', 'csc', 'ई-श्रम', 'ई श्रम', 'श्रमिक', 'पंजीकरण'
      ],
      en: 'e-SHRAM is for unorganised workers, including waste workers. 1) Keep your Aadhaar, bank details and phone ready. 2) Register free at eshram.gov.in or visit the nearest CSC centre with your documents. 3) Enter the mobile OTP yourself; never share it. 4) Save the registration number in the app. 5) Ask your supervisor if you need help with the form.',
      hi: 'ई-श्रम असंगठित श्रमिकों, जिनमें कचरा कामगार भी शामिल हैं, के लिए है। 1) आधार, बैंक विवरण और फ़ोन तैयार रखें। 2) eshram.gov.in पर निःशुल्क पंजीकरण करें या दस्तावेज़ों के साथ नज़दीकी CSC केंद्र जाएँ। 3) मोबाइल OTP खुद ही डालें; किसी को न बताएँ। 4) पंजीकरण संख्या ऐप में सेव करें। 5) फ़ॉर्म में मदद चाहिए तो सुपरवाइज़र से पूछें।',
      hinglish: 'e-SHRAM unorganised workers ke liye hai, ismein waste workers bhi aate hain. 1) Aadhaar, bank details aur phone paas rakho. 2) eshram.gov.in par free register karo ya documents ke saath najdeeki CSC centre jao. 3) Mobile OTP khud hi daalo; kisi ko mat batao. 4) Registration number app mein save karo. 5) Form mein madad chahiye to supervisor se poocho.'
    },
    {
      key: 'pmjay',
      words: [
        'pmjay', 'pm jay', 'pm-jay', 'ayushman', 'ayushman bharat', 'health card', 'cashless',
        'insurance', 'hospital', 'treatment', 'आयुष्मान', 'पीएम जय', 'पीएम-जय', 'बीमा', 'इलाज'
      ],
      en: 'PM-JAY can give your family cashless hospital treatment. 1) Check whether your family is on the Ayushman card list. 2) Carry your card and Aadhaar to an empanelled hospital. 3) Ask the help desk for the AyushmanMitra desk. 4) Keep copies of your documents. 5) If treatment is refused, ask your supervisor or the nearest CSC for help. Call 108 for a medical emergency.',
      hi: 'पीएम-जय से आपके परिवार को कैशलेस इलाज मिल सकता है। 1) जाँचें कि आपका परिवार आयुष्मान कार्ड सूची में है या नहीं। 2) कार्ड और आधार लेकर सूचीबद्ध अस्पताल जाएँ। 3) वहाँ आयुष्मानमित्र डेस्क पर पूछें। 4) दस्तावेज़ों की फ़ोटोकॉपी साथ रखें। 5) इलाज मना हो तो सुपरवाइज़र या नज़दीकी CSC से मदद लें। मेडिकल आपदा में 108 पर कॉल करें।',
      hinglish: 'PM-JAY se aapke parivar ko cashless ilaaj mil sakta hai. 1) Check karo ki aapka parivar Ayushman card list mein hai ya nahi. 2) Card aur Aadhaar le kar empanelled hospital jao. 3) Wahan AyushmanMitra desk se poocho. 4) Documents ki photocopy saath rakho. 5) Ilaj mana kare to supervisor ya najdeeki CSC se help lo. Medical emergency mein 108 par call karo.'
    },
    {
      key: 'cyber',
      words: [
        'otp', 'fraud', 'scam', 'cyber', 'cybercrime', 'phishing', 'upi', 'bank', 'password',
        'pin', 'link', 'धोखा', 'धोखाधड़ी', 'स्कैम', 'साइबर', 'ओटीपी', 'पासवर्ड', 'dhoka',
        'paise', 'paisa', 'fake call'
      ],
      en: 'A genuine bank or government team will never ask for your OTP, PIN or password. 1) Do not share the code or click the link. 2) Stop the payment and call 1930 immediately. 3) Report it at cybercrime.gov.in with the number, message and screenshot. 4) Tell your bank and block the card if needed. 5) Warn your co-workers; never forward the scam link.',
      hi: 'असली बैंक या सरकारी टीम कभी OTP, PIN या पासवर्ड नहीं माँगती। 1) कोड साझा न करें और लिंक पर न क्लिक करें। 2) भुगतान रोकें और तुरंत 1930 पर कॉल करें। 3) cybercrime.gov.in पर नंबर, संदेश और स्क्रीनशॉट के साथ शिकायत दर्ज करें। 4) बैंक को बताएँ और ज़रूरत हो तो कार्ड ब्लॉक करें। 5) साथी कामगारों को चेतावनी दें; धोखाधड़ी वाला लिंक आगे न भेजें।',
      hinglish: 'Asli bank ya sarkari team kabhi OTP, PIN ya password nahi maangti. 1) Code share mat karo aur link par click mat karo. 2) Payment rok do aur turant 1930 par call karo. 3) cybercrime.gov.in par number, message aur screenshot ke saath complaint darj karo. 4) Bank ko batao aur zarurat ho to card block karao. 5) Saathi workers ko chetawani do; scam link aage mat bhejo.'
    },
    {
      key: 'women',
      words: [
        'women', 'woman', 'girl', 'female', 'harass', 'harassment', 'molest', 'molestation',
        'eve teasing', '1091', 'महिला', 'अन्याय', 'छेड़खानी', 'aurat', 'ladki', 'chhedkhani',
        'asurakshit', 'pichha'
      ],
      en: 'Your safety is the priority. 1) Move to a crowded, well-lit place and call 1091 if you feel threatened. 2) Hold the SOS button for 3 seconds to alert your team. 3) Call 112 if you are followed or attacked. 4) Note the location, time and description, and save any evidence. 5) Tell a trusted colleague and your supervisor; do not confront the person alone.',
      hi: 'आपकी सुरक्षा सबसे महत्वपूर्ण है। 1) भीड़ वाली, रोशन जगह पर जाएँ और असुरक्षित लगे तो 1091 पर कॉल करें। 2) टीम को सूचित करने के लिए SOS बटन 3 सेकंड तक दबाएँ। 3) कोई पीछा करे या हमला करे तो 112 पर कॉल करें। 4) स्थान, समय और विवरण नोट करें और सबूत सुरक्षित रखें। 5) किसी भरोसेमंद सहकर्मी और सुपरवाइज़र को बताएँ; अकेले सामना न करें।',
      hinglish: 'Aapki safety sabse important hai. 1) Bheed wali, roshni wali jagah jao aur asurakshit lage to 1091 par call karo. 2) Team ko alert karne ke liye SOS button 3 second tak dabao. 3) Koi pichha kare ya attack kare to 112 par call karo. 4) Jagah, time aur description note karo aur proof save karo. 5) Kisi bharosemand saathi aur supervisor ko batao; akela samna mat karo.'
    },
    {
      key: 'police',
      words: [
        'police', 'police station', 'thana', 'station', 'nearest police', 'thanah',
        'पुलिस', 'थाना', 'पुलिस स्टेशन', 'station kahan'
      ],
      en: 'If you need the nearest police station: 1) Call 112 for immediate help; they will connect the local station. 2) You can also call 100 for police. 3) Ask your supervisor or the local help desk for the station address. 4) Share only your current landmark and the issue over the phone, not personal documents. 5) Note the officer name and complaint number for follow-up.',
      hi: 'नज़दीकी पुलिस स्टेशन के लिए: 1) तुरंत मदद के लिए 112 पर कॉल करें; वे स्थानीय थाने से जोड़ेंगे। 2) पुलिस के लिए 100 पर भी कॉल कर सकते हैं। 3) सुपरवाइज़र या स्थानीय हेल्प डेस्क से थाने का पता पूछें। 4) फ़ोन पर केवल अपना वर्तमान स्थल और घटना बताएँ, निजी दस्तावेज़ नहीं। 5) अधिकारी का नाम और शिकायत संख्या नोट करें।',
      hinglish: 'Najdeeki police station ke liye: 1) Turant madad ke liye 112 par call karo; woh local thane se jod denge. 2) Police ke liye 100 par bhi call kar sakte ho. 3) Supervisor ya local help desk se thane ka address poocho. 4) Phone par sirf apna current landmark aur ghatna batao, personal documents nahi. 5) Officer ka naam aur complaint number note karo.'
    },
    {
      key: 'travel',
      words: [
        'travel', 'night', 'night shift', 'shift', 'home', 'ghar', 'late', 'dark', 'bus',
        'auto', 'route', 'stranger', 'safe travel', 'रात', 'यात्रा', 'नाइट', 'शिफ्ट',
        'अंधेरा', 'घर', 'ghar jana', 'late night', 'sunsaan'
      ],
      en: 'Plan your night shift travel before it gets dark. 1) Share your route and expected arrival time with a colleague. 2) Use a well-lit, busy route and avoid isolated shortcuts. 3) Keep your phone charged and 112 on speed dial. 4) If someone follows you, do not go home; go to a shop or guard and call 112, or 1091 if you feel unsafe. 5) Message your supervisor when you start and arrive.',
      hi: 'नाइट शिफ्ट से पहले यात्रा की योजना बनाएँ। 1) अपना रास्ता और पहुँचने का समय किसी सहकर्मी को बताएँ। 2) रोशन और भीड़ वाला रास्ता चुनें, सुनसान शॉर्टकट से बचें। 3) फ़ोन चार्ज रखें और 112 को फास्ट डायल में रखें। 4) कोई पीछा करे तो घर न जाएँ; दुकान या गार्ड के पास जाएँ और 112, या असुरक्षा हो तो 1091 पर कॉल करें। 5) शुरुआत और पहुँचने पर सुपरवाइज़र को सूचित करें।',
      hinglish: 'Night shift se pehle travel ka plan bana lo. 1) Apna route aur pahunchne ka time kisi saathi ko batao. 2) Roshni wala aur bheed wala rasta chuno, sunsaan shortcut se bacho. 3) Phone charge rakho aur 112 ko speed dial mein rakho. 4) Koi pichha kare to ghar mat jao; shop ya guard ke paas jao aur 112, ya asurakshit lage to 1091 par call karo. 5) Start aur arrive par supervisor ko batlao.'
    },
    {
      key: 'heat',
      words: [
        'heat', 'heatstroke', 'hot', 'garmi', 'dizzy', 'dizziness', 'chakkar', 'thirst',
        'thirsty', 'sun', 'pani', 'lo', 'weakness', 'faint', 'behoosh', 'paseena',
        'गर्मी', 'चक्कर', 'प्यास', 'धूप', 'लू', 'बेहोशी', 'कमजोरी'
      ],
      en: 'Heat can cause dizziness fast. 1) Stop work and move to shade or a cool room. 2) Sip water slowly, even if you are not thirsty. 3) Loosen tight clothing and splash water on your face and wrists. 4) Sit down so you do not fall, and tell your supervisor. 5) If you feel faint, confused, or stop sweating, call 108 immediately. Do not drink very cold water quickly.',
      hi: 'गर्मी से चक्कर जल्दी आ सकते हैं। 1) काम रोकें और छाँव या ठंडे कमरे में जाएँ। 2) प्यास न लगे तो भी धीरे-धीरे पानी पिएँ। 3) कड़े कपड़े ढीले करें और चेहरे व कलाइयों पर पानी डालें। 4) गिरने से बचने के लिए बैठ जाएँ और सुपरवाइज़र को बताएँ। 5) बेहोशी, भ्रम या पसीना रुक जाए तो तुरंत 108 पर कॉल करें। बहुत ठंडा पानी एक साथ न पिएँ।',
      hinglish: 'Garmi se chakkar jaldi aa sakte hain. 1) Kaam roko aur chhaav ya cool room mein jao. 2) Pyaas na lage to bhi dheere-dheere pani pio. 3) Karte kapde dheele karo aur chehre aur kalaiyon par pani chharak lo. 4) Girne se bachne ke liye baith jao aur supervisor ko batao. 5) Behooshi, confusion ya paseena ruk jaye to turant 108 par call karo. Bahut thanda pani ek saath mat pio.'
    },
    {
      key: 'points',
      words: [
        'point', 'points', 'reward', 'rewards', 'bonus', 'score', 'level', 'leaderboard',
        'certificate', 'star', 'अंक', 'पॉइंट', 'पॉइंट्स', 'इनाम', 'प्रमाणपत्र'
      ],
      en: 'Your points grow with safe, verified actions. 1) Open Scan and complete the daily safety checklist. 2) Log each verified pickup or report so it counts. 3) Keep your profile details correct. 4) Reach the next level to unlock more rewards and certificates. 5) Ask your supervisor how points are checked in your area. Never enter someone else activity to earn points.',
      hi: 'आपके अंक सुरक्षित और सत्यापित कामों से बढ़ते हैं। 1) Scan खोलें और रोज़ाना सुरक्षा चेकलिस्ट पूरी करें। 2) हर सत्यापित उठाव या रिपोर्ट दर्ज करें, तभी अंक जुड़ेंगे। 3) अपनी प्रोफ़ाइल की जानकारी सही रखें। 4) अगले स्तर पर और इनाम व प्रमाणपत्र मिल सकते हैं। 5) अपने इलाके में अंक कैसे जाँचे हैं, सुपरवाइज़र से पूछें। किसी और की गतिविधि अपने नाम न डालें।',
      hinglish: 'Aapke points safe aur verified kaam se badhte hain. 1) Scan kholo aur rozana safety checklist poori karo. 2) Har verified pickup ya report entry karo, tabhi points judenge. 3) Apni profile ki details sahi rakho. 4) Agle level par aur rewards aur certificate mil sakte hain. 5) Apne area mein points kaise check hote hain, supervisor se poocho. Kisi aur ki activity apne naam mat daalo.'
    },
    {
      key: 'greeting',
      words: [
        'hi', 'hello', 'hey', 'namaste', 'namaskar', 'good morning', 'good evening',
        'kaise ho', 'kya haal', 'नमस्ते', 'नमस्कार', 'हेलो', 'sup', 'kaise', 'kya'
      ],
      en: 'Hello! I am SurakshaSetu, here to help with your safety at work. 1) Ask me about PPE, heat, sharps, e-SHRAM or your points. 2) In an emergency, hold SOS for 3 seconds and call 112. 3) If you are unsure about any waste, do not touch it, use Scan and ask your supervisor. How can I help you right now?',
      hi: 'नमस्ते! मैं सुरक्षासेतु हूँ, आपकी काम की सुरक्षा के लिए यहाँ हूँ। 1) आप PPE, गर्मी, धारदार कचरे, ई-श्रम या अपने अंकों के बारे में पूछ सकते हैं। 2) आपदा में SOS को 3 सेकंड दबाएँ और 112 पर कॉल करें। 3) किसी भी अज्ञात कचरे को छूने से पहले Scan करें और सुपरवाइज़र से पूछें। अभी मैं आपकी क्या मदद कर सकता हूँ?',
      hinglish: 'Namaste! Main SurakshaSetu hoon, aapki kaam ki safety ke liye yahin hoon. 1) PPE, garmi, sharp waste, e-SHRAM ya apne points ke baare mein poocho. 2) Emergency mein SOS ko 3 second dabao aur 112 par call karo. 3) Kisi bhi anjaan waste ko chhune se pehle Scan karo aur supervisor se poocho. Abhi main aapki kya madad kar sakta hoon?'
    },
    {
      key: 'fallback',
      words: [],
      en: 'I am not sure I understood, so let us stay safe first. 1) Do not touch unknown waste with bare hands. 2) Use Scan to identify it and follow the steps shown. 3) If it looks sharp, chemical, medical or burning, step back and alert your supervisor. 4) In danger, hold SOS for 3 seconds and call 112. Tell me a little more and I will guide you.',
      hi: 'मुझे पूरा समझ नहीं आया, इसलिए पहले सुरक्षा रखें। 1) अज्ञात कचरे को नंगे हाथों से न छूें। 2) पहचानने के लिए Scan करें और दिए गए चरणों का पालन करें। 3) अगर वह धारदार, रासायनिक, चिकित्सीय या जलता दिखे तो पीछे हटें और सुपरवाइज़र को बताएँ। 4) खतरा हो तो SOS 3 सेकंड दबाएँ और 112 पर कॉल करें। थोड़ा और बताइए, मैं मदद करूँगा।',
      hinglish: 'Mujhe poori tarah samajh nahi aaya, to pehle safety rakhte hain. 1) Anjaan waste ko nange hathon se mat chhuo. 2) Identify karne ke liye Scan karo aur diye gaye steps follow karo. 3) Agar sharp, chemical, medical ya jalta dikhe to peeche hato aur supervisor ko batao. 4) Khatre mein SOS 3 second dabao aur 112 par call karo. Thoda aur batao, main madad karunga.'
    }
  ];

  let chosen = topics[topics.length - 1];
  let best = 0;
  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    if (!topic.words.length) continue;
    let score = 0;
    for (let j = 0; j < topic.words.length; j++) {
      if (padded.indexOf(' ' + topic.words[j] + ' ') !== -1) score++;
    }
    if (score > best) {
      best = score;
      chosen = topic;
    }
  }

  function clean(value) {
    if (typeof value !== 'string' && typeof value !== 'number') return '';
    return String(value).replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 48);
  }

  const area = clean(ctx.area);
  const work = clean(ctx.work);
  const rawPoints = clean(ctx.points);
  const points = /^\d{1,7}$/.test(rawPoints) ? rawPoints : '';

  let lead = '';
  if (chosen.key !== 'greeting' && chosen.key !== 'fallback') {
    if (area) {
      if (lang === 'hi') lead = area + ' में इन चरणों का पालन करें।';
      else if (lang === 'hinglish') lead = area + ' mein ye steps follow karo.';
      else lead = 'In ' + area + ', follow these steps.';
    } else if (work) {
      if (lang === 'hi') lead = work + ' के काम में सावधान रहें।';
      else if (lang === 'hinglish') lead = work + ' ke kaam mein savdhaan raho.';
      else lead = 'For your ' + work + ' role, stay alert.';
    }
  }

  let extra = '';
  if (chosen.key === 'points' && points) {
    if (lang === 'hi') extra = 'आपके पास अभी ' + points + ' अंक हैं।';
    else if (lang === 'hinglish') extra = 'Aapke paas abhi ' + points + ' points hain.';
    else extra = 'You have ' + points + ' points right now.';
  }

  const parts = [];
  if (lead) parts.push(lead);
  parts.push(chosen[lang]);
  if (extra) parts.push(extra);
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

const LANGUAGE_NAMES = {
  en: 'English',
  hi: 'Hindi',
  bn: 'Bengali',
  ta: 'Tamil',
  te: 'Telugu',
  mr: 'Marathi',
  gu: 'Gujarati',
  pa: 'Punjabi',
  kn: 'Kannada',
  ml: 'Malayalam',
  or: 'Odia',
  as: 'Assamese',
  hinglish: 'Hinglish'
};

function sanitizeReply(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 1200);
}

function buildPrompt(message, context) {
  const ctx = context && typeof context === 'object' ? context : {};
  const area = ctx.area ? String(ctx.area).slice(0, 80) : '';
  const work = ctx.work ? String(ctx.work).slice(0, 80) : '';
  const points = Number.isFinite(Number(ctx.points)) ? Number(ctx.points) : '';
  const lang = LANGUAGE_NAMES[ctx.lang] || 'English';
  return [
    'You are SurakshaSetu, a safety companion for informal waste workers in India.',
    'Answer in ' + lang + '.',
    'Be practical, calm, concise and safety-first.',
    'Do not give medical diagnoses; direct serious injuries to 108 and emergencies to 112.',
    'Never ask for OTPs, PINs, passwords or private documents.',
    area ? 'Worker area: ' + area + '.' : '',
    work ? 'Worker role: ' + work + '.' : '',
    points !== '' ? 'Worker points: ' + points + '.' : '',
    'User question: ' + String(message || '').slice(0, 600)
  ].filter(Boolean).join('\\n');
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) return null;
    return await response.json();
  } catch (_) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function geminiReply(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const data = await fetchWithTimeout(
    'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(key),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.35, maxOutputTokens: 320 }
      })
    },
    4000
  );
  return sanitizeReply(data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text);
}

async function groqReply(prompt) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  const data = await fetchWithTimeout(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key
      },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        max_tokens: 320,
        messages: [
          { role: 'system', content: 'You are SurakshaSetu, a safety companion for waste workers in India.' },
          { role: 'user', content: prompt }
        ]
      })
    },
    4000
  );
  return sanitizeReply(data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content);
}

async function huggingFaceReply(prompt) {
  const key = process.env.HF_API_TOKEN || process.env.HUGGINGFACE_API_TOKEN;
  if (!key) return null;
  const model = process.env.HF_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2';
  const data = await fetchWithTimeout(
    'https://api-inference.huggingface.co/models/' + model,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { max_new_tokens: 260, temperature: 0.35, return_full_text: false }
      })
    },
    5000
  );
  if (Array.isArray(data) && data[0] && typeof data[0].generated_text === 'string') {
    return sanitizeReply(data[0].generated_text);
  }
  return sanitizeReply(data && data.generated_text);
}

let lastProvider = 'local';

async function reply(message, context) {
  const ctx = context && typeof context === 'object' ? context : {};
  const fallback = answer(message, ctx);
  if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY && !(process.env.HF_API_TOKEN || process.env.HUGGINGFACE_API_TOKEN)) {
    lastProvider = 'local';
    return fallback;
  }
  const prompt = buildPrompt(message, ctx);
  const providers = [
    { name: 'gemini', run: geminiReply },
    { name: 'groq', run: groqReply },
    { name: 'huggingface', run: huggingFaceReply }
  ];
  for (const provider of providers) {
    const result = await provider.run(prompt);
    if (result) {
      lastProvider = provider.name;
      return result;
    }
  }
  lastProvider = 'local';
  return fallback;
}

function status() {
  return {
    configured: {
      gemini: Boolean(process.env.GEMINI_API_KEY),
      groq: Boolean(process.env.GROQ_API_KEY),
      huggingface: Boolean(process.env.HF_API_TOKEN || process.env.HUGGINGFACE_API_TOKEN)
    },
    lastProvider,
    mode: lastProvider === 'local' ? 'built-in' : 'ai'
  };
}

module.exports = { answer, reply, status };
