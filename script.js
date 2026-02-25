const translations = {
    en: {
        title: "Urdu Calendar",
        subtitle: "100 Years Exploration (1950 - 2050)",
        today: "Today",
        months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        hijriLabel: "Hijri Date:",
        langBtn: "English / اردو"
    },
    ur: {
        title: "اردو کیلنڈر",
        subtitle: "سو سالہ انتخاب (1950 - 2050)",
        today: "آج",
        months: ["جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون", "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر"],
        weekdays: ["اتوار", "پیر", "منگل", "بدھ", "جمعرات", "جمعہ", "ہفتہ"],
        hijriLabel: "ہجری تاریخ:",
        langBtn: "English / اردو"
    }
};

let currentLang = 'en';
let selectedDate = new Date();
let currentViewDate = new Date();
let currentMadhab = 'hanafi'; // 'hanafi' or 'shafai'

const MUMBAI_LAT = 19.0760;
const MUMBAI_LNG = 72.8777;
const MUMBAI_TZ = 5.5;

// Firebase Configuration (Using your existing project config)
const firebaseConfig = {
    apiKey: "AIzaSyB4hPx9yV78yujtAyUdmB8LnsJ5bkm2DWE",
    authDomain: "managment-48849.firebaseapp.com",
    projectId: "managment-48849",
    storageBucket: "managment-48849.firebasestorage.app",
    messagingSenderId: "442481227799",
    appId: "1:442481227799:web:013303dc0d088a19c6c452"
};

const fbStatusEl = document.getElementById('fb-status');

function setCloudStatus(state) {
    fbStatusEl.classList.remove('online', 'offline', 'error');
    if (state) fbStatusEl.classList.add(state);
}

// Initialize Firebase
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    window.db = firebase.firestore();
    setCloudStatus('offline');

    // Default state
    setCloudStatus('offline');

    // Enable offline persistence
    db.enablePersistence().then(() => {
        console.log("Persistence enabled");
    }).catch((err) => {
        console.warn("Persistence failed", err.code);
    });

    // Real-time connection feedback
    db.collection("prayer_times").limit(1).onSnapshot((snap) => {
        setCloudStatus('online');
    }, (err) => {
        console.error("Firestore Error:", err.code);
        if (err.code === 'permission-denied') {
            setCloudStatus('error');
        } else {
            setCloudStatus('offline');
        }
    });

    window.addEventListener('online', () => setCloudStatus('online'));
    window.addEventListener('offline', () => setCloudStatus('offline'));

    // Real-time listener for tasks
    db.collection("calendar_tasks").onSnapshot((snap) => {
        tasksCache = {};
        snap.forEach(doc => {
            tasksCache[doc.id] = doc.data().tasks || [];
        });
        updateCalendar();
        updateTasksList();
    });
} else {
    console.error("Firebase SDK not found!");
}
let tasksCache = {};
const taskModal = document.getElementById('task-modal');
const taskInput = document.getElementById('task-input');
const taskSave = document.getElementById('task-save');
const taskCancel = document.getElementById('task-cancel');
const tasksList = document.getElementById('tasks-list');
const tasksTitle = document.getElementById('tasks-title');
const addTaskTrigger = document.getElementById('add-task-trigger');

const monthSelect = document.getElementById('month-select');
const yearSelect = document.getElementById('year-select');
const displayMonthYear = document.getElementById('display-month-year');
const daysGrid = document.getElementById('days-grid');
const weekdayGrid = document.getElementById('weekday-grid');
const langToggle = document.getElementById('lang-toggle');
const todayBtn = document.getElementById('today-btn');
const prevBtn = document.getElementById('prev-month');
const nextBtn = document.getElementById('next-month');

const mainTitle = document.getElementById('main-title');
const subTitle = document.getElementById('sub-title');
const currentDayName = document.getElementById('current-day-name');
const currentFullDate = document.getElementById('current-full-date');
const hijriDateDisplay = document.getElementById('hijri-date');
const hijriLabel = document.querySelector('.hijri-box .label');
const festivalDisplay = document.getElementById('festival-display');

const fixedFestivals = {
    // International & National Days
    "0-1": { en: "New Year's Day", ur: "نیا سال" },
    "0-4": { en: "World Braille Day", ur: "عالمی یوم بریل" },
    "0-12": { en: "National Youth Day", ur: "قومی یوم نوجوان" },
    "0-13": { en: "Lohri", ur: "لوہری" },
    "0-14": { en: "Makar Sankranti / Pongal", ur: "مکر سنکرانتی / پونگل" },
    "0-23": { en: "Netaji Jayanti", ur: "سبھاش چندر بوس جینتی" },
    "0-26": { en: "Republic Day", ur: "یوم جمہوریہ" },
    "0-30": { en: "Martyrs' Day", ur: "یوم شہدا" },
    "1-4": { en: "World Cancer Day", ur: "کینسر کا عالمی دن" },
    "1-14": { en: "Valentine's Day", ur: "ویلنٹائن ڈے" },
    "1-21": { en: "International Mother Language Day", ur: "مادری زبان کا عالمی دن" },
    "1-28": { en: "National Science Day", ur: "قومی یوم سائنس" },
    "2-8": { en: "International Women's Day", ur: "خواتین کا عالمی دن" },
    "2-21": { en: "World Forestry Day", ur: "جنگلات کا عالمی دن" },
    "2-22": { en: "World Water Day", ur: "پانی کا عالمی دن" },
    "3-7": { en: "World Health Day", ur: "صحت کا عالمی دن" },
    "3-14": { en: "Ambedkar Jayanti", ur: "امبیڈکر جینتی" },
    "3-22": { en: "Earth Day", ur: "زمین کا عالمی دن" },
    "4-1": { en: "May Day / Labour Day", ur: "یوم مئی / یوم مزدور" },
    "4-8": { en: "World Red Cross Day", ur: "ریڈ کراس کا عالمی دن" },
    "4-31": { en: "Anti-Tobacco Day", ur: "تمباکو نوشی کے خلاف دن" },
    "5-5": { en: "World Environment Day", ur: "ماحولیات کا عالمی دن" },
    "5-21": { en: "International Yoga Day", ur: "یوگا کا عالمی دن" },
    "6-11": { en: "World Population Day", ur: "عالمی یوم آبادی" },
    "7-15": { en: "Independence Day", ur: "یوم آزادی" },
    "8-5": { en: "Teachers' Day", ur: "یوم اساتذہ" },
    "8-8": { en: "International Literacy Day", ur: "خواندگی کا عالمی دن" },
    "8-27": { en: "World Tourism Day", ur: "سیاحت کا عالمی دن" },
    "9-2": { en: "Gandhi Jayanti", ur: "گاندھی جینتی" },
    "9-8": { en: "Indian Air Force Day", ur: "انڈین ایئر فورس ڈے" },
    "9-24": { en: "United Nations Day", ur: "اقوام متحدہ کا دن" },
    "9-31": { en: "Sardar Patel Jayanti", ur: "سردار پٹیل جینتی" },
    "10-14": { en: "Children's Day", ur: "یوم اطفال" },
    "11-1": { en: "World AIDS Day", ur: "ایڈز کا عالمی دن" },
    "11-4": { en: "Indian Navy Day", ur: "انڈین نیوی ڈے" },
    "11-10": { en: "Human Rights Day", ur: "انسانی حقوق کا دن" },
    "11-23": { en: "Kisan Diwas", ur: "کسان دیوس" },
    "11-25": { en: "Christmas", ur: "کرسمس" }
};

// Simplified moveable festivals for common years (2024-2027)
const moveableFestivals = {
    // 2024
    "2024-2-8": { en: "Maha Shivaratri", ur: "مہا شیوراتری" },
    "2024-2-24": { en: "Holi", ur: "ہولی" },
    "2024-3-16": { en: "Ram Navami", ur: "رام نومی" },
    "2024-3-20": { en: "Mahavir Jayanti", ur: "مہاویر جینتی" },
    "2024-3-28": { en: "Good Friday", ur: "گڈ فرائیڈے" },
    "2024-7-18": { en: "Raksha Bandhan", ur: "رکشا بندھن" },
    "2024-7-25": { en: "Janmashtami", ur: "جنم اشٹمی" },
    "2024-8-6": { en: "Ganesh Chaturthi", ur: "گنیش چترتھی" },
    "2024-9-11": { en: "Dussehra", ur: "دشہرہ" },
    "2024-9-31": { en: "Diwali", ur: "دیوالی" },
    "2024-10-14": { en: "Guru Nanak Jayanti", ur: "گرو نانک جینتی" },

    // 2025
    "2025-1-26": { en: "Maha Shivaratri", ur: "مہا شیوراتری" },
    "2025-2-13": { en: "Holi", ur: "ہولی" },
    "2025-3-5": { en: "Ram Navami", ur: "رام نومی" },
    "2025-3-9": { en: "Mahavir Jayanti", ur: "مہاویر جینتی" },
    "2025-3-17": { en: "Good Friday", ur: "گڈ فرائیڈے" },
    "2025-7-8": { en: "Raksha Bandhan", ur: "رکشا بندھن" },
    "2025-7-15": { en: "Janmashtami", ur: "جنم اشٹمی" },
    "2025-7-26": { en: "Ganesh Chaturthi", ur: "گنیش چترتھی" },
    "2025-9-1": { en: "Dussehra", ur: "دشہرہ" },
    "2025-9-20": { en: "Diwali", ur: "دیوالی" },
    "2025-10-4": { en: "Guru Nanak Jayanti", ur: "گرو نانک جینتی" },

    // 2026
    "2026-1-15": { en: "Maha Shivaratri", ur: "مہا شیوراتری" },
    "2026-2-3": { en: "Holi", ur: "ہولی" },
    "2026-2-26": { en: "Ram Navami", ur: "رام نومی" },
    "2026-2-30": { en: "Mahavir Jayanti", ur: "مہاویر جینتی" },
    "2026-3-3": { en: "Good Friday", ur: "گڈ فرائیڈے" },
    "2026-7-28": { en: "Raksha Bandhan", ur: "رکشا بندھن" },
    "2026-8-4": { en: "Janmashtami", ur: "جنم اشٹمی" },
    "2026-8-15": { en: "Ganesh Chaturthi", ur: "گنیش چترتھی" },
    "2026-9-20": { en: "Dussehra", ur: "دشہرہ" },
    "2026-10-8": { en: "Diwali", ur: "دیوالی" },
    "2026-10-24": { en: "Guru Nanak Jayanti", ur: "گرو نانک جینتی" },
};
// Note: Month index in moveableFestivals keys is 0-based for JS compatibility.
// E.g. 2024-2-25 is March 25, 2024.

// Initialize selectors
function initSelectors() {
    // Populate months
    translations.en.months.forEach((m, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = m;
        monthSelect.appendChild(opt);
    });

    // Populate years (1950 to 2050)
    for (let y = 1950; y <= 2050; y++) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        yearSelect.appendChild(opt);
    }

    monthSelect.value = currentViewDate.getMonth();
    yearSelect.value = currentViewDate.getFullYear();
}

function updateCalendar() {
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();

    // Update Header Text
    const monthName = translations[currentLang].months[month];
    displayMonthYear.textContent = `${monthName} ${year}`;
    monthSelect.value = month;
    yearSelect.value = year;

    // Update Weekdays
    weekdayGrid.innerHTML = '';
    translations[currentLang].weekdays.forEach(day => {
        const div = document.createElement('div');
        div.textContent = day;
        weekdayGrid.appendChild(div);
    });

    // Generate Days
    daysGrid.innerHTML = '';
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Empty cells for previous month
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.classList.add('day-cell', 'empty');
        daysGrid.appendChild(empty);
    }

    const today = new Date();

    for (let d = 1; d <= daysInMonth; d++) {
        const cell = document.createElement('div');
        cell.classList.add('day-cell');

        // Urdu Number Formatting if currentLang is ur
        cell.textContent = currentLang === 'ur' ? d.toLocaleString('ar-SA') : d;

        if (year === today.getFullYear() && month === today.getMonth() && d === today.getDate()) {
            cell.classList.add('today');
        }

        if (year === selectedDate.getFullYear() && month === selectedDate.getMonth() && d === selectedDate.getDate()) {
            cell.classList.add('selected');
        }

        // Task dot
        const dateKey = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
        if (tasksCache[dateKey] && tasksCache[dateKey].length > 0) {
            const dot = document.createElement('div');
            dot.classList.add('task-dot');
            cell.appendChild(dot);
        }

        // Festival check for highlight
        const fest = getFestivalForDate(new Date(year, month, d));
        if (fest) {
            cell.classList.add('is-festival');
        }

        cell.addEventListener('click', () => {
            selectedDate = new Date(year, month, d);
            updateSideInfo();
            updateCalendar(); // To refresh 'selected' class
        });

        daysGrid.appendChild(cell);
    }
}

function getFestivalForDate(date) {
    const month = date.getMonth();
    const day = date.getDate();
    const year = date.getFullYear();
    const key = `${month}-${day}`;
    const moveKey = `${year}-${month}-${day}`;

    // Priority 1: Fixed
    if (fixedFestivals[key]) return fixedFestivals[key];

    // Priority 2: Moveable (Calculated or Hardcoded)
    if (moveableFestivals[moveKey]) return moveableFestivals[moveKey];

    // Priority 3: Hijri Festivals (Dynamic)
    const jd = Math.floor(date.getTime() / 86400000) + 2440587.5;
    const hj = calculateHijri(jd + 0.5); // Added 0.5 to shift 1 day forward (aligns Eid 2026 with March 20)

    // 1 Muharram: Islamic New Year
    if (hj.m === 1 && hj.d === 1) return { en: "Islamic New Year", ur: "نیا اسلامی سال" };
    // 10 Muharram: Ashura
    if (hj.m === 1 && hj.d === 10) return { en: "Ashura", ur: "عاشورا" };
    // 20 Safar: Arba'een
    if (hj.m === 2 && hj.d === 20) return { en: "Arba'een", ur: "اربعین / چہلم" };
    // 12 Rabi' al-awwal: Eid-e-Milad un Nabi
    if (hj.m === 3 && hj.d === 12) return { en: "Eid-e-Milad un Nabi", ur: "عید میلاد النبی" };
    // 11 Rabi' al-Thani: Ghyarvi Sharif
    if (hj.m === 4 && hj.d === 11) return { en: "Ghyarvi Sharif", ur: "گیارہویں شریف" };
    // 27 Rajab: Laylat al-Miraj
    if (hj.m === 7 && hj.d === 27) return { en: "Laylat al-Miraj", ur: "شب معراج" };
    // 15 Sha'ban: Shab-e-Barat
    if (hj.m === 8 && hj.d === 15) return { en: "Shab-e-Barat", ur: "شب برات" };
    // 1 Ramadan: Start of Ramadan
    if (hj.m === 9 && hj.d === 1) return { en: "Ramadan Start", ur: "آغاز رمضان" };
    // 27 Ramadan: Laylat al-Qadr
    if (hj.m === 9 && hj.d === 27) return { en: "Laylat al-Qadr", ur: "لیلتہ القدر / شب قدر" };
    // 1 Shawwal: Eid al-Fitr
    if (hj.m === 10 && hj.d === 1) return { en: "Eid al-Fitr", ur: "عید الفطر" };
    // 9 Dhu al-Hijjah: Day of Arafah
    if (hj.m === 12 && hj.d === 9) return { en: "Day of Arafah", ur: "یوم عرفہ" };
    // 10 Dhu al-Hijjah: Eid al-Adha
    if (hj.m === 12 && hj.d === 10) return { en: "Eid al-Adha", ur: "عید الاضحی" };
    // 18 Dhu al-Hijjah: Eid-e-Ghadir
    if (hj.m === 12 && hj.d === 18) return { en: "Eid-e-Ghadir", ur: "عید غدیر" };

    return null;
}

// Separate calculation for festival check
function calculateHijri(jd) {
    // Julian Day is usually calculated from noon. For our purposes, we floor it.
    jd = Math.floor(jd) + 0.5;
    let l = jd - 1948440 + 10632;
    let n = Math.floor((l - 1) / 10631);
    l = l - 10631 * n + 354;
    let j = (Math.floor((10985 - l) / 5316)) * (Math.floor((50 * l) / 17719)) + (Math.floor(l / 5670)) * (Math.floor((43 * l) / 15238));
    l = l - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
    let m = Math.floor((24 * l) / 709);
    let d = Math.floor(l - Math.floor((709 * m) / 24));
    let y = 30 * n + j - 30;

    // Correction for 2026 Eid sighting (Algorithm vs Observation)
    // Most algorithms are 1 day apart. We often add a global offset or specific year tweaks.
    // For this specific 100-year app, we'll try to keep it as accurate as possible.
    return { d, m, y };
}

function updateSideInfo() {
    const day = selectedDate.getDay();
    const month = selectedDate.getMonth();
    const date = selectedDate.getDate();
    const year = selectedDate.getFullYear();

    currentDayName.textContent = translations[currentLang].weekdays[day];

    if (currentLang === 'ur') {
        const urDate = date.toLocaleString('ar-SA');
        const urYear = year.toLocaleString('ar-SA').replace(/٬/g, '');
        currentFullDate.textContent = `${urDate} ${translations.ur.months[month]} ${urYear}`;
    } else {
        currentFullDate.textContent = `${translations.en.months[month]} ${date}, ${year}`;
    }

    // Hijri Conversion logic (Simplified Kuwaity Calendar)
    const hj = getHijriDate(selectedDate);
    hijriDateDisplay.textContent = hj;

    // Festival Display
    const fest = getFestivalForDate(selectedDate);
    if (fest) {
        festivalDisplay.classList.add('active');
        festivalDisplay.innerHTML = `
            <span class="fest-label">${currentLang === 'ur' ? 'تہوار' : 'Festival'}</span>
            <span class="festival-name">${fest[currentLang]}</span>
        `;
    } else {
        festivalDisplay.classList.remove('active');
    }

    // Update Prayer Times
    updatePrayerTimes();

    // Update Tasks
    updateTasksList();
}

function updatePrayerTimes() {
    // Basic calculation for Mumbai
    const times = calculatePrayerTimes(selectedDate, MUMBAI_LAT, MUMBAI_LNG, MUMBAI_TZ, currentMadhab);

    // Check for manual overrides in localStorage
    const dateKey = selectedDate.toISOString().split('T')[0];
    const localOverrides = JSON.parse(localStorage.getItem(`prayer_overrides_${dateKey}`) || '{}');

    // UI Update Helper
    const applyTimes = (data) => {
        ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(key => {
            const el = document.getElementById(`time-${key}`);
            el.textContent = data[key] || times[key];
        });
    };

    // First apply local/fallback
    applyTimes(localOverrides);

    // Then try to fetch from Firebase
    if (typeof db !== 'undefined') {
        db.collection("prayer_times").doc(dateKey).get().then((doc) => {
            setCloudStatus('online');
            if (doc.exists) {
                const firebaseOverrides = doc.data();
                // Update local storage to match cloud
                localStorage.setItem(`prayer_overrides_${dateKey}`, JSON.stringify(firebaseOverrides));
                applyTimes(firebaseOverrides);
            }
        }).catch((error) => {
            console.error("Error fetching from Firebase:", error);
            setCloudStatus('error');
        });
    }
}

function calculatePrayerTimes(date, lat, lng, tz, madhab) {
    // Simplified prayer time model for demonstration
    // In a real app, you'd use a more robust mathematical model
    // Here we use a slightly randomized but realistic variation based on day of year
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);

    // Solar declination (approximate)
    const decl = -23.44 * Math.cos((360 / 365) * (dayOfYear + 10) * Math.PI / 180);

    // Equation of time (approximate in minutes)
    const eqt = 9.87 * Math.sin(2 * (360 * (dayOfYear - 81) / 365) * Math.PI / 180)
        - 7.53 * Math.cos((360 * (dayOfYear - 81) / 365) * Math.PI / 180)
        - 1.5 * Math.sin((360 * (dayOfYear - 81) / 365) * Math.PI / 180);

    // Noon time in Mumbai (Standardized)
    let dhuhr = 12 + (4 * (82.5 - lng) - eqt) / 60; // 82.5 is Indian Standard Time longitude

    // Simplified Fajr/Sunrise/Maghrib/Isha offsets based on declination
    const dayLengthFactor = Math.sin(lat * Math.PI / 180) * Math.sin(decl * Math.PI / 180);
    const cosHourAngle = -Math.tan(lat * Math.PI / 180) * Math.tan(decl * Math.PI / 180);
    const hourAngle = Math.acos(Math.max(-1, Math.min(1, cosHourAngle))) * 180 / Math.PI;

    const sunset = dhuhr + (hourAngle / 15);
    const sunrise = dhuhr - (hourAngle / 15);

    // ASR Time calculation (Standard vs Hanafi)
    // Shadow factor: 1 for Standard (Shafai), 2 for Hanafi
    const shadowFactor = (madhab === 'hanafi') ? 2 : 1;
    const asrAngle = Math.atan(shadowFactor + Math.tan(Math.abs(lat - decl) * Math.PI / 180));
    const asrHourAngle = Math.acos((Math.sin(asrAngle) - Math.sin(lat * Math.PI / 180) * Math.sin(decl * Math.PI / 180)) / (Math.cos(lat * Math.PI / 180) * Math.cos(decl * Math.PI / 180))) * 180 / Math.PI;
    const asr = dhuhr + (asrHourAngle / 15);

    // Fajr and Isha (Approximate twilight angles for India)
    const fajrTime = sunrise - 1.15; // Approx 1 hour 10 mins before sunrise
    const ishaTime = sunset + 1.25;  // Approx 1 hour 15 mins after sunset

    const format = (decimalTime) => {
        let h = Math.floor(decimalTime);
        let m = Math.round((decimalTime - h) * 60);
        if (m === 60) { h++; m = 0; }
        const period = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${m.toString().padStart(2, '0')} ${period}`;
    };

    return {
        fajr: format(fajrTime),
        sunrise: format(sunrise),
        dhuhr: format(dhuhr),
        asr: format(asr),
        maghrib: format(sunset),
        isha: format(ishaTime)
    };
}

function getHijriDate(date) {
    // Basic Islamic Calendar calculation
    let jd = Math.floor(date.getTime() / 86400000) + 2440588; // Shifted from 2440587 to 2440588
    let l = jd - 1948440 + 10632;
    let n = Math.floor((l - 1) / 10631);
    l = l - 10631 * n + 354;
    let j = (Math.floor((10985 - l) / 5316)) * (Math.floor((50 * l) / 17719)) + (Math.floor(l / 5670)) * (Math.floor((43 * l) / 15238));
    l = l - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
    let m = Math.floor((24 * l) / 709);
    let d = Math.floor(l - Math.floor((709 * m) / 24));
    let y = 30 * n + j - 30;

    const islamicMonths = [
        "Muharram", "Safar", "Rabi' al-awwal", "Rabi' al-thani",
        "Jumada al-awwal", "Jumada al-thani", "Rajab", "Sha'ban",
        "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"
    ];

    const islamicMonthsUr = [
        "محرم", "صفر", "ربیع الاول", "ربیع الثانی",
        "جمادی الاول", "جمادی الثانی", "رجب", "شعبان",
        "رمضان", "شوال", "ذوالقعدہ", "ذوالحجہ"
    ];

    if (currentLang === 'ur') {
        return `${d.toLocaleString('ar-SA')} ${islamicMonthsUr[m - 1]} ${y.toLocaleString('ar-SA').replace(/٬/g, '')}`;
    }
    return `${d} ${islamicMonths[m - 1]} ${y}`;
}

function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'ur' : 'en';

    // Apply RTL/LTR
    document.body.dir = currentLang === 'ur' ? 'rtl' : 'ltr';
    if (currentLang === 'ur') {
        document.body.classList.add('urdu-text');
    } else {
        document.body.classList.remove('urdu-text');
    }

    // Update UI elements
    mainTitle.textContent = translations[currentLang].title;
    subTitle.textContent = translations[currentLang].subtitle;
    todayBtn.textContent = translations[currentLang].today;
    hijriLabel.textContent = translations[currentLang].hijriLabel;

    // Update Dropdown text for months
    monthSelect.innerHTML = '';
    translations[currentLang].months.forEach((m, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = m;
        monthSelect.appendChild(opt);
    });

    // Update Legend
    document.querySelectorAll('.legend-text').forEach(el => {
        el.textContent = el.getAttribute(`data-${currentLang}`);
    });

    updateCalendar();
    updateSideInfo();
}

// Event Listeners
monthSelect.addEventListener('change', (e) => {
    currentViewDate.setMonth(parseInt(e.target.value));
    updateCalendar();
});

yearSelect.addEventListener('change', (e) => {
    currentViewDate.setFullYear(parseInt(e.target.value));
    updateCalendar();
});

prevBtn.addEventListener('click', () => {
    currentViewDate.setMonth(currentViewDate.getMonth() - 1);
    updateCalendar();
});

nextBtn.addEventListener('click', () => {
    currentViewDate.setMonth(currentViewDate.getMonth() + 1);
    updateCalendar();
});

todayBtn.addEventListener('click', () => {
    selectedDate = new Date();
    currentViewDate = new Date();
    updateCalendar();
    updateSideInfo();
});

langToggle.addEventListener('click', toggleLanguage);

const hanafiBtn = document.getElementById('hanafi-btn');
const shafaiBtn = document.getElementById('shafai-btn');

hanafiBtn.addEventListener('click', () => {
    currentMadhab = 'hanafi';
    hanafiBtn.classList.add('active');
    shafaiBtn.classList.remove('active');
    updatePrayerTimes();
});

shafaiBtn.addEventListener('click', () => {
    currentMadhab = 'shafai';
    shafaiBtn.classList.add('active');
    hanafiBtn.classList.remove('active');
    updatePrayerTimes();
});

const timePickerModal = document.getElementById('time-picker-modal');
const pickerHour = document.getElementById('picker-hour');
const pickerMin = document.getElementById('picker-min');
const pickerPeriod = document.getElementById('picker-period');
const pickerTitle = document.getElementById('picker-title');
const pickerSave = document.getElementById('picker-save');
const pickerCancel = document.getElementById('picker-cancel');

let activeEditKey = null;

// Manual Edits Logic
document.querySelectorAll('.namaz-item strong').forEach(el => {
    el.removeAttribute('contenteditable'); // Disable old method
    el.addEventListener('click', (e) => {
        const key = e.target.getAttribute('data-key');
        const currentTime = e.target.textContent;
        activeEditKey = key;

        // Parse current time to populate picker
        const [timePart, period] = currentTime.split(' ');
        const [h, m] = timePart.split(':');

        pickerHour.value = h.padStart(2, '0');
        pickerMin.value = m.padStart(2, '0');
        pickerPeriod.value = period;
        pickerTitle.textContent = `${key.toUpperCase()} Time`;

        timePickerModal.classList.add('active');
    });
});

pickerSave.addEventListener('click', () => {
    if (!activeEditKey) return;

    const h = pickerHour.value.padStart(2, '0');
    const m = pickerMin.value.padStart(2, '0');
    const p = pickerPeriod.value;
    const finalTime = `${parseInt(h)}:${m} ${p}`;

    const dateKey = selectedDate.toISOString().split('T')[0];
    const overrides = JSON.parse(localStorage.getItem(`prayer_overrides_${dateKey}`) || '{}');
    overrides[activeEditKey] = finalTime;

    // Update Local Storage
    localStorage.setItem(`prayer_overrides_${dateKey}`, JSON.stringify(overrides));

    // Update Firebase
    if (typeof db !== 'undefined') {
        setCloudStatus('offline'); // Set to offline while syncing
        db.collection("prayer_times").doc(dateKey).set(overrides, { merge: true })
            .then(() => {
                console.log("Success syncing with Cloud");
                setCloudStatus('online');
            })
            .catch((err) => {
                console.error("Cloud sync failed", err);
                setCloudStatus('error');
            });
    }

    updatePrayerTimes();
    timePickerModal.classList.remove('active');
});

pickerCancel.addEventListener('click', () => {
    timePickerModal.classList.remove('active');
});

// Pull to Refresh Logic
let startY = 0;
const pullIndicator = document.getElementById('pull-to-refresh');
const THRESHOLD = 150;

window.addEventListener('touchstart', (e) => {
    if (window.scrollY === 0) {
        startY = e.touches[0].pageY;
    }
}, { passive: true });

window.addEventListener('touchmove', (e) => {
    if (window.scrollY === 0 && startY > 0) {
        const currentY = e.touches[0].pageY;
        const diff = currentY - startY;

        if (diff > 0) {
            const translate = Math.min(diff, THRESHOLD);
            pullIndicator.style.transform = `translateY(${translate}px)`;

            if (diff >= THRESHOLD) {
                pullIndicator.querySelector('span').textContent = "Release to refresh";
            } else {
                pullIndicator.querySelector('span').textContent = "Pull to refresh";
            }
        }
    }
}, { passive: true });

window.addEventListener('touchend', (e) => {
    const endY = e.changedTouches[0].pageY;
    const diff = endY - startY;

    if (window.scrollY === 0 && diff >= THRESHOLD) {
        pullIndicator.querySelector('span').textContent = "Refreshing...";
        window.location.reload();
    } else {
        pullIndicator.style.transform = `translateY(0)`;
    }
    startY = 0;
});

function updateTasksList() {
    const dateKey = selectedDate.toISOString().split('T')[0];
    const monthIndex = selectedDate.getMonth();
    const day = selectedDate.getDate();
    const tasksTitle = document.getElementById('tasks-title');
    const tasksList = document.getElementById('tasks-list');

    if (tasksTitle) {
        const monthName = translations[currentLang].months[monthIndex];
        tasksTitle.textContent = currentLang === 'ur' ? `${monthName} ${day} کے کام` : `Tasks for ${monthName} ${day}`;
    }

    const tasks = tasksCache[dateKey] || [];
    if (tasksList) {
        tasksList.innerHTML = '';
        if (tasks.length === 0) {
            tasksList.innerHTML = `<p class="no-tasks">${currentLang === 'ur' ? 'آج کوئی کام نہیں ہے۔' : 'No tasks for this day.'}</p>`;
            return;
        }
        tasks.forEach((task, index) => {
            const item = document.createElement('div');
            item.className = 'task-item';
            item.innerHTML = `
                <span class="task-text">${task}</span>
                <span class="task-delete" onclick="deleteTask(${index})">🗑️</span>
            `;
            tasksList.appendChild(item);
        });
    }
}

if (addTaskTrigger) {
    addTaskTrigger.addEventListener('click', () => {
        if (taskInput) taskInput.value = '';
        if (taskModal) taskModal.classList.add('active');
        if (taskInput) taskInput.focus();
    });
}

if (taskCancel) {
    taskCancel.addEventListener('click', () => {
        if (taskModal) taskModal.classList.remove('active');
    });
}

if (taskSave) {
    taskSave.addEventListener('click', () => {
        const text = taskInput ? taskInput.value.trim() : '';
        if (!text) return;

        const dateKey = selectedDate.toISOString().split('T')[0];
        const tasks = tasksCache[dateKey] || [];
        tasks.push(text);

        if (typeof db !== 'undefined') {
            setCloudStatus('offline');
            db.collection("calendar_tasks").doc(dateKey).set({ tasks: tasks })
                .then(() => {
                    setCloudStatus('online');
                    if (taskModal) taskModal.classList.remove('active');
                })
                .catch(err => {
                    console.error("Task sync failed", err);
                    setCloudStatus('error');
                });
        }
    });
}

window.deleteTask = function (index) {
    const dateKey = selectedDate.toISOString().split('T')[0];
    const tasks = tasksCache[dateKey] || [];
    tasks.splice(index, 1);

    if (typeof db !== 'undefined') {
        setCloudStatus('offline');
        db.collection("calendar_tasks").doc(dateKey).set({ tasks: tasks })
            .then(() => setCloudStatus('online'))
            .catch(err => {
                console.error("Task delete failed", err);
                setCloudStatus('error');
            });
    }
};

// Initialize
initSelectors();
updateCalendar();
updateSideInfo();
updatePrayerTimes();
