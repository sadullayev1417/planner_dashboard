/**
 * Planner & Finance Dashboard (Google Sheets Style)
 * Synchronized with CSV files & LocalStorage
 */

const PlannerApp = {
  // State
  tasks: [],
  habits: [],
  finances: [],
  subscriptions: [],
  goals: [],
  stickyNotes: [],
  budgetLimits: [],
  netWorthAssets: [],
  netWorthLiabilities: [],
  roadmapSteps: [],

  // Focus & Sound state
  pomoTimeLeft: 1500,
  pomoTotalTime: 1500,
  pomoTimerId: null,
  pomoMode: 'pomodoro',
  pomoCompletedSessions: 0,
  soundEnabled: true,
  pipWindow: null,
  pipCanvasStream: null,
  isFloatingCompact: false,

  // Alarms / Budilniklar
  alarms: [],
  activeRingingAlarm: null,
  alarmAudioInterval: null,

  // AI Assistant Chat & NLU State
  aiChatOpen: false,
  agentMemoryOpen: false,
  aiHistory: [],
  aiModelType: 'offline', // 'offline', 'gemini', 'ollama'
  geminiApiKey: '',
  geminiModel: 'gemini-4-argon',
  ollamaUrl: 'http://localhost:11434',
  ollamaModel: 'llama3',
  isVoiceListening: false,
  speechRecognition: null,

  // AI Agent Knowledge Base & Persistent Long-Term Memory
  agentMemory: {
    profile: {
      name: "Foydalanuvchi",
      occupation: "Dasturchi / Mutaxassis",
      wakeTime: "05:00",
      sleepTime: "23:00",
      monthlySavingsGoal: 5000000,
      personalityTone: "coach",
      primaryGoal: "Shaxsiy unumdorlik va moliyaviy barqarorlik"
    },
    learnedFacts: [
      { id: 1, fact: "Ertalab soat 5:00 da uyg'onadi va Bomdod namozi o'qiydi", category: "kun_tartibi", date: "2026-10-21", source: "tizim" },
      { id: 2, fact: "Odatda tushlik va ovqatlanish uchun kuniga 40 000 - 50 000 so'm xarajat qiladi", category: "moliya", date: "2026-10-21", source: "tizim" },
      { id: 3, fact: "Pomodoro fokus vaqti (25 daqiqa) bilan ishlashni ma'qul ko'radi", category: "unumdorlik", date: "2026-10-21", source: "tizim" }
    ],
    coachingHistory: []
  },

  proactiveQuestionsPool: [
    {
      id: "sleep_time",
      key: "sleepTime",
      category: "kun_tartibi",
      question: "🌙 Odatda kechki uyquga soat nechida yotasiz?",
      options: ["22:00 da", "23:00 da", "00:00 da", "01:00 da"]
    },
    {
      id: "wake_routine",
      key: "morning_habit",
      category: "kun_tartibi",
      question: "🌅 Ertalab uyg'onganingizdan so'ng 1-bo'lib nima bilan shug'ullanish sizga eng ko'p energiya beradi?",
      options: ["Badantarbiya / Sport", "Bomdod namozi", "Kitob mutolaasi", "Kofe / Nonushta"]
    },
    {
      id: "savings_ratio",
      key: "savings_ratio",
      category: "moliya",
      question: "💰 Oylik daromadingizning qancha qismini jamg'arma va investitsiyaga ajratishni rejalashtirgansiz?",
      options: ["10% (Boshlang'ich)", "20% (Klassik qoida)", "30% (Kengaytirilgan)", "50% va undan ko'p"]
    },
    {
      id: "focus_time",
      key: "peak_hours",
      category: "unumdorlik",
      question: "⚡ Sizning eng yuqori diqqat va unumdorlik vaqtingiz (Deep Work) qaysi payt?",
      options: ["Ertalab 06:00 - 10:00", "Kunduzi 11:00 - 15:00", "Kechqurun 19:00 - 23:00", "Tunda 00:00 dan keyin"]
    },
    {
      id: "main_goal",
      key: "vision",
      category: "shaxsiy",
      question: "🎯 Hozirgi kunda siz uchun 1-raqamli eng asosiy maqsad yoki orzu nima?",
      options: ["Moliyaviy erkinlik / Daromadni oshirish", "Yangi kasb / Bilim egallash", "Salomatlik va vazn nazorati", "Shaxsiy biznes / Startap"]
    }
  ],
  
  currentDate: new Date(),
  selectedCalendarDate: new Date(2026, 10, 1), // Noyabr 2026 default
  selectedHabitMonth: "Fevral",
  selectedFinMonth: "01",
  selectedFinYear: "2026",
  
  taskFilter: "all",
  habitFrequencyFilter: "all",
  habitRoutineFilter: "all",
  searchQuery: "",
  
  isServerConnected: false,
  charts: {},

  // Months name array in Uzbek
  monthsUz: [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
    "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"
  ],

  // Default initial data if CSV / storage is empty
  defaultTasks: [
    { id: 1, title: "Ertalab kunlik rejani yozish", deadline: "2026-11-20", priority: "‼️ O'ta muhim", status: "✅ Bajarildi", category: "Shaxsiy", note: "Ertalab 08:00 da" },
    { id: 2, title: "Mijoz bn gaplashib olaman, nima qiladi-nima qilmaydi, tushunib olaman", deadline: "2026-11-21", priority: "⚡ O'rtacha muhim", status: "✏️ Jarayonda", category: "Ish", note: "Loyiha talablari" },
    { id: 3, title: "Kontraktni ham yopib tashlayman, bitiramiz shu masalani", deadline: "2026-11-22", priority: "🔥 Muhim", status: "✏️ Jarayonda", category: "Ta'lim", note: "To'lov kvitansiyasi bilan" },
    { id: 4, title: "Arendani to'lab qo'yaman, bosh og'ritmasdan", deadline: "2026-11-23", priority: "🔥 Muhim", status: "✅ Bajarildi", category: "Uy", note: "Kvartira egasiga" },
    { id: 5, title: "Dars materiallariniyam bitta sidirg'asiga tayyorlab qo'yaman", deadline: "2026-11-24", priority: "⚡ O'rtacha muhim", status: "⏳ Kutilmoqda", category: "Ta'lim", note: "Slaydlar va kodlar" },
    { id: 6, title: "Darsni qilib tashlayman, uzog'i 30-40 minut", deadline: "2026-11-25", priority: "⚡ O'rtacha muhim", status: "⏳ Kutilmoqda", category: "Ta'lim", note: "Topshiriqlarni yuklash" }
  ],

  defaultHabits: [
    // 1. KUNLIK ODATLAR (DAILY HABITS)
    { id: 1, title: "📖 Kun rejasini tuzish (5 daqiqa)", month: "Fevral", frequency: "daily", routine: "morning", days: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0], goal: 25 },
    { id: 2, title: "🏋️ Ertalabki mashqlar / badantarbiya", month: "Fevral", frequency: "daily", routine: "morning", days: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0], goal: 20 },
    { id: 3, title: "📚 20 daqiqa kitob mutolaasi", month: "Fevral", frequency: "daily", routine: "evening", days: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0], goal: 18 },
    { id: 4, title: "💼 Fokusli ish (Deep Work 90 daqiqa)", month: "Fevral", frequency: "daily", routine: "day", days: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0], goal: 17 },
    { id: 5, title: "💧 2 litr toza suv ichish", month: "Fevral", frequency: "daily", routine: "day", days: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0], goal: 22 },

    // 2. HAFTALIK ODATLAR (WEEKLY HABITS)
    { id: 6, title: "🏊‍♂️ Sport zal / Suzish (Haftada 3x)", month: "Fevral", frequency: "weekly", routine: "day", days: [0,1,0,1,0,1,0, 0,1,0,1,0,1,0, 0,1,0,1,0,1,0, 0,1,0,1,0,1,0, 0,1,0], goal: 12 },
    { id: 7, title: "📊 Haftalik moliya & hisobot retro (1x)", month: "Fevral", frequency: "weekly", routine: "evening", days: [0,0,0,0,0,0,1, 0,0,0,0,0,0,1, 0,0,0,0,0,0,1, 0,0,0,0,0,0,1, 0,0,0], goal: 4 },
    { id: 8, title: "🧹 Xonani tozalash va tartibga solish", month: "Fevral", frequency: "weekly", routine: "day", days: [0,0,0,0,0,1,0, 0,0,0,0,0,1,0, 0,0,0,0,0,1,0, 0,0,0,0,0,1,0, 0,0,0], goal: 4 },

    // 3. DAVOMIY / OYLIK ODATLAR (RECURRING / MONTHLY HABITS)
    { id: 9, title: "🎯 Oylik maqsadlar va byudjet sarhisobi", month: "Fevral", frequency: "monthly", routine: "evening", days: [1,0,0,0,0,0,0, 0,0,0,0,0,0,0, 0,0,0,0,0,0,0, 0,0,0,0,0,0,0, 0,0,1], goal: 2 },
    { id: 10, title: "💾 Barcha fayllarni to'liq arxivlash (Backup)", month: "Fevral", frequency: "monthly", routine: "day", days: [0,0,0,0,0,0,0, 0,0,0,0,0,0,0, 1,0,0,0,0,0,0, 0,0,0,0,0,0,0, 0,0,0], goal: 1 }
  ],

  defaultFinances: [
    { id: 1, date: "2026-01-05", type: "Xarajat", category: "Mobil Aloqa", amount: 500000, note: "Oylik internet to'lovi" },
    { id: 2, date: "2026-01-08", type: "Xarajat", category: "Kommunalka", amount: 400000, note: "Elektr va gaz" },
    { id: 3, date: "2026-01-10", type: "Xarajat", category: "Benzin", amount: 3500000, note: "Oy boshidagi yonilg'i" },
    { id: 4, date: "2026-01-12", type: "Xarajat", category: "Oila xarajatlari", amount: 8500000, note: "Bozorlik va oziq-ovqat" },
    { id: 5, date: "2026-01-15", type: "Xarajat", category: "Ko'ngilochar va dam olish", amount: 2800000, note: "Dam olish kunlari" },
    { id: 6, date: "2026-01-18", type: "Xarajat", category: "Ta'lim va rivojlanish", amount: 6000000, note: "Kurslar to'lovi" },
    { id: 7, date: "2026-01-02", type: "Tushum", category: "Ko'chmas mulkdan tushum", amount: 12000000, note: "Arenda 1" },
    { id: 8, date: "2026-01-04", type: "Tushum", category: "Investitsiyalar & Jamg'armalar", amount: 40000000, note: "Arenda 2 jamg'armasi" },
    { id: 9, date: "2026-01-10", type: "Tushum", category: "Biznes / Dividendlar", amount: 30000000, note: "Bozor daromadi" },
    { id: 10, date: "2026-01-15", type: "To'lov", category: "Uy-joy", amount: 500000, note: "Ipoteka / to'lov" }
  ],

  defaultSubscriptions: [
    { id: 1, name: "Uy Interneti (Sarkor / Uzonline)", category: "Kommunalka", amount: 180000, dueDay: 5, paid: true },
    { id: 2, name: "Mobil Aloqa & Tarif (Beeline / Ucell)", category: "Mobil Aloqa", amount: 75000, dueDay: 10, paid: true },
    { id: 3, name: "Sport Zal / Fitness Abonement", category: "Salomatlik", amount: 350000, dueDay: 1, paid: false },
    { id: 4, name: "Telegram / Cloud / Xizmatlar", category: "Obuna", amount: 45000, dueDay: 15, paid: false }
  ],

  defaultGoals: [
    { id: 1, title: "English C1 / IELTS 7.5 sertifikatini qo'lga kiritish", category: "Ta'lim", current: 65, target: 100, unit: "%", deadline: "2026-08-01" },
    { id: 2, title: "Jamg'arma fondini 100 mln so'mga yetkazish", category: "Moliya", current: 52, target: 100, unit: "mln UZS", deadline: "2026-12-31" },
    { id: 3, title: "Yangi SaaS yoki Frilans loyihasini to'liq ishga tushirish", category: "Karyera", current: 80, target: 100, unit: "%", deadline: "2026-06-30" },
    { id: 4, title: "Yil davomida 24 ta foydali kitob mutolaa qilish", category: "Shaxsiy", current: 7, target: 24, unit: "ta kitob", deadline: "2026-12-31" }
  ],

  defaultStickyNotes: [
    { id: 1, color: "yellow", content: "📌 Loyiha arxitekturasini soddalashtirish va yangi API endpointlarni optimallashtirish", date: "Bugun, 10:30" },
    { id: 2, color: "green", content: "💡 Goya: Haftalik sarhisobni har yakshanba soat 18:00 da o'tkazish intizomni 2x oshiradi", date: "Kecha, 19:15" },
    { id: 3, color: "blue", content: "⚡ Keyingi oy uchun kommunalka va internet xarajatlarini avtomatik to'lovga sozlash", date: "18-Fevral" },
    { id: 4, color: "pink", content: "🎯 Pomodoro orqali chalg'imasdan ishlash: 50 daqiqa fokus + 10 daqiqa piyoda yurish", date: "16-Fevral" }
  ],

  defaultBudgetLimits: [
    { id: 1, category: "Oila xarajatlari", limit: 10000000 },
    { id: 2, category: "Benzin", limit: 4000000 },
    { id: 3, category: "Ko'ngilochar va dam olish", limit: 3000000 },
    { id: 4, category: "Mobil Aloqa", limit: 600000 },
    { id: 5, category: "Ta'lim va rivojlanish", limit: 7000000 }
  ],

  defaultNetWorthAssets: [
    { id: 1, name: "Asosiy bank kartasi (Ipak Yo'li / Kapital)", category: "Bank hisobi", amount: 18500000 },
    { id: 2, name: "Jamg'arma depoziti (21% yillik)", category: "Omonat", amount: 45000000 },
    { id: 3, name: "Favqulodda naqd zaxira (USD)", category: "Naqd pul", amount: 24000000 },
    { id: 4, name: "Avtomobil / Texnika mulki", category: "Mulk", amount: 95000000 }
  ],

  defaultNetWorthLiabilities: [
    { id: 1, name: "Avtokredit / Qoldiq", category: "Kredit", amount: 22000000 },
    { id: 2, name: "Texnika bo'lib to'lash (Uzum Nasiya)", category: "Rassrochka", amount: 3200000 }
  ],

  defaultRoadmapSteps: [
    { id: 1, title: "1-Qadam: Boshlang'ich Favqulodda Fond", desc: "10-15 mln UZS (kutilmagan zaruriy holatlar uchun birinchi bufer)", status: "done", target: "12,000,000 UZS" },
    { id: 2, title: "2-Qadam: Qarz Qor To'pi (Debt Snowball)", desc: "Barcha mayda qarz va iste'mol kreditlarini kichigidan kattasiga saralab to'liq yopish", status: "done", target: "Barcha qarzlar 0" },
    { id: 3, title: "3-Qadam: To'liq Xavfsizlik Yostig'i (Fully Funded)", desc: "3 oydan 6 oygacha bo'lgan majburiy xarajatlar zaxirasini to'plash", status: "active", target: "3-6 oylik xarajat" },
    { id: 4, title: "4-Qadam: Daromadning 15% ini Investitsiyalash", desc: "Kelajak va nafaqaga aktivlar yaratish (ko'chmas mulk, omonat, biznes)", status: "pending", target: "Oylik 15%" },
    { id: 5, title: "5-Qadam: Katta Maqsadlar & Ta'lim Fondi", desc: "Farzandlar ta'limi va oilaviy kelajak sarmoyasi", status: "pending", target: "Ta'lim kapitali" },
    { id: 6, title: "6-Qadam: Uy-joy / Ipotekani Muddatidan Oldin Yopish", desc: "To'liq o'z uyingizga ega bo'lib, oylik ijara va to'lovlardan ozod bo'lish", status: "pending", target: "100% o'z mulki" },
    { id: 7, title: "7-Qadam: Boylik Orttirish & Saxovat (FIRE)", desc: "Moliyaviy erkinlik, passiv daromad va jamiyatga yordam berish", status: "pending", target: "Moliyaviy Mustaqillik" }
  ],

  // Initialization
  async init() {
    this.initTheme();
    this.initSound();
    this.startLiveClock();
    this.setupEventListeners();
    this.updateCurrentDateDisplay();
    await this.loadAllData();
    this.initPomodoro();
    this.initAlarms();
    this.initAIChat();
    this.renderTabsNav();
    this.renderAllViews();
    this.updateQuickStatsBar();
  },

  // Setup UI Events
  setupEventListeners() {
    // Sheet tabs switching
    document.querySelectorAll('.sheet-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.sheet-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        
        tab.classList.add('active');
        const targetTabId = tab.dataset.tab;
        const targetPane = document.getElementById(targetTabId);
        if (targetPane) targetPane.classList.add('active');

        // Update formula bar simulation
        document.getElementById('formulaInput').value = `=${tab.textContent.trim()}!A1`;
        
        // Re-render chart if switching to habit or finance or dashboard
        if (targetTabId === 'tab-dashboard') this.renderDashboardView();
        if (targetTabId === 'tab-habits') this.renderHabitChart();
        if (targetTabId === 'tab-finance-month') this.renderFinanceCharts();
        if (targetTabId === 'tab-finance-year') this.renderYearFinanceView();
        if (targetTabId === 'tab-finance-roadmap') this.renderRoadmapView();
      });
    });

    // Theme switcher
    const btnTheme = document.getElementById('btnToggleTheme');
    if (btnTheme) {
      btnTheme.addEventListener('click', () => this.toggleTheme());
    }

    // Pomodoro header quick trigger
    const btnPomoHead = document.getElementById('btnHeaderPomodoro');
    if (btnPomoHead) {
      btnPomoHead.addEventListener('click', () => {
        const dashTab = document.querySelector('.sheet-tab[data-tab="tab-dashboard"]');
        if (dashTab) dashTab.click();
        const card = document.getElementById('pomodoroDashboardCard');
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.style.transition = 'box-shadow 0.3s ease';
          card.style.boxShadow = '0 0 0 3px #1a73e8';
          setTimeout(() => { card.style.boxShadow = ''; }, 1500);
        }
      });
    }

    // Sound toggle button
    const btnSound = document.getElementById('btnToggleSound');
    if (btnSound) {
      btnSound.addEventListener('click', () => this.toggleSound());
    }

    // Print button
    const btnPrint = document.getElementById('btnPrintPage');
    if (btnPrint) {
      btnPrint.addEventListener('click', () => window.print());
    }

    // Global Live Search
    const searchInp = document.getElementById('globalSearchInput');
    if (searchInp) {
      searchInp.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderTasksView();
        this.renderHabitsView();
        this.renderFinanceMonthlyView();
      });
    }

    // Task Filter Pills
    document.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.taskFilter = pill.dataset.filter;
        this.renderTasksView();
      });
    });

    // Habit Filter Pills (Frequency & Routine)
    document.querySelectorAll('.habit-filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        if (pill.dataset.freq) {
          document.querySelectorAll('.habit-filter-pill[data-freq]').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          this.habitFrequencyFilter = pill.dataset.freq;
        } else if (pill.dataset.routine) {
          document.querySelectorAll('.habit-filter-pill[data-routine]').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          this.habitRoutineFilter = pill.dataset.routine;
        }
        this.renderHabitsView();
      });
    });

    // Keyboard Shortcuts (Linear / Notion Style)
    window.addEventListener('keydown', (e) => {
      // Ctrl + N: Quick new task
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        const inlineInp = document.getElementById('inlineTaskTitle');
        const quickInp = document.getElementById('quickTaskTitle');
        if (inlineInp && inlineInp.offsetParent !== null) {
          inlineInp.focus();
        } else if (quickInp) {
          quickInp.focus();
        }
      }
      // Ctrl + E: Quick expense
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        const expInp = document.getElementById('quickExpAmount');
        if (expInp) expInp.focus();
      }
      // Ctrl + /: Toggle shortcuts modal
      if ((e.ctrlKey || e.metaKey) && (e.key === '/' || e.key === '?')) {
        e.preventDefault();
        const sm = document.getElementById('shortcutsModal');
        if (sm) sm.classList.toggle('active');
      }
      // Esc: Close any modal
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
      }
      // Alt + A: Toggle AI Assistant Chat
      if (e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        this.toggleAIChat();
      }
      // Alt + 1..7: Switch sheet tabs
      if (e.altKey && !isNaN(e.key) && Number(e.key) >= 1 && Number(e.key) <= 7) {
        e.preventDefault();
        const tabs = document.querySelectorAll('.sheet-tab');
        const idx = Number(e.key) - 1;
        if (tabs[idx]) tabs[idx].click();
      }
    });

    // Shortcuts modal open/close
    const btnShortcuts = document.getElementById('btnShortcutsModal');
    const modalShortcuts = document.getElementById('shortcutsModal');
    const btnCloseShortcuts = document.getElementById('btnCloseShortcutsModal');
    const btnOkShortcuts = document.getElementById('btnOkShortcutsModal');
    if (btnShortcuts && modalShortcuts) {
      btnShortcuts.onclick = () => modalShortcuts.classList.add('active');
    }
    if (btnCloseShortcuts && modalShortcuts) {
      btnCloseShortcuts.onclick = () => modalShortcuts.classList.remove('active');
    }
    if (btnOkShortcuts && modalShortcuts) {
      btnOkShortcuts.onclick = () => modalShortcuts.classList.remove('active');
    }

    // Close modals on clicking overlay backdrop
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });
    });

    // Top buttons
    document.getElementById('btnSaveCsv').addEventListener('click', () => this.saveAllData());
    document.getElementById('btnExportAllCsv').addEventListener('click', () => {
      this.exportCsv('vazifalar');
      this.exportCsv('odatlar');
      this.exportCsv('moliya');
    });

    // Individual download buttons
    document.getElementById('btnDownloadTasksCsv').addEventListener('click', () => this.exportCsv('vazifalar'));
    document.getElementById('btnDownloadHabitsCsv').addEventListener('click', () => this.exportCsv('odatlar'));
    document.getElementById('btnDownloadFinCsv').addEventListener('click', () => this.exportCsv('moliya'));

    // Modal controls for tasks
    document.getElementById('btnOpenAddTask').addEventListener('click', () => {
      document.getElementById('taskInputDeadline').value = new Date().toISOString().split('T')[0];
      document.getElementById('taskModal').classList.add('active');
    });
    document.getElementById('btnCloseTaskModal').addEventListener('click', () => {
      document.getElementById('taskModal').classList.remove('active');
    });
    document.getElementById('btnCancelTaskModal').addEventListener('click', () => {
      document.getElementById('taskModal').classList.remove('active');
    });
    document.getElementById('taskForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.addTaskFromModal();
    });

    // Modal controls for habits
    document.getElementById('btnOpenAddHabit').addEventListener('click', () => {
      document.getElementById('habitModal').classList.add('active');
    });
    document.getElementById('btnCloseHabitModal').addEventListener('click', () => {
      document.getElementById('habitModal').classList.remove('active');
    });
    document.getElementById('btnCancelHabitModal').addEventListener('click', () => {
      document.getElementById('habitModal').classList.remove('active');
    });
    document.getElementById('habitForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.addHabitFromModal();
    });

    // Calendar navigation
    document.getElementById('btnPrevMonth').addEventListener('click', () => {
      this.selectedCalendarDate.setMonth(this.selectedCalendarDate.getMonth() - 1);
      this.syncCalendarDropdowns();
      this.renderCalendarView();
    });
    document.getElementById('btnNextMonth').addEventListener('click', () => {
      this.selectedCalendarDate.setMonth(this.selectedCalendarDate.getMonth() + 1);
      this.syncCalendarDropdowns();
      this.renderCalendarView();
    });

    const monthDrop = document.getElementById('calMonthDropdown');
    const yearDrop = document.getElementById('calYearDropdown');
    if (monthDrop && yearDrop) {
      monthDrop.addEventListener('change', (e) => {
        this.selectedCalendarDate.setMonth(parseInt(e.target.value));
        this.renderCalendarView();
      });
      yearDrop.addEventListener('change', (e) => {
        this.selectedCalendarDate.setFullYear(parseInt(e.target.value));
        this.renderCalendarView();
      });
    }

    // Finance forms
    document.getElementById('expenseForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.addExpense();
    });
    document.getElementById('incomeForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.addIncome();
    });

    // Finance filters
    document.getElementById('finMonthSelect').addEventListener('change', (e) => {
      this.selectedFinMonth = e.target.value;
      this.renderFinanceMonthlyView();
    });
    document.getElementById('finYearSelect').addEventListener('change', (e) => {
      this.selectedFinYear = e.target.value;
      this.renderFinanceMonthlyView();
      this.renderYearFinanceView();
    });

    const rateInp = document.getElementById('usdRateInput');
    if (rateInp) {
      const savedRate = localStorage.getItem('planner_usd_rate');
      if (savedRate) rateInp.value = savedRate;
      else rateInp.value = 12035;

      rateInp.addEventListener('input', (e) => {
        const val = Number(e.target.value) || 12035;
        localStorage.setItem('planner_usd_rate', val);
        this.renderFinanceMonthlyView();
      });
    }

    // CSV Imports
    const inTasks = document.getElementById('importTasksInput');
    const inHabits = document.getElementById('importHabitsInput');
    const inFin = document.getElementById('importFinInput');
    const inSub = document.getElementById('importSubInput');

    if (inTasks) inTasks.addEventListener('change', (e) => this.importCsvFile(e, 'vazifalar'));
    if (inHabits) inHabits.addEventListener('change', (e) => this.importCsvFile(e, 'odatlar'));
    if (inFin) inFin.addEventListener('change', (e) => this.importCsvFile(e, 'moliya'));
    if (inSub) inSub.addEventListener('change', (e) => this.importCsvFile(e, 'obunalar'));

    const btnForce = document.getElementById('btnForceSaveAll');
    if (btnForce) btnForce.addEventListener('click', () => this.saveAllData());

    const btnReset = document.getElementById('btnResetDemoData');
    if (btnReset) {
      btnReset.addEventListener('click', () => this.resetDemoData());
    }

    // Set today date on form inputs
    const todayStr = new Date().toISOString().split('T')[0];
    if (document.getElementById('expDate')) document.getElementById('expDate').value = todayStr;
    if (document.getElementById('incDate')) document.getElementById('incDate').value = todayStr;
  },

  // Theme Management
  initTheme() {
    const savedTheme = localStorage.getItem('planner_theme') || 'light';
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-theme');
      const txt = document.getElementById('themeToggleText');
      if (txt) txt.textContent = 'Kun';
    }
  },

  toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('planner_theme', isDark ? 'dark' : 'light');
    const txt = document.getElementById('themeToggleText');
    if (txt) txt.textContent = isDark ? 'Kun' : 'Tun';
  },

  // Live Clock (Tashkent Time)
  startLiveClock() {
    const updateTime = () => {
      const now = new Date();
      const el = document.getElementById('liveClock');
      if (el) {
        el.textContent = now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
    };
    updateTime();
    setInterval(updateTime, 1000);
  },

  // Calculate Habit Streak
  calculateStreak(days) {
    if (!days || !days.length) return 0;
    let streak = 0;
    // Walk backwards from current day of month or last day
    const curDayIdx = Math.min(new Date().getDate() - 1, days.length - 1);
    for (let i = curDayIdx; i >= 0; i--) {
      if (days[i] === 1) streak++;
      else break;
    }
    return streak;
  },

  // Quick Stats in Formula Bar
  updateQuickStatsBar() {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTasks = this.tasks.filter(t => t.deadline === todayStr && !t.status.includes('Bajarildi')).length;
    const statTodayEl = document.getElementById('statTodayTasks');
    if (statTodayEl) statTodayEl.textContent = todayTasks;

    // Best streak across habits
    let bestStreak = 0;
    this.habits.forEach(h => {
      const st = this.calculateStreak(h.days);
      if (st > bestStreak) bestStreak = st;
    });
    const statStreakEl = document.getElementById('statBestStreak');
    if (statStreakEl) statStreakEl.textContent = `${bestStreak} kun`;

    // Quick Month Balance
    let inc = 0, exp = 0;
    const curYear = this.selectedFinYear;
    const curMonth = this.selectedFinMonth;
    this.finances.forEach(f => {
      if (f.date && f.date.startsWith(`${curYear}-${curMonth}`)) {
        if (f.type === 'Tushum') inc += (Number(f.amount) || 0);
        else exp += (Number(f.amount) || 0);
      }
    });
    const statBalEl = document.getElementById('statQuickBalance');
    if (statBalEl) statBalEl.textContent = `${(inc - exp).toLocaleString('uz-UZ')} UZS`;
  },

  updateCurrentDateDisplay() {
    const days = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
    const d = this.currentDate;
    const dayName = days[d.getDay()];
    const monthName = this.monthsUz[d.getMonth()];
    const text = `${dayName}, ${d.getDate()}-${monthName} ${d.getFullYear()}`;
    const el = document.getElementById('currentFullDateText');
    if (el) el.textContent = text;
    const calEl = document.getElementById('calTodayBannerText');
    if (calEl) calEl.textContent = text;
  },

  renderTabsNav() {
    // Habit months selector buttons
    const container = document.getElementById('habitMonthsSelector');
    if (!container) return;
    container.innerHTML = '';
    this.monthsUz.forEach(m => {
      const btn = document.createElement('button');
      btn.className = `btn btn-secondary ${m === this.selectedHabitMonth ? 'btn-primary' : ''}`;
      btn.style.padding = '2px 8px';
      btn.style.fontSize = '11px';
      btn.textContent = m;
      btn.onclick = () => {
        this.selectedHabitMonth = m;
        document.getElementById('habitSelectedMonthName').textContent = m;
        this.renderTabsNav();
        this.renderHabitsView();
      };
      container.appendChild(btn);
    });
  },

  // ========================================================
  // DATA STORAGE & CSV ENGINE
  // ========================================================
  async loadAllData() {
    this.setSyncStatus("Yuklanmoqda...", true);
    try {
      // Check if backend API is available
      const testRes = await fetch('/api/data?type=vazifalar');
      if (testRes.ok) {
        this.isServerConnected = true;
        const tasksCsv = await testRes.text();
        this.tasks = this.parseTasksCsv(tasksCsv);

        const habitsRes = await fetch('/api/data?type=odatlar');
        if (habitsRes.ok) this.habits = this.parseHabitsCsv(await habitsRes.text());
        this.sanitizeHabits();
        this.sanitizeTasks();

        const finRes = await fetch('/api/data?type=moliya');
        if (finRes.ok) this.finances = this.parseFinancesCsv(await finRes.text());

        const subRes = await fetch('/api/data?type=obunalar');
        if (subRes.ok) {
          this.subscriptions = this.parseSubscriptionsCsv(await subRes.text());
        } else {
          const localSub = localStorage.getItem('planner_subscriptions');
          this.subscriptions = localSub ? JSON.parse(localSub) : JSON.parse(JSON.stringify(this.defaultSubscriptions));
        }

        const localGoals = localStorage.getItem('planner_goals');
        const localSticky = localStorage.getItem('planner_sticky_notes');
        const localLimits = localStorage.getItem('planner_budget_limits');
        const localAssets = localStorage.getItem('planner_nw_assets');
        const localLiab = localStorage.getItem('planner_nw_liab');
        const localRoadmap = localStorage.getItem('planner_roadmap_steps');
        const localAlarms = localStorage.getItem('planner_alarms');

        this.goals = localGoals ? JSON.parse(localGoals) : JSON.parse(JSON.stringify(this.defaultGoals));
        this.stickyNotes = localSticky ? JSON.parse(localSticky) : JSON.parse(JSON.stringify(this.defaultStickyNotes));
        this.budgetLimits = localLimits ? JSON.parse(localLimits) : JSON.parse(JSON.stringify(this.defaultBudgetLimits));
        this.netWorthAssets = localAssets ? JSON.parse(localAssets) : JSON.parse(JSON.stringify(this.defaultNetWorthAssets));
        this.netWorthLiabilities = localLiab ? JSON.parse(localLiab) : JSON.parse(JSON.stringify(this.defaultNetWorthLiabilities));
        this.roadmapSteps = localRoadmap ? JSON.parse(localRoadmap) : JSON.parse(JSON.stringify(this.defaultRoadmapSteps));
        this.alarms = localAlarms ? JSON.parse(localAlarms) : [];

        await this.loadAgentMemory();

        this.setSyncStatus("Server CSV bilan ulangan", false);
        document.getElementById('settingsSyncStatus').textContent = "🟢 Standart Python Server (data/*.csv fayllari)";
        return;
      }
    } catch (e) {
      this.isServerConnected = false;
    }

    // Fallback: LocalStorage
    const hasInit = localStorage.getItem('planner_initialized');
    if (!hasInit) {
      this.tasks = JSON.parse(JSON.stringify(this.defaultTasks));
      this.habits = JSON.parse(JSON.stringify(this.defaultHabits));
      this.finances = JSON.parse(JSON.stringify(this.defaultFinances));
      this.subscriptions = JSON.parse(JSON.stringify(this.defaultSubscriptions));
      this.goals = JSON.parse(JSON.stringify(this.defaultGoals));
      this.stickyNotes = JSON.parse(JSON.stringify(this.defaultStickyNotes));
      this.budgetLimits = JSON.parse(JSON.stringify(this.defaultBudgetLimits));
      this.netWorthAssets = JSON.parse(JSON.stringify(this.defaultNetWorthAssets));
      this.netWorthLiabilities = JSON.parse(JSON.stringify(this.defaultNetWorthLiabilities));
      this.roadmapSteps = JSON.parse(JSON.stringify(this.defaultRoadmapSteps));
      localStorage.setItem('planner_initialized', 'true');
      this.saveAllData();
    } else {
      const localTasks = localStorage.getItem('planner_tasks');
      const localHabits = localStorage.getItem('planner_habits');
      const localFin = localStorage.getItem('planner_finances');
      const localSub = localStorage.getItem('planner_subscriptions');
      const localGoals = localStorage.getItem('planner_goals');
      const localSticky = localStorage.getItem('planner_sticky_notes');
      const localLimits = localStorage.getItem('planner_budget_limits');
      const localAssets = localStorage.getItem('planner_nw_assets');
      const localLiab = localStorage.getItem('planner_nw_liab');
      const localRoadmap = localStorage.getItem('planner_roadmap_steps');
      const localAlarms = localStorage.getItem('planner_alarms');

      this.tasks = localTasks ? JSON.parse(localTasks) : [];
      this.habits = localHabits ? JSON.parse(localHabits) : [];
      this.finances = localFin ? JSON.parse(localFin) : [];
      this.subscriptions = localSub ? JSON.parse(localSub) : JSON.parse(JSON.stringify(this.defaultSubscriptions));
      this.goals = localGoals ? JSON.parse(localGoals) : JSON.parse(JSON.stringify(this.defaultGoals));
      this.stickyNotes = localSticky ? JSON.parse(localSticky) : JSON.parse(JSON.stringify(this.defaultStickyNotes));
      this.budgetLimits = localLimits ? JSON.parse(localLimits) : JSON.parse(JSON.stringify(this.defaultBudgetLimits));
      this.netWorthAssets = localAssets ? JSON.parse(localAssets) : JSON.parse(JSON.stringify(this.defaultNetWorthAssets));
      this.netWorthLiabilities = localLiab ? JSON.parse(localLiab) : JSON.parse(JSON.stringify(this.defaultNetWorthLiabilities));
      this.roadmapSteps = localRoadmap ? JSON.parse(localRoadmap) : JSON.parse(JSON.stringify(this.defaultRoadmapSteps));
      this.alarms = localAlarms ? JSON.parse(localAlarms) : [];
      this.sanitizeHabits();
      this.sanitizeTasks();
    }

    await this.loadAgentMemory();

    this.setSyncStatus("Lokal xotira (CSV eksport tayyor)", false);
    document.getElementById('settingsSyncStatus').textContent = "🟡 Brauzer xotirasi (CSV fayllarni yuklab olishingiz mumkin)";
  },

  sanitizeHabits() {
    if (!this.habits) this.habits = [];
    const cleanList = [];
    const prayerHabits = [
      { name: "🕌 Bomdod namozi (05:40)", key: "bomdod", routine: "morning" },
      { name: "🕌 Peshin namozi (12:45)", key: "peshin", routine: "day" },
      { name: "🕌 Asr namozi (16:15)", key: "asr", routine: "day" },
      { name: "🕌 Shom namozi (18:15)", key: "shom", routine: "evening" },
      { name: "🕌 Xufton namozi (19:45)", key: "xufton", routine: "evening" }
    ];
    const seenPrayerKeys = new Set();

    for (const h of this.habits) {
      if (!h || !h.title) continue;
      let title = h.title.trim();
      const lower = title.toLowerCase();

      // Drop dirty conversational sentences or old generic prayer lumps
      const isGenericPrayerLump = 
        lower.includes('5 mahal') || 
        lower.includes('5-mahal') || 
        lower.includes('besh mahal') ||
        (lower.includes('namoz') && !['bomdod', 'peshin', 'asr', 'shom', 'xufton'].some(k => lower.includes(k)));

      if (
        lower.includes('qo\'shdingmi') || 
        lower.includes('yoki qo\'shdingmi') || 
        lower.includes('men 5 mahal namoz o\'qiyman') || 
        lower.includes('qo\'sh\'ga') ||
        lower.includes('qo\'sh ga') || 
        lower.includes('qo\'sh xorazm') ||
        isGenericPrayerLump ||
        lower.length < 3
      ) {
        continue;
      }

      // Check if it's one of the 5 prayers
      let matchedPrayer = null;
      for (const p of prayerHabits) {
        if (lower.includes(p.key)) {
          matchedPrayer = p;
          break;
        }
      }

      if (matchedPrayer) {
        if (!seenPrayerKeys.has(matchedPrayer.key)) {
          seenPrayerKeys.add(matchedPrayer.key);
          h.title = matchedPrayer.name;
          h.routine = matchedPrayer.routine;
          h.frequency = "daily";
          cleanList.push(h);
        }
        continue;
      }

      // Check if duplicate of an existing title
      const norm = lower.replace(/[^\w\s]/gi, '').trim();
      const already = cleanList.some(item => item.title.toLowerCase().replace(/[^\w\s]/gi, '').trim() === norm);
      if (!already) {
        cleanList.push(h);
      }
    }

    // Ensure all 5 individual prayer habits exist
    for (const p of prayerHabits) {
      if (!seenPrayerKeys.has(p.key)) {
        cleanList.push({
          id: Date.now() + Math.floor(Math.random() * 1000),
          title: p.name,
          month: this.selectedHabitMonth || "Fevral",
          days: new Array(31).fill(0),
          goal: 30,
          frequency: "daily",
          routine: p.routine
        });
        seenPrayerKeys.add(p.key);
      }
    }

    this.habits = cleanList;
    try {
      localStorage.setItem('planner_habits', JSON.stringify(this.habits));
    } catch(e) {}
  },

  sanitizeTasks() {
    if (!this.tasks) this.tasks = [];
    const cleanTasks = [];
    const prayerTasks = [
      { title: "🕌 Bomdod namozi (05:40)", time: "05:40", note: "Ertalabki farz namozi" },
      { title: "🕌 Peshin namozi (12:45)", time: "12:45", note: "Kunduzgi farz namozi" },
      { title: "🕌 Asr namozi (16:15)", time: "16:15", note: "Asr farz namozi" },
      { title: "🕌 Shom namozi (18:15)", time: "18:15", note: "Shom farz namozi" },
      { title: "🕌 Xufton namozi (19:45)", time: "19:45", note: "Kechki farz namozi" }
    ];
    const seenPrayerKeys = new Set();
    const today = this.getTodayDateStr();

    for (const t of this.tasks) {
      if (!t || !t.title) continue;
      const lower = t.title.toLowerCase();

      // Drop generic prayer lump
      const isGenericPrayerLump = 
        lower.includes('5 mahal') || 
        lower.includes('5-mahal') || 
        lower.includes('besh mahal') ||
        (lower.includes('namoz') && !['bomdod', 'peshin', 'asr', 'shom', 'xufton'].some(k => lower.includes(k)));

      if (isGenericPrayerLump || lower.length < 3) continue;

      let matchedPrayer = null;
      for (const p of prayerTasks) {
        const pKey = p.title.toLowerCase().split(' ')[1];
        if (pKey && lower.includes(pKey)) {
          matchedPrayer = p;
          break;
        }
      }

      if (matchedPrayer) {
        const key = matchedPrayer.title.toLowerCase().split(' ')[1];
        if (!seenPrayerKeys.has(key)) {
          seenPrayerKeys.add(key);
          t.title = matchedPrayer.title;
          t.category = "Ibodat";
          t.priority = "‼️ O'ta muhim";
          cleanTasks.push(t);
        }
        continue;
      }

      cleanTasks.push(t);
    }

    // Ensure all 5 prayer tasks exist for today if any prayer exists
    for (const p of prayerTasks) {
      const key = p.title.toLowerCase().split(' ')[1];
      if (!seenPrayerKeys.has(key)) {
        cleanTasks.push({
          id: Date.now() + Math.floor(Math.random() * 1000),
          title: p.title,
          deadline: today,
          priority: "‼️ O'ta muhim",
          status: "⏳ Jarayonda",
          checked: false,
          category: "Ibodat",
          note: p.note
        });
        seenPrayerKeys.add(key);
      }
    }

    this.tasks = cleanTasks;
    try {
      localStorage.setItem('planner_tasks', JSON.stringify(this.tasks));
    } catch(e) {}
  },

  async saveAllData(silent = false) {
    this.setSyncStatus("Saqlanmoqda...", true);
    localStorage.setItem('planner_initialized', 'true');

    // Save in LocalStorage
    localStorage.setItem('planner_tasks', JSON.stringify(this.tasks));
    localStorage.setItem('planner_habits', JSON.stringify(this.habits));
    localStorage.setItem('planner_finances', JSON.stringify(this.finances));
    localStorage.setItem('planner_subscriptions', JSON.stringify(this.subscriptions));
    localStorage.setItem('planner_goals', JSON.stringify(this.goals || []));
    localStorage.setItem('planner_sticky_notes', JSON.stringify(this.stickyNotes || []));
    localStorage.setItem('planner_budget_limits', JSON.stringify(this.budgetLimits || []));
    localStorage.setItem('planner_nw_assets', JSON.stringify(this.netWorthAssets || []));
    localStorage.setItem('planner_nw_liab', JSON.stringify(this.netWorthLiabilities || []));
    localStorage.setItem('planner_roadmap_steps', JSON.stringify(this.roadmapSteps || []));
    localStorage.setItem('planner_alarms', JSON.stringify(this.alarms || []));

    await this.saveAgentMemory(true);

    // If server connected, write to CSV files directly
    if (this.isServerConnected) {
      try {
        await Promise.all([
          fetch('/api/save?type=vazifalar', { method: 'POST', body: this.generateTasksCsv() }),
          fetch('/api/save?type=odatlar', { method: 'POST', body: this.generateHabitsCsv() }),
          fetch('/api/save?type=moliya', { method: 'POST', body: this.generateFinancesCsv() }),
          fetch('/api/save?type=obunalar', { method: 'POST', body: this.generateSubscriptionsCsv() })
        ]);
        this.setSyncStatus("CSV fayllarga saqlandi", false);
        if (!silent) this.showToast("✓ CSV fayllarga muvaffaqiyatli saqlandi!");
        return;
      } catch (e) {
        console.error("Server save error:", e);
      }
    }

    this.setSyncStatus("Muvaffaqiyatli saqlandi", false);
    if (!silent) this.showToast("✓ O'zgarishlar saqlandi!");
  },

  showToast(message) {
    let toast = document.getElementById('plannerToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'plannerToast';
      toast.style.position = 'fixed';
      toast.style.bottom = '48px';
      toast.style.right = '20px';
      toast.style.background = '#202124';
      toast.style.color = '#ffffff';
      toast.style.padding = '10px 18px';
      toast.style.borderRadius = '8px';
      toast.style.fontSize = '13px';
      toast.style.fontWeight = '500';
      toast.style.boxShadow = '0 6px 16px rgba(0,0,0,0.25)';
      toast.style.zIndex = '99999';
      toast.style.pointerEvents = 'none';
      toast.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
    }, 2500);
  },

  clearAllData() {
    if (confirm("Haqiqatan ham BARCHA ma'lumotlarni butunlay o'chirib, bo'shatmoqchimisiz?")) {
      this.tasks = [];
      this.habits = [];
      this.finances = [];
      this.subscriptions = [];
      this.goals = [];
      this.stickyNotes = [];
      this.budgetLimits = [];
      this.netWorthAssets = [];
      this.netWorthLiabilities = [];
      this.roadmapSteps = [];
      this.saveAllData();
      this.renderAllViews();
      this.showToast("🗑️ Barcha ma'lumotlar tozalandi!");
    }
  },

  resetDemoData() {
    if (confirm("Namunaviy boshlang'ich shablon ma'lumotlarini qayta yuklashni xohlaysizmi?")) {
      this.tasks = JSON.parse(JSON.stringify(this.defaultTasks));
      this.habits = JSON.parse(JSON.stringify(this.defaultHabits));
      this.finances = JSON.parse(JSON.stringify(this.defaultFinances));
      this.subscriptions = JSON.parse(JSON.stringify(this.defaultSubscriptions));
      this.goals = JSON.parse(JSON.stringify(this.defaultGoals));
      this.stickyNotes = JSON.parse(JSON.stringify(this.defaultStickyNotes));
      this.budgetLimits = JSON.parse(JSON.stringify(this.defaultBudgetLimits));
      this.netWorthAssets = JSON.parse(JSON.stringify(this.defaultNetWorthAssets));
      this.netWorthLiabilities = JSON.parse(JSON.stringify(this.defaultNetWorthLiabilities));
      this.roadmapSteps = JSON.parse(JSON.stringify(this.defaultRoadmapSteps));
      this.saveAllData();
      this.renderAllViews();
      this.showToast("🔄 Namunaviy ma'lumotlar qayta yuklandi!");
    }
  },

  // JSON Full Backup & Restore
  exportFullBackup() {
    const backupData = {
      exportDate: new Date().toISOString(),
      appName: "Vazifalar & Odatlar Planneri | Moliya Rejasi",
      tasks: this.tasks,
      habits: this.habits,
      finances: this.finances,
      subscriptions: this.subscriptions,
      goals: this.goals,
      stickyNotes: this.stickyNotes,
      budgetLimits: this.budgetLimits,
      netWorthAssets: this.netWorthAssets,
      netWorthLiabilities: this.netWorthLiabilities,
      roadmapSteps: this.roadmapSteps
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `planner_backup_${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast("📦 Barcha ma'lumotlar JSON faylga zaxiralandi!");
  },

  importFullBackup(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (Array.isArray(data.tasks)) this.tasks = data.tasks;
        if (Array.isArray(data.habits)) this.habits = data.habits;
        if (Array.isArray(data.finances)) this.finances = data.finances;
        if (Array.isArray(data.subscriptions)) this.subscriptions = data.subscriptions;
        if (Array.isArray(data.goals)) this.goals = data.goals;
        if (Array.isArray(data.stickyNotes)) this.stickyNotes = data.stickyNotes;
        if (Array.isArray(data.budgetLimits)) this.budgetLimits = data.budgetLimits;
        if (Array.isArray(data.netWorthAssets)) this.netWorthAssets = data.netWorthAssets;
        if (Array.isArray(data.netWorthLiabilities)) this.netWorthLiabilities = data.netWorthLiabilities;
        if (Array.isArray(data.roadmapSteps)) this.roadmapSteps = data.roadmapSteps;
        
        await this.saveAllData();
        this.renderAllViews();
        this.showToast("✓ Zaxiradan ma'lumotlar to'liq muvaffaqiyatli tiklandi!");
      } catch (err) {
        this.showToast("⚠️ Xatolik: Zaxira faylini o'qib bo'lmadi! Noto'g'ri JSON formati.");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  },

  setSyncStatus(msg, isSyncing) {
    const el = document.getElementById('syncStatus');
    const textEl = document.getElementById('syncStatusText');
    if (!el || !textEl) return;
    textEl.textContent = msg;
    if (isSyncing) {
      el.classList.add('syncing');
    } else {
      el.classList.remove('syncing');
    }
  },

  // CSV Parsers
  parseCsvLines(csvText) {
    const lines = [];
    let row = [""];
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
      const c = csvText[i];
      const next = csvText[i + 1];

      if (c === '"') {
        if (inQuotes && next === '"') {
          row[row.length - 1] += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        row.push("");
      } else if ((c === '\r' || c === '\n') && !inQuotes) {
        if (c === '\r' && next === '\n') i++;
        lines.push(row);
        row = [""];
      } else {
        row[row.length - 1] += c;
      }
    }
    if (row.length > 1 || row[0] !== "") lines.push(row);
    return lines;
  },

  parseTasksCsv(csvText) {
    if (!csvText || !csvText.trim()) return [];
    const rows = this.parseCsvLines(csvText.trim());
    if (rows.length <= 1) return []; // Only header exists, meaning user deleted all tasks
    const result = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r[1] && !r[0]) continue;
      result.push({
        id: Number(r[0]) || (i + 1),
        title: r[1] || "",
        deadline: r[2] || "",
        priority: r[3] || "Oddiy",
        status: r[4] || "⏳ Kutilmoqda",
        category: r[5] || "Shaxsiy",
        note: r[6] || "",
        checked: (r[4] || "").includes('Bajarildi')
      });
    }
    return result;
  },

  parseHabitsCsv(csvText) {
    if (!csvText || !csvText.trim()) return [];
    const rows = this.parseCsvLines(csvText.trim());
    if (rows.length <= 1) return []; // Only header exists, meaning user deleted all habits
    const result = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r[1]) continue;
      const daysArr = (r[3] || "").split(',').map(n => Number(n.trim()) || 0);
      while (daysArr.length < 31) daysArr.push(0);
      result.push({
        id: Number(r[0]) || (i + 1),
        title: r[1] || "",
        month: r[2] || "Fevral",
        days: daysArr.slice(0, 31),
        goal: Number(r[4]) || 20,
        frequency: r[5] || "daily",
        routine: r[6] || "anytime"
      });
    }
    return result;
  },

  parseFinancesCsv(csvText) {
    if (!csvText || !csvText.trim()) return [];
    const rows = this.parseCsvLines(csvText.trim());
    if (rows.length <= 1) return []; // Only header exists, meaning user deleted all transactions
    const result = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r[1] && !r[3] && !r[4]) continue;
      result.push({
        id: Number(r[0]) || (i + 1),
        date: r[1] || "",
        type: r[2] || "Xarajat",
        category: r[3] || "Boshqa",
        amount: Number(r[4]) || 0,
        note: r[5] || ""
      });
    }
    return result;
  },

  parseSubscriptionsCsv(csvText) {
    if (!csvText || !csvText.trim()) return [];
    const rows = this.parseCsvLines(csvText.trim());
    if (rows.length <= 1) return [];
    const result = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r[1]) continue;
      result.push({
        id: Number(r[0]) || (i + 1),
        name: r[1] || "",
        category: r[2] || "Boshqa",
        amount: Number(r[3]) || 0,
        dueDay: Number(r[4]) || 1,
        paid: (r[5] || "").toLowerCase() === 'true' || (r[5] || "").includes('to\'langan') || (r[5] || "").includes('ha')
      });
    }
    return result;
  },

  // CSV Generators
  generateTasksCsv() {
    let csv = "ID,Vazifa nomi,Muddati,Prioritet,Status,Kategoriya,Izoh\n";
    this.tasks.forEach(t => {
      const esc = (txt) => `"${(txt || '').toString().replace(/"/g, '""')}"`;
      csv += `${t.id},${esc(t.title)},${esc(t.deadline)},${esc(t.priority)},${esc(t.status)},${esc(t.category)},${esc(t.note)}\n`;
    });
    return csv;
  },

  generateHabitsCsv() {
    let csv = "ID,Odat nomi,Oy,Kunlar,Maqsad,Chastotalik,Kun_tartibi\n";
    this.habits.forEach(h => {
      const esc = (txt) => `"${(txt || '').toString().replace(/"/g, '""')}"`;
      const daysStr = (h.days || []).join(',');
      csv += `${h.id},${esc(h.title)},${esc(h.month)},${esc(daysStr)},${h.goal || 20},${esc(h.frequency || 'daily')},${esc(h.routine || 'anytime')}\n`;
    });
    return csv;
  },

  generateFinancesCsv() {
    let csv = "ID,Sana,Turi,Kategoriya,Summa,Izoh\n";
    this.finances.forEach(f => {
      const esc = (txt) => `"${(txt || '').toString().replace(/"/g, '""')}"`;
      csv += `${f.id},${esc(f.date)},${esc(f.type)},${esc(f.category)},${f.amount},${esc(f.note)}\n`;
    });
    return csv;
  },

  generateSubscriptionsCsv() {
    let csv = "ID,Nomi,Kategoriya,Summa,Kuni,Holati\n";
    this.subscriptions.forEach(s => {
      const esc = (txt) => `"${(txt || '').toString().replace(/"/g, '""')}"`;
      csv += `${s.id},${esc(s.name)},${esc(s.category)},${s.amount},${s.dueDay},${s.paid}\n`;
    });
    return csv;
  },

  exportCsv(type) {
    let content = "";
    let filename = `${type}.csv`;
    if (type === 'vazifalar') content = this.generateTasksCsv();
    else if (type === 'odatlar') content = this.generateHabitsCsv();
    else if (type === 'moliya') content = this.generateFinancesCsv();
    else if (type === 'obunalar') content = this.generateSubscriptionsCsv();

    const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  importCsvFile(event, type) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      if (type === 'vazifalar') {
        this.tasks = this.parseTasksCsv(text);
        this.renderTasksView();
        this.renderCalendarView();
      } else if (type === 'odatlar') {
        this.habits = this.parseHabitsCsv(text);
        this.renderHabitsView();
      } else if (type === 'moliya') {
        this.finances = this.parseFinancesCsv(text);
        this.renderFinanceMonthlyView();
        this.renderYearFinanceView();
      } else if (type === 'obunalar') {
        this.subscriptions = this.parseSubscriptionsCsv(text);
        this.renderSubscriptionsView();
      }
      this.saveAllData();
      this.showToast(`✓ ${type}.csv muvaffaqiyatli yuklandi!`);
    };
    reader.readAsText(file, "UTF-8");
  },

  // ========================================================
  // RENDER VIEWS
  // ========================================================
  renderAllViews() {
    this.renderDashboardView();
    this.renderTasksView();
    this.renderCalendarView();
    this.renderHabitsView();
    this.renderFinanceMonthlyView();
    this.renderYearFinanceView();
    this.renderRoadmapView();
    if (this.taskViewMode === 'matrix') this.renderMatrixBoard();
    this.updateQuickStatsBar();
  },

  // QUICK ACTIONS (FRICTIONLESS ADD)
  addQuickTask() {
    const titleInp = document.getElementById('quickTaskTitle');
    const dateInp = document.getElementById('quickTaskDate');
    if (!titleInp) return;
    const title = titleInp.value.trim();
    if (!title) return;

    const deadline = (dateInp && dateInp.value) ? dateInp.value : new Date().toISOString().split('T')[0];

    const newTask = {
      id: Date.now(),
      title,
      deadline,
      priority: "🔥 Muhim",
      status: "✏️ Jarayonda",
      category: "Ish",
      note: "",
      checked: false
    };

    this.tasks.push(newTask);
    titleInp.value = '';
    this.renderAllViews();
    this.saveAllData();
  },

  addQuickExpense() {
    const amtInp = document.getElementById('quickExpAmount');
    const catInp = document.getElementById('quickExpCat');
    if (!amtInp) return;
    const amount = Number(amtInp.value) || 0;
    if (!amount) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const newTx = {
      id: Date.now(),
      date: todayStr,
      type: "Xarajat",
      category: (catInp && catInp.value) ? catInp.value : "Boshqa xarajat",
      amount,
      note: "Tezkor xarajat"
    };

    this.finances.push(newTx);
    amtInp.value = '';
    this.renderAllViews();
    this.saveAllData();
  },

  // 0. EXECUTIVE DASHBOARD VIEW (ACTION COCKPIT: TASKS, HABITS, FOCUS & ALARMS)
  renderDashboardView() {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayDayOfMonth = new Date().getDate(); // 1 - 31
    const setTxt = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
    const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    // 1. Task Metrics
    const totalTasks = (this.tasks || []).length;
    let completedTasks = 0;
    (this.tasks || []).forEach(t => {
      if ((t.status && t.status.includes('Bajarildi')) || t.checked) completedTasks++;
    });
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Today's tasks (tasks with deadline today, or without deadline, or overdue pending)
    const todayTasks = (this.tasks || []).filter(t => {
      if (t.deadline === todayStr) return true;
      const isDone = (t.status && t.status.includes('Bajarildi')) || t.checked;
      if (!isDone && (!t.deadline || t.deadline <= todayStr)) return true;
      return false;
    });
    const todayPendingTasks = todayTasks.filter(t => !((t.status && t.status.includes('Bajarildi')) || t.checked));
    const todayPendingCount = todayPendingTasks.length;

    setTxt('dashTodayTasksTotal', `${todayTasks.length} ta`);
    setTxt('dashTodayTasksPendingPill', todayPendingCount === 0 && todayTasks.length > 0 ? "Barchasi bajarildi! 🎉" : `${todayPendingCount} ta kutilmoqda`);

    setTxt('dashTotalCompletedTasks', `${completedTasks} ta`);
    setTxt('dashTaskCompletionRatePill', `${taskCompletionRate}% bajarildi`);

    // 2. Habits Metrics
    const totalHabits = (this.habits || []).length;
    const dayIdx = Math.min(todayDayOfMonth - 1, 30);
    let doneTodayHabits = 0;
    let totalHabitMonthChecks = 0;
    let doneHabitMonthChecks = 0;

    (this.habits || []).forEach(h => {
      if (h.days && h.days[dayIdx] === 1) doneTodayHabits++;
      if (h.days) {
        h.days.forEach(d => {
          totalHabitMonthChecks++;
          if (d === 1) doneHabitMonthChecks++;
        });
      }
    });

    const todayHabitPercent = totalHabits > 0 ? Math.round((doneTodayHabits / totalHabits) * 100) : 0;
    setTxt('dashTodayHabitsRatio', `${doneTodayHabits}/${totalHabits}`);
    setTxt('dashHabitsStreakPill', `${todayHabitPercent}% bajarildi`);

    // 3. Deep Focus & Pomodoro Metrics
    const focusSessions = this.pomoCompletedSessions || 0;
    const focusMinutes = focusSessions * 25;
    setTxt('dashFocusTotalTime', `${focusMinutes} daq`);
    setTxt('dashFocusSessionsPill', `${focusSessions} seans`);

    // 4. Kunlik Hosildorlik Indeksi (Productivity Health Gauge)
    const focusScore = Math.min(100, focusSessions * 25);
    const overallProductivity = Math.round(
      (taskCompletionRate * 0.45) + 
      (todayHabitPercent * 0.35) + 
      (focusScore * 0.20)
    );

    setTxt('dashHealthScoreNumber', `${overallProductivity}%`);
    setTxt('dashTaskHealthVal', `${taskCompletionRate}%`);
    setTxt('dashHabitHealthVal', `${todayHabitPercent}%`);
    setTxt('dashFocusHealthVal', `${focusMinutes} daq`);

    const circleEl = document.getElementById('dashScoreCircle');
    if (circleEl) {
      const angle = Math.round((overallProductivity / 100) * 360);
      circleEl.style.setProperty('--score-angle', `${angle}deg`);
    }

    const descEl = document.getElementById('dashHealthScoreDesc');
    if (descEl) {
      if (overallProductivity >= 80) descEl.textContent = "🌟 Ajoyib natija! Kunlik vazifalar, odatlar va diqqat-fokus intizomi a'lo darajada.";
      else if (overallProductivity >= 50) descEl.textContent = "👍 Yaxshi sur'at. Kutilayotgan vazifalarni yakunlab, intizomni 100% ga yetkazing.";
      else descEl.textContent = "🎯 Rejalashtirilgan ishlarni boshlang va diqqat bilan fokus qaratib, hosildorlikni oshiring!";
    }

    // 5. Column 1: Today's Tasks in Action Center
    const todayTasksList = document.getElementById('dashTodayTasksList');
    if (todayTasksList) {
      todayTasksList.innerHTML = '';
      setTxt('dashTodayTasksCount', `${todayPendingCount} ta kutilmoqda`);

      if (todayTasks.length === 0) {
        todayTasksList.innerHTML = `<span style="color:var(--text-muted); font-size:12px; padding: 12px; display: block; text-align: center;">Bugun uchun rejalashtirilgan vazifa yo'q 🎉</span>`;
      } else {
        todayTasks.slice(0, 7).forEach(t => {
          const isDone = (t.status && t.status.includes('Bajarildi')) || t.checked;
          const d = document.createElement('div');
          d.className = `today-item ${isDone ? 'done' : ''}`;
          d.innerHTML = `
            <input type="checkbox" class="custom-checkbox" ${isDone ? 'checked' : ''} style="width:15px; height:15px; cursor: pointer;">
            <div style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size: 13px;">
              <b>${esc(t.title)}</b>
            </div>
            <span style="font-size:10px; color: ${t.deadline === todayStr ? '#ea4335; font-weight:700;' : 'var(--text-muted);'}">
              ${t.deadline === todayStr ? '⚠️ Bugun' : (t.deadline || 'Ochiq')}
            </span>
          `;
          d.querySelector('input').onchange = (e) => {
            t.checked = e.target.checked;
            t.status = e.target.checked ? "✅ Bajarildi" : "✏️ Jarayonda";
            if (e.target.checked) {
              this.playCelebrationSound('success');
              this.triggerConfetti();
            }
            this.renderAllViews();
            this.saveAllData();
          };
          todayTasksList.appendChild(d);
        });
      }
    }

    // 6. Column 2: Today's Habits in Action Center
    const todayHabitsList = document.getElementById('dashTodayHabitsList');
    if (todayHabitsList) {
      todayHabitsList.innerHTML = '';
      if ((this.habits || []).length === 0) {
        todayHabitsList.innerHTML = `<span style="color:var(--text-muted); font-size:12px; padding: 12px; display: block; text-align: center;">Hozircha odatlar qo'shilmagan</span>`;
      } else {
        this.habits.forEach(h => {
          const isChecked = (h.days && h.days[dayIdx] === 1);
          const d = document.createElement('div');
          d.className = `today-item ${isChecked ? 'done' : ''}`;
          d.innerHTML = `
            <input type="checkbox" class="custom-checkbox" ${isChecked ? 'checked' : ''} style="width:15px; height:15px; cursor: pointer;">
            <div style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size: 13px;">
              ${esc(h.title)}
            </div>
            <span style="font-size:10px; font-weight: 600; color:${isChecked ? '#137333' : 'var(--text-muted)'};">
              ${isChecked ? '✓ Bajarildi' : 'Kutilmoqda'}
            </span>
          `;
          d.querySelector('input').onchange = (e) => {
            if (!h.days) h.days = new Array(31).fill(0);
            h.days[dayIdx] = e.target.checked ? 1 : 0;
            if (e.target.checked) {
              this.playCelebrationSound('success');
              this.triggerConfetti();
            }
            this.renderAllViews();
            this.saveAllData();
          };
          todayHabitsList.appendChild(d);
        });
      }
      setTxt('dashTodayHabitsCount', `${doneTodayHabits}/${totalHabits}`);
    }

    // 7. Column 3: Upcoming Deadlines & Alarms
    const upcomingList = document.getElementById('dashUpcomingAlarmsList');
    if (upcomingList) {
      upcomingList.innerHTML = '';
      const alarms = this.alarms || [];
      const activeAlarms = alarms.filter(a => a.enabled !== false);

      // Deadlines in next 3 days
      const nearTasks = (this.tasks || []).filter(t => {
        if (!t.deadline || (t.status && t.status.includes('Bajarildi')) || t.checked) return false;
        const diffDays = Math.ceil((new Date(t.deadline) - new Date(todayStr)) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 3;
      });

      const totalUpcoming = activeAlarms.length + nearTasks.length;
      setTxt('dashUpcomingAlarmsCount', `${totalUpcoming} ta faol`);

      if (totalUpcoming === 0) {
        upcomingList.innerHTML = `
          <div style="color:var(--text-muted); font-size:12px; padding: 14px 8px; text-align:center;">
            ⏰ Faol budilniklar yoki yaqin 3 kunlik muddatlar yo'q ✨
          </div>
        `;
      } else {
        // Render Active Alarms
        alarms.forEach(alarm => {
          const item = document.createElement('div');
          item.className = 'today-item';
          item.style.borderLeft = alarm.enabled !== false ? '3px solid #ea4335' : '3px solid var(--border-sheet)';
          item.innerHTML = `
            <span style="font-size: 14px;">⏰</span>
            <div style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              <b style="font-size: 13px; color: ${alarm.enabled !== false ? 'var(--text-main)' : 'var(--text-muted)'};">${alarm.time}</b>
              <span style="font-size: 11px; color: var(--text-muted); margin-left: 6px;">${esc(alarm.title || 'Budilnik')}</span>
            </div>
            <label style="display:inline-flex; align-items:center; cursor:pointer; margin-right: 4px;" title="Yoqish / O'chirish">
              <input type="checkbox" ${alarm.enabled !== false ? 'checked' : ''} style="cursor:pointer; width:14px; height:14px;">
            </label>
            <button class="btn-del-alarm" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:12px; padding:2px 4px;" title="O'chirish">✕</button>
          `;
          item.querySelector('input').onchange = (e) => {
            alarm.enabled = e.target.checked;
            this.showToast(alarm.enabled ? `🔔 Budilnik (${alarm.time}) yoqildi` : `🔕 Budilnik (${alarm.time}) o'chirildi`);
            this.renderAllViews();
            this.saveAllData();
          };
          item.querySelector('.btn-del-alarm').onclick = () => {
            this.alarms = this.alarms.filter(a => a.id !== alarm.id);
            this.showToast("🗑️ Budilnik o'chirildi");
            this.renderAllViews();
            this.saveAllData();
          };
          upcomingList.appendChild(item);
        });

        // Render Near Deadlines
        nearTasks.forEach(task => {
          const item = document.createElement('div');
          item.className = 'today-item';
          item.style.borderLeft = '3px solid #fbbc04';
          const diffDays = Math.ceil((new Date(task.deadline) - new Date(todayStr)) / (1000 * 60 * 60 * 24));
          const dueLabel = diffDays === 0 ? "Bugun!" : (diffDays === 1 ? "Ertaga" : `${diffDays} kun qoldi`);
          item.innerHTML = `
            <span style="font-size: 14px;">📌</span>
            <div style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              <b style="font-size: 12px;">${esc(task.title)}</b>
            </div>
            <span style="font-size: 10px; font-weight: 700; color: #ea4335; background: rgba(234,67,53,0.1); padding: 2px 6px; border-radius: 4px;">
              ${dueLabel}
            </span>
          `;
          upcomingList.appendChild(item);
        });
      }
    }

    // 8. Weekly Productivity Dynamics Chart (Chart.js)
    this.renderDashboardChart();

    // 9. Strategic Goals & OKRs
    this.renderGoalsView();

    // 10. Sticky Notes Board
    this.renderStickyNotes();

    // 11. Update Pomodoro Task Selector
    this.updatePomodoroTaskSelect();
  },

  openHeroAlarmPrompt() {
    const inp = document.getElementById('aiHeroInput');
    if (inp) {
      inp.focus();
      inp.value = "Ertaga 06:00 ga budilnik qo'y";
    }
  },

  renderDashboardChart() {
    const canvas = document.getElementById('dashMainChart');
    if (!canvas || typeof Chart === 'undefined') return;

    if (this.charts.dashChart) this.charts.dashChart.destroy();

    // Generate last 7 days labels & data
    const dayNames = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];
    const labels = [];
    const taskData = [];
    const habitData = [];

    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayOfMonth = d.getDate();
      const dayOfWeek = dayNames[d.getDay()];
      labels.push(`${dayOfWeek} (${dayOfMonth})`);

      // Tasks completed on or before that day
      const dayStr = d.toISOString().split('T')[0];
      const completedOnDay = (this.tasks || []).filter(t => {
        const isDone = (t.status && t.status.includes('Bajarildi')) || t.checked;
        return isDone && (!t.deadline || t.deadline <= dayStr);
      }).length;
      taskData.push(completedOnDay);

      // Habits adherence for that day index
      const habitDayIdx = Math.min(Math.max(0, dayOfMonth - 1), 30);
      let dayHabitDone = 0;
      (this.habits || []).forEach(h => {
        if (h.days && h.days[habitDayIdx] === 1) dayHabitDone++;
      });
      const totalH = (this.habits || []).length || 1;
      habitData.push(Math.round((dayHabitDone / totalH) * 100));
    }

    const ctx = canvas.getContext('2d');
    this.charts.dashChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            type: 'bar',
            label: 'Bajarilgan vazifalar',
            data: taskData,
            backgroundColor: '#1a73e8',
            borderRadius: 6,
            barThickness: 24,
            yAxisID: 'y'
          },
          {
            type: 'line',
            label: 'Odatlar intizomi (%)',
            data: habitData,
            borderColor: '#34a853',
            backgroundColor: 'rgba(52, 168, 83, 0.1)',
            borderWidth: 2,
            tension: 0.35,
            fill: true,
            yAxisID: 'y1',
            pointRadius: 4,
            pointBackgroundColor: '#34a853'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              boxWidth: 12,
              font: { size: 11 }
            }
          }
        },
        scales: {
          y: {
            type: 'linear',
            position: 'left',
            beginAtZero: true,
            title: {
              display: true,
              text: 'Vazifalar soni',
              font: { size: 10 }
            },
            ticks: {
              stepSize: 1
            }
          },
          y1: {
            type: 'linear',
            position: 'right',
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Odatlar %',
              font: { size: 10 }
            },
            grid: {
              drawOnChartArea: false
            },
            ticks: {
              callback: (val) => val + '%'
            }
          }
        }
      }
    });
  },

  // 1. TASKS VIEW
  renderTasksView() {
    const tbody = document.getElementById('tasksTbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const todayStr = new Date().toISOString().split('T')[0];

    // Calculate pill counts
    let countAll = this.tasks.length;
    let countPending = 0;
    let countCompleted = 0;
    let countUrgent = 0;
    let countToday = 0;

    this.tasks.forEach(t => {
      const isDone = t.status.includes('Bajarildi') || t.checked;
      if (isDone) countCompleted++;
      else countPending++;

      if (t.priority && t.priority.includes("O'ta muhim")) countUrgent++;
      if (t.deadline === todayStr) countToday++;
    });

    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setEl('pillCountAll', countAll);
    setEl('pillCountPending', countPending);
    setEl('pillCountCompleted', countCompleted);
    setEl('pillCountUrgent', countUrgent);
    setEl('pillCountToday', countToday);

    let doneCount = 0;

    // Filter tasks based on taskFilter and searchQuery
    const filteredTasks = this.tasks.filter(task => {
      const isDone = task.status.includes('Bajarildi') || task.checked;

      // Filter Pill
      if (this.taskFilter === 'pending' && isDone) return false;
      if (this.taskFilter === 'completed' && !isDone) return false;
      if (this.taskFilter === 'urgent' && (!task.priority || !task.priority.includes("O'ta muhim"))) return false;
      if (this.taskFilter === 'today' && task.deadline !== todayStr) return false;

      // Live Search
      if (this.searchQuery) {
        const text = `${task.title} ${task.note || ''} ${task.category} ${task.priority}`.toLowerCase();
        if (!text.includes(this.searchQuery)) return false;
      }

      return true;
    });

    filteredTasks.forEach((task) => {
      const isDone = task.status.includes('Bajarildi') || task.checked;
      if (isDone) doneCount++;

      const tr = document.createElement('tr');
      if (isDone) tr.classList.add('completed');

      // Urgency badge if deadline is today or past
      let deadlineBadge = '';
      if (!isDone && task.deadline) {
        if (task.deadline === todayStr) {
          deadlineBadge = `<span class="badge-urgent">⚠️ Bugun!</span>`;
        } else if (task.deadline < todayStr) {
          deadlineBadge = `<span class="badge-urgent" style="background:#555;">⏰ O'tib ketgan</span>`;
        }
      }

      tr.innerHTML = `
        <td class="checkbox-col">
          <input type="checkbox" class="custom-checkbox task-check" data-id="${task.id}" ${isDone ? 'checked' : ''}>
        </td>
        <td>
          <span class="task-title-text" contenteditable="true" data-field="title" data-id="${task.id}">${task.title}</span>
          ${deadlineBadge}
        </td>
        <td>
          <input type="date" value="${task.deadline || ''}" class="form-control task-date-input" data-id="${task.id}" style="border:none; background:transparent; padding:0;">
        </td>
        <td>
          <select class="form-control task-priority-select" data-id="${task.id}" style="font-size:11px; padding:2px;">
            <option value="‼️ O'ta muhim" ${task.priority.includes("O'ta muhim") ? 'selected' : ''}>‼️ O'ta muhim</option>
            <option value="🔥 Muhim" ${task.priority.includes("🔥") ? 'selected' : ''}>🔥 Muhim</option>
            <option value="⚡ O'rtacha muhim" ${task.priority.includes("⚡") ? 'selected' : ''}>⚡ O'rtacha muhim</option>
            <option value="Oddiy" ${task.priority === "Oddiy" ? 'selected' : ''}>Oddiy</option>
          </select>
        </td>
        <td>
          <select class="form-control task-status-select" data-id="${task.id}" style="font-size:11px; padding:2px;">
            <option value="✅ Bajarildi" ${isDone ? 'selected' : ''}>✅ Bajarildi</option>
            <option value="✏️ Jarayonda" ${task.status.includes("Jarayonda") ? 'selected' : ''}>✏️ Jarayonda</option>
            <option value="⏳ Kutilmoqda" ${task.status.includes("Kutilmoqda") ? 'selected' : ''}>⏳ Kutilmoqda</option>
          </select>
        </td>
        <td>
          <select class="form-control task-category-select" data-id="${task.id}" style="font-size:11px; padding:2px;">
            <option value="Shaxsiy" ${task.category === "Shaxsiy" ? 'selected' : ''}>Shaxsiy</option>
            <option value="Ish" ${task.category === "Ish" ? 'selected' : ''}>Ish</option>
            <option value="Ta'lim" ${task.category === "Ta'lim" ? 'selected' : ''}>Ta'lim</option>
            <option value="Uy" ${task.category === "Uy" ? 'selected' : ''}>Uy</option>
            <option value="Moliya" ${task.category === "Moliya" ? 'selected' : ''}>Moliya</option>
          </select>
        </td>
        <td>
          <span contenteditable="true" data-field="note" data-id="${task.id}" style="display:block; min-height:16px;">${task.note || ''}</span>
        </td>
        <td style="text-align: center;">
          <button class="btn btn-secondary" style="padding: 2px 6px; font-size: 11px; color: #ea4335;" onclick="PlannerApp.deleteTask(${task.id})">🗑️</button>
        </td>
      `;

      tbody.appendChild(tr);
    });

    // Attach inline edit events
    tbody.querySelectorAll('.task-check').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const id = Number(e.target.dataset.id);
        const t = this.tasks.find(x => x.id === id);
        if (t) {
          t.checked = e.target.checked;
          t.status = e.target.checked ? "✅ Bajarildi" : "✏️ Jarayonda";
          if (e.target.checked) {
            this.playCelebrationSound('success');
            this.triggerConfetti();
          }
          this.renderTasksView();
          this.renderCalendarView();
          this.saveAllData();
        }
      });
    });

    tbody.querySelectorAll('.task-title-text, [data-field="note"]').forEach(el => {
      el.addEventListener('blur', (e) => {
        const id = Number(e.target.dataset.id);
        const field = e.target.dataset.field;
        const t = this.tasks.find(x => x.id === id);
        if (t) {
          t[field] = e.target.innerText.trim();
          this.saveAllData();
          if (field === 'title') this.renderCalendarView();
        }
      });
    });

    tbody.querySelectorAll('.task-date-input').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const id = Number(e.target.dataset.id);
        const t = this.tasks.find(x => x.id === id);
        if (t) {
          t.deadline = e.target.value;
          this.renderCalendarView();
          this.saveAllData();
        }
      });
    });

    tbody.querySelectorAll('.task-priority-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const id = Number(e.target.dataset.id);
        const t = this.tasks.find(x => x.id === id);
        if (t) {
          t.priority = e.target.value;
          this.saveAllData();
          this.renderCalendarView();
        }
      });
    });

    tbody.querySelectorAll('.task-status-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const id = Number(e.target.dataset.id);
        const t = this.tasks.find(x => x.id === id);
        if (t) {
          t.status = e.target.value;
          t.checked = t.status.includes('Bajarildi');
          this.renderTasksView();
          this.renderCalendarView();
          this.saveAllData();
        }
      });
    });

    tbody.querySelectorAll('.task-category-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const id = Number(e.target.dataset.id);
        const t = this.tasks.find(x => x.id === id);
        if (t) {
          t.category = e.target.value;
          this.saveAllData();
        }
      });
    });

    if (filteredTasks.length === 0) {
      const emptyTr = document.createElement('tr');
      emptyTr.innerHTML = `
        <td colspan="8" style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 13px;">
          Hozircha vazifa yo'q. Quyidagi qatordan yangi vazifa yozishingiz mumkin. 👇
        </td>
      `;
      tbody.appendChild(emptyTr);
    }

    // Google Sheets & Notion style inline quick add row
    const inlineTr = document.createElement('tr');
    inlineTr.style.background = 'var(--bg-app)';
    inlineTr.style.borderTop = '2px dashed var(--border-sheet)';
    inlineTr.innerHTML = `
      <td style="text-align:center; color:#1a73e8; font-weight:bold;">➕</td>
      <td>
        <input type="text" id="inlineTaskTitle" placeholder="+ Yangi vazifa nomi... (yozib Enter bosing)" style="width:100%; border:none; background:transparent; font-size:13px; outline:none; padding:4px;" onkeydown="if(event.key==='Enter') PlannerApp.addInlineTask()">
      </td>
      <td>
        <input type="date" id="inlineTaskDate" value="${todayStr}" style="border:none; background:transparent; font-size:11px; padding:2px;">
      </td>
      <td>
        <select id="inlineTaskPriority" style="border:none; background:transparent; font-size:11px; padding:2px;">
          <option value="‼️ O'ta muhim">‼️ O'ta muhim</option>
          <option value="🔥 Muhim" selected>🔥 Muhim</option>
          <option value="⚡ O'rtacha muhim">⚡ O'rtacha muhim</option>
          <option value="Oddiy">Oddiy</option>
        </select>
      </td>
      <td>
        <select id="inlineTaskStatus" style="border:none; background:transparent; font-size:11px; padding:2px;">
          <option value="✏️ Jarayonda" selected>✏️ Jarayonda</option>
          <option value="✅ Bajarildi">✅ Bajarildi</option>
          <option value="⏳ Kutilmoqda">⏳ Kutilmoqda</option>
        </select>
      </td>
      <td>
        <select id="inlineTaskCat" style="border:none; background:transparent; font-size:11px; padding:2px;">
          <option value="Ish" selected>Ish</option>
          <option value="Shaxsiy">Shaxsiy</option>
          <option value="Ta'lim">Ta'lim</option>
          <option value="Uy">Uy</option>
          <option value="Moliya">Moliya</option>
        </select>
      </td>
      <td>
        <input type="text" id="inlineTaskNote" placeholder="Izoh..." style="width:100%; border:none; background:transparent; font-size:12px; outline:none; padding:4px;" onkeydown="if(event.key==='Enter') PlannerApp.addInlineTask()">
      </td>
      <td style="text-align:center;">
        <button class="btn btn-primary" style="padding:2px 8px; font-size:11px;" onclick="PlannerApp.addInlineTask()">Qo'shish</button>
      </td>
    `;
    tbody.appendChild(inlineTr);

    // Update count totals
    const total = this.tasks.length;
    document.getElementById('taskCountTotal').textContent = total;
    document.getElementById('taskCountDone').textContent = doneCount;
    const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;
    document.getElementById('taskPercentDone').textContent = `${percent}%`;
  },

  addInlineTask() {
    const titleInp = document.getElementById('inlineTaskTitle');
    const dateInp = document.getElementById('inlineTaskDate');
    const prioInp = document.getElementById('inlineTaskPriority');
    const statInp = document.getElementById('inlineTaskStatus');
    const catInp = document.getElementById('inlineTaskCat');
    const noteInp = document.getElementById('inlineTaskNote');

    const title = titleInp ? titleInp.value.trim() : '';
    if (!title) return;

    const newTask = {
      id: Date.now(),
      title,
      deadline: dateInp ? dateInp.value : '',
      priority: prioInp ? prioInp.value : '🔥 Muhim',
      status: statInp ? statInp.value : '✏️ Jarayonda',
      category: catInp ? catInp.value : 'Ish',
      note: noteInp ? noteInp.value.trim() : '',
      checked: statInp && statInp.value.includes('Bajarildi')
    };

    this.tasks.push(newTask);
    this.renderAllViews();
    this.saveAllData();
    const nextInp = document.getElementById('inlineTaskTitle');
    if (nextInp) nextInp.focus();
  },

  // KANBAN BOARD SYSTEM (NOTION STYLE)
  taskViewMode: "table",

  switchTaskView(mode) {
    this.taskViewMode = mode;
    const btnTable = document.getElementById('btnViewTable');
    const btnKanban = document.getElementById('btnViewKanban');
    const btnMatrix = document.getElementById('btnViewMatrix');
    const tableContainer = document.getElementById('tasksTableViewContainer');
    const kanbanContainer = document.getElementById('tasksKanbanViewContainer');
    const matrixContainer = document.getElementById('tasksMatrixViewContainer');

    [btnTable, btnKanban, btnMatrix].forEach(b => { if (b) b.classList.remove('active'); });
    if (tableContainer) tableContainer.style.display = 'none';
    if (kanbanContainer) kanbanContainer.style.display = 'none';
    if (matrixContainer) matrixContainer.style.display = 'none';

    if (mode === 'table') {
      if (btnTable) btnTable.classList.add('active');
      if (tableContainer) tableContainer.style.display = 'block';
      this.renderTasksView();
    } else if (mode === 'kanban') {
      if (btnKanban) btnKanban.classList.add('active');
      if (kanbanContainer) kanbanContainer.style.display = 'block';
      this.renderKanbanBoard();
    } else if (mode === 'matrix') {
      if (btnMatrix) btnMatrix.classList.add('active');
      if (matrixContainer) matrixContainer.style.display = 'block';
      this.renderMatrixBoard();
    }
  },

  renderMatrixBoard() {
    const listQ1 = document.getElementById('matrixListQ1');
    const listQ2 = document.getElementById('matrixListQ2');
    const listQ3 = document.getElementById('matrixListQ3');
    const listQ4 = document.getElementById('matrixListQ4');

    if (!listQ1 || !listQ2 || !listQ3 || !listQ4) return;

    listQ1.innerHTML = '';
    listQ2.innerHTML = '';
    listQ3.innerHTML = '';
    listQ4.innerHTML = '';

    const todayStr = new Date().toISOString().split('T')[0];
    let countQ1 = 0, countQ2 = 0, countQ3 = 0, countQ4 = 0;

    const filtered = this.tasks.filter(task => {
      if (this.searchQuery) {
        const text = `${task.title} ${task.note || ''} ${task.category}`.toLowerCase();
        if (!text.includes(this.searchQuery)) return false;
      }
      return true;
    });

    filtered.forEach(task => {
      const isDone = task.status.includes('Bajarildi') || task.checked;
      const isUrgent = (task.deadline && task.deadline <= todayStr) || (task.priority && task.priority.includes("O'ta muhim"));
      const isImportant = task.priority && (task.priority.includes("O'ta muhim") || task.priority.includes("Muhim"));

      let quadrant = 4;
      if (isUrgent && isImportant) quadrant = 1;
      else if (!isUrgent && isImportant) quadrant = 2;
      else if (isUrgent && !isImportant) quadrant = 3;
      else quadrant = 4;

      if (quadrant === 1) countQ1++;
      else if (quadrant === 2) countQ2++;
      else if (quadrant === 3) countQ3++;
      else if (quadrant === 4) countQ4++;

      const item = document.createElement('div');
      item.className = `matrix-item ${isDone ? 'completed' : ''}`;
      item.innerHTML = `
        <input type="checkbox" class="custom-checkbox" ${isDone ? 'checked' : ''} style="width:14px; height:14px; cursor:pointer;">
        <div style="flex:1; overflow:hidden;">
          <div style="font-weight:600; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${task.title}</div>
          <div style="font-size:10px; color:var(--text-muted); display:flex; gap:6px; margin-top:2px;">
            <span>${task.category || 'Vazifa'}</span>
            ${task.deadline ? `<span>• 📅 ${task.deadline}</span>` : ''}
          </div>
        </div>
      `;

      item.querySelector('input').addEventListener('change', (e) => {
        task.checked = e.target.checked;
        task.status = e.target.checked ? "✅ Bajarildi" : "✏️ Jarayonda";
        if (e.target.checked) {
          this.playCelebrationSound('success');
          this.triggerConfetti();
        }
        this.renderAllViews();
        this.saveAllData();
      });

      if (quadrant === 1) listQ1.appendChild(item);
      else if (quadrant === 2) listQ2.appendChild(item);
      else if (quadrant === 3) listQ3.appendChild(item);
      else if (quadrant === 4) listQ4.appendChild(item);
    });

    const setQ = (id, count) => {
      const el = document.getElementById(id);
      if (el) el.textContent = `${count} ta`;
    };
    setQ('matrixCountQ1', countQ1);
    setQ('matrixCountQ2', countQ2);
    setQ('matrixCountQ3', countQ3);
    setQ('matrixCountQ4', countQ4);

    const checkEmpty = (list, text) => {
      if (list.children.length === 0) {
        list.innerHTML = `<span style="font-size:11px; color:var(--text-muted); padding:8px 4px; display:block;">${text}</span>`;
      }
    };
    checkEmpty(listQ1, "Shoshilinch muhim vazifalar yo'q 🎉");
    checkEmpty(listQ2, "Strategik reja uchun vazifa qo'shing 🎯");
    checkEmpty(listQ3, "Vakolat beriladigan vazifalar yo'q");
    checkEmpty(listQ4, "Ikkilamchi vazifalar mavjud emas");
  },

  renderKanbanBoard() {
    const listPending = document.getElementById('kanbanListPending');
    const listProgress = document.getElementById('kanbanListProgress');
    const listDone = document.getElementById('kanbanListDone');

    if (!listPending || !listProgress || !listDone) return;

    listPending.innerHTML = '';
    listProgress.innerHTML = '';
    listDone.innerHTML = '';

    let cPending = 0, cProgress = 0, cDone = 0;

    const filtered = this.tasks.filter(task => {
      if (this.searchQuery) {
        const text = `${task.title} ${task.note || ''} ${task.category}`.toLowerCase();
        if (!text.includes(this.searchQuery)) return false;
      }
      return true;
    });

    filtered.forEach(task => {
      const card = document.createElement('div');
      card.className = 'kanban-card';
      card.draggable = true;
      card.dataset.id = task.id;

      card.ondragstart = (e) => {
        e.dataTransfer.setData('text/plain', task.id);
        card.classList.add('dragging');
      };
      card.ondragend = () => {
        card.classList.remove('dragging');
      };

      let prioBadge = `<span style="font-size:10px; font-weight:bold; color:#1a73e8;">${task.priority || 'Oddiy'}</span>`;
      if (task.priority.includes("O'ta muhim")) prioBadge = `<span style="font-size:10px; font-weight:bold; color:#ea4335;">‼️ O'ta muhim</span>`;
      else if (task.priority.includes("Muhim")) prioBadge = `<span style="font-size:10px; font-weight:bold; color:#fbbc04;">🔥 Muhim</span>`;

      card.innerHTML = `
        <div class="kanban-card-title">${task.title}</div>
        <div class="kanban-card-meta">
          <span>${prioBadge}</span>
          <span>${task.deadline || 'Muddatsiz'}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; border-top:1px dashed var(--border-sheet); padding-top:6px;">
          <span style="font-size:10px; color:var(--text-muted); background:var(--bg-app); padding:1px 6px; border-radius:3px;">${task.category}</span>
          <button class="btn btn-secondary" style="padding:1px 5px; font-size:10px; color:#ea4335;" onclick="PlannerApp.deleteTask(${task.id})">🗑️</button>
        </div>
      `;

      if (task.status.includes('Bajarildi') || task.checked) {
        cDone++;
        listDone.appendChild(card);
      } else if (task.status.includes('Jarayonda')) {
        cProgress++;
        listProgress.appendChild(card);
      } else {
        cPending++;
        listPending.appendChild(card);
      }
    });

    const setTxt = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
    setTxt('kanbanCountPending', cPending);
    setTxt('kanbanCountProgress', cProgress);
    setTxt('kanbanCountDone', cDone);
  },

  handleKanbanDrop(e, newStatus) {
    e.preventDefault();
    const id = Number(e.dataTransfer.getData('text/plain'));
    if (!id) return;

    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.status = newStatus;
      task.checked = newStatus.includes('Bajarildi');
      this.renderAllViews();
      this.saveAllData();
      this.showToast(`✓ Vazifa "${newStatus}" ustuniga ko'chirildi!`);
    }
  },

  // 50 / 30 / 20 BUDGET COMPLIANCE ANALYZER
  render503020Rule(totalIncome = 0, categoryExpenseTotals = {}, totalSavings = 0) {
    if (totalIncome <= 0) {
      // Default empty
      const setDef = (pId, aId, bId, sId) => {
        const p = document.getElementById(pId); if (p) p.textContent = "0%";
        const a = document.getElementById(aId); if (a) a.textContent = "0 UZS";
        const b = document.getElementById(bId); if (b) b.style.width = "0%";
        const s = document.getElementById(sId); if (s) s.textContent = "Ma'lumot kiritilmagan";
      };
      setDef('ruleNeedsPercent', 'ruleNeedsAmount', 'ruleNeedsBar', 'ruleNeedsStatus');
      setDef('ruleWantsPercent', 'ruleWantsAmount', 'ruleWantsBar', 'ruleWantsStatus');
      setDef('ruleSavingsPercent', 'ruleSavingsAmount', 'ruleSavingsBar', 'ruleSavingsStatus');
      return;
    }

    // Categorize
    const needsCategories = ['Uy-joy', 'Kommunalka', 'Benzin', 'Oziq-ovqat', 'Oila xarajatlari', 'Ta\'lim va rivojlanish', 'Mobil Aloqa'];
    const wantsCategories = ['Ko\'ngilochar va dam olish', 'Sigaretlar', 'Xaridlar va buyumlar', 'Boshqa xarajat'];

    let needsTotal = 0;
    let wantsTotal = 0;

    Object.entries(categoryExpenseTotals).forEach(([cat, amt]) => {
      if (wantsCategories.some(w => cat.includes(w))) {
        wantsTotal += amt;
      } else {
        needsTotal += amt;
      }
    });

    const savingsTotal = Math.max(0, totalIncome - needsTotal - wantsTotal);

    const needsPct = Math.round((needsTotal / totalIncome) * 100);
    const wantsPct = Math.round((wantsTotal / totalIncome) * 100);
    const savingsPct = Math.round((savingsTotal / totalIncome) * 100);

    const fmt = (num) => (num || 0).toLocaleString('uz-UZ') + " UZS";

    // 1. Needs (50% max)
    const nP = document.getElementById('ruleNeedsPercent'); if (nP) nP.textContent = `${needsPct}%`;
    const nA = document.getElementById('ruleNeedsAmount'); if (nA) nA.textContent = fmt(needsTotal);
    const nB = document.getElementById('ruleNeedsBar');
    if (nB) {
      nB.style.width = `${Math.min(needsPct, 100)}%`;
      nB.style.background = needsPct <= 50 ? '#1a73e8' : '#ea4335';
    }
    const nS = document.getElementById('ruleNeedsStatus');
    if (nS) {
      if (needsPct <= 50) nS.innerHTML = `<span style="color:#137333;">✓ Ideal me'yorda (50% dan kam)</span>`;
      else nS.innerHTML = `<span style="color:#ea4335;">⚠️ Me'yordan oshdi (${needsPct - 50}% ortiqcha)</span>`;
    }

    // 2. Wants (30% max)
    const wP = document.getElementById('ruleWantsPercent'); if (wP) wP.textContent = `${wantsPct}%`;
    const wA = document.getElementById('ruleWantsAmount'); if (wA) wA.textContent = fmt(wantsTotal);
    const wB = document.getElementById('ruleWantsBar');
    if (wB) {
      wB.style.width = `${Math.min(wantsPct, 100)}%`;
      wB.style.background = wantsPct <= 30 ? '#fbbc04' : '#ea4335';
    }
    const wS = document.getElementById('ruleWantsStatus');
    if (wS) {
      if (wantsPct <= 30) wS.innerHTML = `<span style="color:#137333;">✓ Nazorat ostida (30% dan kam)</span>`;
      else wS.innerHTML = `<span style="color:#ea4335;">⚠️ Ko'ngilochar xarajatlar ko'paydi!</span>`;
    }

    // 3. Savings (20% min)
    const sP = document.getElementById('ruleSavingsPercent'); if (sP) sP.textContent = `${savingsPct}%`;
    const sA = document.getElementById('ruleSavingsAmount'); if (sA) sA.textContent = fmt(savingsTotal);
    const sB = document.getElementById('ruleSavingsBar');
    if (sB) {
      sB.style.width = `${Math.min(savingsPct, 100)}%`;
      sB.style.background = savingsPct >= 20 ? '#34a853' : '#fbbc04';
    }
    const sS = document.getElementById('ruleSavingsStatus');
    if (sS) {
      if (savingsPct >= 20) sS.innerHTML = `<span style="color:#137333;">🌟 Zo'r natija! (${savingsPct}% jamg'arma)</span>`;
      else sS.innerHTML = `<span style="color:#b06000;">⚠️ Jamg'arma ulushi 20% ga yetmadi</span>`;
    }
  },

  addTaskFromModal() {
    const title = document.getElementById('taskInputTitle').value.trim();
    const deadline = document.getElementById('taskInputDeadline').value;
    const priority = document.getElementById('taskInputPriority').value;
    const category = document.getElementById('taskInputCategory').value;
    const status = document.getElementById('taskInputStatus').value;
    const note = document.getElementById('taskInputNote').value.trim();

    if (!title) return;

    const newTask = {
      id: Date.now(),
      title,
      deadline,
      priority,
      status,
      category,
      note,
      checked: status.includes('Bajarildi')
    };

    this.tasks.push(newTask);
    this.renderTasksView();
    this.renderCalendarView();
    this.saveAllData();

    document.getElementById('taskModal').classList.remove('active');
    document.getElementById('taskForm').reset();
  },

  deleteTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.renderTasksView();
    this.renderCalendarView();
    this.saveAllData();
  },

  syncCalendarDropdowns() {
    const monthDrop = document.getElementById('calMonthDropdown');
    const yearDrop = document.getElementById('calYearDropdown');
    if (monthDrop) monthDrop.value = this.selectedCalendarDate.getMonth();
    if (yearDrop) yearDrop.value = this.selectedCalendarDate.getFullYear();
  },

  // 2. CALENDAR VIEW
  renderCalendarView() {
    const year = this.selectedCalendarDate.getFullYear();
    const month = this.selectedCalendarDate.getMonth();
    const monthName = this.monthsUz[month];

    this.syncCalendarDropdowns();
    document.getElementById('calendarMonthYearTitle').textContent = `${monthName.toLowerCase()} ${year}`;

    // Render Left Sidebar Task Table (Screenshot 2 style)
    const tableBody = document.getElementById('calendarTasksTableBody');
    if (tableBody) {
      tableBody.innerHTML = '';
      this.tasks.forEach(t => {
        const isDone = t.status.includes('Bajarildi') || t.checked;
        const tr = document.createElement('tr');
        if (isDone) tr.style.opacity = '0.6';

        // Format date: e.g. "20 ноябр"
        let dateLabel = t.deadline || '';
        if (t.deadline) {
          const parts = t.deadline.split('-');
          if (parts.length === 3) {
            const dNum = parseInt(parts[2]);
            const mIdx = parseInt(parts[1]) - 1;
            dateLabel = `${dNum} ${this.monthsUz[mIdx]?.toLowerCase() || ''}`;
          }
        }

        tr.innerHTML = `
          <td style="text-align: center;">
            <input type="checkbox" class="custom-checkbox" ${isDone ? 'checked' : ''} style="width:13px; height:13px;">
          </td>
          <td style="max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; ${isDone ? 'text-decoration: line-through;' : ''}">
            ${t.title}
          </td>
          <td style="color:#5f6368; font-size:10px; white-space:nowrap;">
            ${dateLabel}
          </td>
        `;

        tr.querySelector('input').onchange = (e) => {
          t.checked = e.target.checked;
          t.status = e.target.checked ? "✅ Bajarildi" : "✏️ Jarayonda";
          this.renderTasksView();
          this.renderCalendarView();
          this.saveAllData();
        };

        tableBody.appendChild(tr);
      });
    }

    // Render Calendar Grid
    const grid = document.getElementById('calendarDaysGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const weekdays = ["понедельник", "вторник", "среда", "четверг", "пятница", "суббота", "воскресенье"];
    weekdays.forEach(w => {
      const h = document.createElement('div');
      h.className = 'cal-weekday';
      h.textContent = w;
      grid.appendChild(h);
    });

    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    const startingDay = (firstDay === 0) ? 6 : firstDay - 1; // 0 is Monday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Previous month filler days
    for (let i = 0; i < startingDay; i++) {
      const cell = document.createElement('div');
      cell.className = 'cal-cell other-month';
      const prevDateNum = daysInPrevMonth - startingDay + i + 1;
      cell.innerHTML = `<div class="cal-date-num">${prevDateNum}</div>`;
      grid.appendChild(cell);
    }

    // Days in current month
    const today = new Date();
    for (let d = 1; d <= daysInMonth; d++) {
      const cell = document.createElement('div');
      cell.className = 'cal-cell';
      const isToday = (today.getFullYear() === year && today.getMonth() === month && today.getDate() === d);
      if (isToday) cell.classList.add('today');

      cell.innerHTML = `<div class="cal-date-num">${d}</div>`;

      // Match tasks for this date
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayTasks = this.tasks.filter(t => t.deadline === dateString);

      dayTasks.forEach(task => {
        const item = document.createElement('div');
        item.className = 'cal-task-item';
        if (task.priority.includes("O'ta muhim")) item.classList.add('priority-high');
        else if (task.priority.includes("Muhim")) item.classList.add('priority-medium');

        item.title = `${task.title} (${task.status})`;
        item.textContent = task.title;
        cell.appendChild(item);
      });

      // Quick add task on cell click
      cell.style.cursor = 'pointer';
      cell.title = `Vazifa qo'shish uchun bosing (${d}-${monthName})`;
      cell.onclick = (e) => {
        if (e.target.classList.contains('cal-task-item')) return;
        document.getElementById('taskInputDeadline').value = dateString;
        document.getElementById('taskModal').classList.add('active');
      };

      grid.appendChild(cell);
    }

    // Fill remaining cells for 35 or 42 grid
    const totalCells = startingDay + daysInMonth;
    const remaining = (totalCells <= 35) ? (35 - totalCells) : (42 - totalCells);
    for (let i = 1; i <= remaining; i++) {
      const cell = document.createElement('div');
      cell.className = 'cal-cell other-month';
      cell.innerHTML = `<div class="cal-date-num">${i}</div>`;
      grid.appendChild(cell);
    }
  },

  // 3. HABITS VIEW (DAILY, WEEKLY, RECURRING & TODAY'S ROUTINE)
  renderTodayHabitsChecklist() {
    const container = document.getElementById('todayHabitsGrid');
    const dateLabel = document.getElementById('todayHabitsDateLabel');
    const statsBadge = document.getElementById('todayHabitsStatsBadge');
    if (!container) return;

    const today = new Date();
    const dayOfMonth = today.getDate(); // 1 to 31
    const dayIdx = dayOfMonth - 1; // 0 to 30

    if (dateLabel) {
      const monthName = this.monthsUz[today.getMonth()] || "Bugun";
      dateLabel.textContent = `${dayOfMonth}-${monthName}, ${today.getFullYear()}`;
    }

    // Active habits for selected month
    const activeHabits = this.habits.filter(h => !h.month || h.month === this.selectedHabitMonth);

    container.innerHTML = '';
    if (activeHabits.length === 0) {
      container.innerHTML = `<span style="color:var(--text-muted); font-size:12px; padding:8px;">Hozircha odatlar kiritilmagan. Yuqoridagi "+ Yangi odat" tugmasi orqali qo'shing.</span>`;
      if (statsBadge) statsBadge.textContent = "0/0 bajarildi";
      return;
    }

    let todayDone = 0;
    activeHabits.forEach(habit => {
      const isDone = (habit.days && habit.days[dayIdx] === 1);
      if (isDone) todayDone++;

      const card = document.createElement('div');
      card.className = `today-habit-card ${isDone ? 'completed' : ''}`;
      
      const streak = this.calculateStreak(habit.days);
      const streakHtml = streak > 0 ? `<span class="streak-badge ${streak >= 3 ? 'active-fire' : ''}" style="font-size:10px; padding:1px 5px;">🔥${streak}d</span>` : '';

      let routineIcon = "⚡";
      if (habit.routine === 'morning') routineIcon = "🌅";
      else if (habit.routine === 'day') routineIcon = "☀️";
      else if (habit.routine === 'evening') routineIcon = "🌙";

      let freqLabel = "Kunlik";
      let freqClass = "daily";
      if (habit.frequency === 'weekly') { freqLabel = "Haftalik"; freqClass = "weekly"; }
      else if (habit.frequency === 'monthly') { freqLabel = "Davomiy"; freqClass = "monthly"; }

      card.innerHTML = `
        <input type="checkbox" class="habit-check habit-cell-checkbox" ${isDone ? 'checked' : ''} style="cursor:pointer;" onclick="event.stopPropagation(); PlannerApp.toggleTodayHabit(${habit.id})">
        <span style="font-size: 14px;">${routineIcon}</span>
        <div style="flex:1; overflow:hidden;">
          <div class="today-habit-title" title="${habit.title}">${habit.title}</div>
          <div style="display:flex; gap:4px; align-items:center; margin-top:2px;">
            <span class="freq-badge ${freqClass}" style="font-size:9px; padding:1px 4px;">${freqLabel}</span>
            ${streakHtml}
          </div>
        </div>
      `;

      card.onclick = () => {
        this.toggleTodayHabit(habit.id);
      };

      container.appendChild(card);
    });

    if (statsBadge) {
      const pct = activeHabits.length > 0 ? Math.round((todayDone / activeHabits.length) * 100) : 0;
      statsBadge.textContent = `${todayDone}/${activeHabits.length} bajarildi (${pct}%)`;
      statsBadge.style.background = pct >= 70 ? '#e6f4ea' : (pct >= 40 ? '#fef7e0' : '#fce8e6');
      statsBadge.style.color = pct >= 70 ? '#137333' : (pct >= 40 ? '#b06000' : '#c5221f');
    }
  },

  toggleTodayHabit(id) {
    const today = new Date();
    const dayIdx = Math.min(30, today.getDate() - 1);
    const h = this.habits.find(x => x.id === id);
    if (h) {
      if (!h.days) h.days = new Array(31).fill(0);
      h.days[dayIdx] = h.days[dayIdx] === 1 ? 0 : 1;
      if (h.days[dayIdx] === 1) {
        this.playCelebrationSound('success');
        this.triggerConfetti();
        this.showToast("✓ Bugungi odat bajarildi!");
      } else {
        this.showToast("Odat bekor qilindi");
      }
      this.renderHabitsView();
      this.saveAllData();
    }
  },

  renderHabitsView() {
    this.renderTodayHabitsChecklist();

    const tbody = document.getElementById('habitTableBody');
    const headerDays = document.getElementById('habitHeaderDays');
    if (!tbody || !headerDays) return;

    // Build header 1 to 31
    headerDays.innerHTML = `<th class="habit-name-col" style="font-size: 11px; color:#5f6368;">kunlar</th>`;
    const daysInHabitMonth = 31;
    for (let i = 1; i <= daysInHabitMonth; i++) {
      const th = document.createElement('th');
      th.textContent = i;
      if (i <= 7) th.className = 'week-h-1';
      else if (i <= 14) th.className = 'week-h-2';
      else if (i <= 21) th.className = 'week-h-3';
      else if (i <= 28) th.className = 'week-h-4';
      headerDays.appendChild(th);
    }
    // Summary headers
    headerDays.innerHTML += `
      <th style="background:#fae1dd;"></th>
      <th style="background:#fae1dd;"></th>
      <th style="background:#fae1dd;"></th>
      <th style="background:#fae1dd;"></th>
    `;

    tbody.innerHTML = '';

    let totalPossibleHabitChecks = 0;
    let totalCompletedChecks = 0;

    // Filter habits for selected month
    let monthHabits = this.habits.filter(h => !h.month || h.month === this.selectedHabitMonth);

    // Frequency filter
    if (this.habitFrequencyFilter && this.habitFrequencyFilter !== 'all') {
      monthHabits = monthHabits.filter(h => (h.frequency || 'daily') === this.habitFrequencyFilter);
    }

    // Routine filter
    if (this.habitRoutineFilter && this.habitRoutineFilter !== 'all') {
      monthHabits = monthHabits.filter(h => (h.routine || 'anytime') === this.habitRoutineFilter);
    }

    // Array to calculate per-day stats
    const dayCompletedCounts = new Array(31).fill(0);

    monthHabits.forEach((habit) => {
      // Live search filter
      if (this.searchQuery && !habit.title.toLowerCase().includes(this.searchQuery)) {
        return;
      }

      const tr = document.createElement('tr');
      let habitRowDoneCount = 0;
      const streak = this.calculateStreak(habit.days);
      const streakBadge = streak > 0 
        ? `<span class="streak-badge ${streak >= 3 ? 'active-fire' : ''}" title="${streak} kun uzluksiz bajarildi!">🔥 ${streak}d</span>` 
        : '';

      let routineIcon = "⚡";
      if (habit.routine === 'morning') routineIcon = "🌅";
      else if (habit.routine === 'day') routineIcon = "☀️";
      else if (habit.routine === 'evening') routineIcon = "🌙";

      let freqLabel = "Kunlik";
      let freqClass = "daily";
      if (habit.frequency === 'weekly') { freqLabel = "Haftalik"; freqClass = "weekly"; }
      else if (habit.frequency === 'monthly') { freqLabel = "Davomiy"; freqClass = "monthly"; }

      // Weekly breakdown for this habit
      let w1 = 0, w2 = 0, w3 = 0, w4 = 0;
      if (habit.days) {
        for (let i = 0; i < 7; i++) if (habit.days[i] === 1) w1++;
        for (let i = 7; i < 14; i++) if (habit.days[i] === 1) w2++;
        for (let i = 14; i < 21; i++) if (habit.days[i] === 1) w3++;
        for (let i = 21; i < 28; i++) if (habit.days[i] === 1) w4++;
      }
      const weeklyMini = `<span class="week-mini-chip ${w1>0?'met':'unmet'}" title="1-hafta: ${w1}x">H1:${w1}</span><span class="week-mini-chip ${w2>0?'met':'unmet'}" title="2-hafta: ${w2}x">H2:${w2}</span><span class="week-mini-chip ${w3>0?'met':'unmet'}" title="3-hafta: ${w3}x">H3:${w3}</span><span class="week-mini-chip ${w4>0?'met':'unmet'}" title="4-hafta: ${w4}x">H4:${w4}</span>`;

      let html = `<td class="habit-name-col">
        <div style="display:flex; align-items:center; gap:4px; flex-wrap:wrap;">
          <span class="freq-badge ${freqClass}">${freqLabel}</span>
          <span title="${habit.routine || 'Vaqt'}">${routineIcon}</span>
          <span contenteditable="true" data-hid="${habit.id}" class="habit-title-edit" style="font-weight:600;">${habit.title}</span>
          ${streakBadge}
        </div>
        <div style="margin-top:3px; display:flex; align-items:center; gap:2px;">
          ${weeklyMini}
        </div>
      </td>`;

      for (let day = 0; day < 31; day++) {
        const isChecked = (habit.days && habit.days[day] === 1);
        if (isChecked) {
          habitRowDoneCount++;
          dayCompletedCounts[day]++;
        }
        totalPossibleHabitChecks++;

        html += `<td class="${isChecked ? 'habit-cell-done' : ''}" style="text-align: center;">
          <input type="checkbox" class="habit-check habit-cell-checkbox" data-hid="${habit.id}" data-day="${day}" ${isChecked ? 'checked' : ''}>
        </td>`;
      }

      totalCompletedChecks += habitRowDoneCount;
      const goal = habit.goal || (habit.frequency === 'weekly' ? 8 : (habit.frequency === 'monthly' ? 2 : 20));
      const progPercent = Math.round((habitRowDoneCount / goal) * 100);
      let rowBadgeClass = 'progress-low';
      if (progPercent >= 80) rowBadgeClass = 'progress-high';
      else if (progPercent >= 50) rowBadgeClass = 'progress-med';

      html += `
        <td style="font-weight:600;"><input type="number" value="${goal}" data-hid="${habit.id}" class="habit-goal-input" style="width:45px; text-align:center; border:none;"></td>
        <td style="font-weight:700; color:#137333;">${habitRowDoneCount}</td>
        <td><span class="habit-progress-badge ${rowBadgeClass}">${progPercent}%</span></td>
        <td>
          <button class="btn btn-secondary" style="padding:1px 4px; font-size:10px; color:#ea4335;" onclick="PlannerApp.deleteHabit(${habit.id})">✕</button>
        </td>
      `;

      tr.innerHTML = html;
      tbody.appendChild(tr);
    });

    // Attach check events
    tbody.querySelectorAll('.habit-check').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const hid = Number(e.target.dataset.hid);
        const day = Number(e.target.dataset.day);
        const h = this.habits.find(x => x.id === hid);
        if (h) {
          if (!h.days) h.days = new Array(31).fill(0);
          h.days[day] = e.target.checked ? 1 : 0;
          if (e.target.checked) {
            this.playCelebrationSound('success');
            this.triggerConfetti();
          }
          this.renderHabitsView();
          this.renderHabitChart();
          this.saveAllData();
        }
      });
    });

    tbody.querySelectorAll('.habit-title-edit').forEach(span => {
      span.addEventListener('blur', (e) => {
        const hid = Number(e.target.dataset.hid);
        const h = this.habits.find(x => x.id === hid);
        if (h) {
          h.title = e.target.innerText.trim();
          this.saveAllData();
        }
      });
    });

    tbody.querySelectorAll('.habit-goal-input').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const hid = Number(e.target.dataset.hid);
        const h = this.habits.find(x => x.id === hid);
        if (h) {
          h.goal = Number(e.target.value) || 20;
          this.renderHabitsView();
          this.saveAllData();
        }
      });
    });

    // Render Footers: Progres %, To'ldirilgan, To'ldirilmagan
    const rowPercent = document.getElementById('habitRowPercent');
    const rowFilled = document.getElementById('habitRowFilled');
    const rowUnfilled = document.getElementById('habitRowUnfilled');

    rowPercent.innerHTML = `<td class="habit-name-col" style="font-weight: 700; background: #fae1dd;">Progres %</td>`;
    rowFilled.innerHTML = `<td class="habit-name-col" style="background: #fdf5f3;">To'ldirilgan</td>`;
    rowUnfilled.innerHTML = `<td class="habit-name-col" style="background: #fdf5f3;">To'ldirilmagan</td>`;

    const totalHabitsInMonth = monthHabits.length;

    for (let day = 0; day < 31; day++) {
      const filled = dayCompletedCounts[day];
      const unfilled = totalHabitsInMonth - filled;
      const pct = totalHabitsInMonth > 0 ? Math.round((filled / totalHabitsInMonth) * 100) : 0;
      let colorClass = 'progress-low';
      if (pct >= 70) colorClass = 'progress-high';
      else if (pct >= 40) colorClass = 'progress-med';

      rowPercent.innerHTML += `<td style="font-weight:600; font-size:10px; padding: 2px;"><span class="habit-progress-badge ${colorClass}">${pct}%</span></td>`;
      rowFilled.innerHTML += `<td style="font-size:11px;">${filled}</td>`;
      rowUnfilled.innerHTML += `<td style="font-size:11px; color:#c5221f;">${unfilled}</td>`;
    }

    rowPercent.innerHTML += `<td colspan="4"></td>`;
    rowFilled.innerHTML += `<td colspan="4"></td>`;
    rowUnfilled.innerHTML += `<td colspan="4"></td>`;

    // Top KPI Update
    document.getElementById('habitTotalCount').textContent = totalHabitsInMonth;
    document.getElementById('habitCompletedCount').textContent = totalCompletedChecks;
    const overallPercent = totalPossibleHabitChecks > 0 ? ((totalCompletedChecks / totalPossibleHabitChecks) * 100).toFixed(2) : "0.00";
    document.getElementById('habitProgressPercent').textContent = `${overallPercent.replace('.', ',')}%`;
    document.getElementById('habitProgressFill').style.width = `${Math.min(overallPercent, 100)}%`;

    this.renderHabitChart();
  },

  addHabitFromModal() {
    const title = document.getElementById('habitInputTitle').value.trim();
    const freqEl = document.getElementById('habitInputFrequency');
    const routEl = document.getElementById('habitInputRoutine');
    const frequency = freqEl ? freqEl.value : 'daily';
    const routine = routEl ? routEl.value : 'anytime';
    const goal = Number(document.getElementById('habitInputGoal').value) || (frequency === 'weekly' ? 8 : (frequency === 'monthly' ? 2 : 20));
    if (!title) return;

    this.habits.push({
      id: Date.now(),
      title,
      month: this.selectedHabitMonth,
      frequency,
      routine,
      days: new Array(31).fill(0),
      goal
    });

    this.renderHabitsView();
    this.saveAllData();
    document.getElementById('habitModal').classList.remove('active');
    document.getElementById('habitForm').reset();
    this.showToast("✓ Yangi odat qo'shildi!");
  },

  deleteHabit(id) {
    this.habits = this.habits.filter(h => h.id !== id);
    this.renderHabitsView();
    this.saveAllData();
  },

  renderHabitChart() {
    const canvas = document.getElementById('habitChartCanvas');
    if (!canvas || typeof Chart === 'undefined') return;

    const monthHabits = this.habits.filter(h => !h.month || h.month === this.selectedHabitMonth);
    const dayData = new Array(31).fill(0);
    monthHabits.forEach(h => {
      if (h.days) {
        h.days.forEach((v, idx) => {
          if (v === 1) dayData[idx]++;
        });
      }
    });

    const labels = Array.from({ length: 31 }, (_, i) => `${i + 1}`);

    if (this.charts.habitChart) {
      this.charts.habitChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 180);
    gradient.addColorStop(0, 'rgba(232, 165, 152, 0.45)');
    gradient.addColorStop(1, 'rgba(232, 165, 152, 0.02)');

    this.charts.habitChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: "Kunlik bajarilgan odatlar",
          data: dayData,
          fill: true,
          backgroundColor: gradient,
          borderColor: '#e8a598',
          borderWidth: 2.5,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: '#d9777f'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 2 }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  },

  // 4. MOLIYA REJASI (MONTHLY FIN PLAN)
  renderFinanceMonthlyView() {
    const year = this.selectedFinYear;
    const month = this.selectedFinMonth;

    // Filter transactions for this year & month
    const monthTx = this.finances.filter(f => {
      if (!f.date) return false;
      const parts = f.date.split('-');
      return parts[0] === year && parts[1] === month;
    });

    let totalIncome = 0;
    let totalExpense = 0;
    let totalPayments = 0;
    let totalDebts = 0;
    let totalSavings = 0;

    const categoryExpenseTotals = {};
    const categoryIncomeTotals = {};

    monthTx.forEach(f => {
      const amt = Number(f.amount) || 0;
      if (f.type === 'Tushum') {
        totalIncome += amt;
        categoryIncomeTotals[f.category] = (categoryIncomeTotals[f.category] || 0) + amt;
      } else if (f.type === 'Xarajat') {
        totalExpense += amt;
        categoryExpenseTotals[f.category] = (categoryExpenseTotals[f.category] || 0) + amt;
      } else if (f.type === 'To\'lov') {
        totalPayments += amt;
        categoryExpenseTotals[f.category] = (categoryExpenseTotals[f.category] || 0) + amt;
      } else if (f.type === 'Qarz') {
        totalDebts += amt;
      } else if (f.type === 'Jamg\'arma') {
        totalSavings += amt;
      }
    });

    const netBalance = totalIncome - totalExpense - totalPayments;
    const spentPercent = totalIncome > 0 ? Math.round(((totalExpense + totalPayments) / totalIncome) * 100) : 0;

    const fmt = (num) => (num || 0).toLocaleString('uz-UZ') + " UZS";

    // USD rate conversion
    const rateInp = document.getElementById('usdRateInput');
    const usdRate = rateInp ? (Number(rateInp.value) || 12035) : 12035;
    const fmtUsd = (num) => "≈ $" + Math.round((num || 0) / usdRate).toLocaleString('en-US') + " USD";

    // KPI update
    document.getElementById('kpiSavings').textContent = fmt(totalSavings);
    const savUsdEl = document.getElementById('kpiSavingsUsd');
    if (savUsdEl) savUsdEl.textContent = fmtUsd(totalSavings);

    document.getElementById('kpiIncome').textContent = fmt(totalIncome);
    const incUsdEl = document.getElementById('kpiIncomeUsd');
    if (incUsdEl) incUsdEl.textContent = fmtUsd(totalIncome);

    document.getElementById('kpiExpenses').textContent = fmt(totalExpense + totalPayments);
    const expUsdEl = document.getElementById('kpiExpensesUsd');
    if (expUsdEl) expUsdEl.textContent = fmtUsd(totalExpense + totalPayments);

    document.getElementById('kpiBalance').textContent = fmt(netBalance);
    const balUsdEl = document.getElementById('kpiBalanceUsd');
    if (balUsdEl) balUsdEl.textContent = fmtUsd(netBalance);

    document.getElementById('kpiSpentPercent').textContent = `${spentPercent}%`;
    document.getElementById('kpiSpentBar').style.width = `${Math.min(spentPercent, 100)}%`;

    // SMART FINANCIAL ADVISOR
    const advTitleEl = document.getElementById('finAdvisorTitle');
    const advMsgEl = document.getElementById('finAdvisorMessage');
    if (advTitleEl && advMsgEl) {
      if (totalIncome === 0 && (totalExpense + totalPayments) === 0) {
        advTitleEl.textContent = "Moliya maslahatchisi:";
        advMsgEl.textContent = "Bu oy uchun hali tranzaksiyalar kiritilmagan. Daromad va xarajatlaringizni qo'shing.";
      } else if (netBalance < 0) {
        advTitleEl.textContent = "⚠️ Ogohlantirish (Xarajatlar tushumdan oshdi):";
        advMsgEl.textContent = `Bu oy xarajatlar daromaddan ${Math.abs(netBalance).toLocaleString('uz-UZ')} UZS ga ko'proq! Qarz olish xavfi mavjud, ikkilamchi xarajatlarni to'xtating.`;
      } else if (spentPercent <= 40) {
        advTitleEl.textContent = "🌟 A'lo moliyaviy intizom:";
        advMsgEl.textContent = `Tushumingizning atigi ${spentPercent}% qismi sarflandi! Qolgan ${(netBalance).toLocaleString('uz-UZ')} UZS ni jamg'armaga yoki investitsiyaga yo'naltirishingiz mumkin.`;
      } else if (spentPercent <= 70) {
        advTitleEl.textContent = "👍 Me'yoriy balans:";
        advMsgEl.textContent = `Tushumning ${spentPercent}% qismi ishlatildi. Reja nazorat ostida, oy oxirigacha kutilmagan xarajatlardan ehtiyot bo'ling.`;
      } else {
        advTitleEl.textContent = "⚠️ Yuqori xarajat darajasi:";
        advMsgEl.textContent = `Tushumning ${spentPercent}% qismi sarflab bo'lindi. Oylik limit tugashiga oz qoldi. Tejash rejimiga o'tish tavsiya etiladi.`;
      }
    }

    // Render Category Box Lists
    this.renderCategoryBox('finBoxPayments', categoryExpenseTotals, ['Mobil Aloqa', 'Kommunalka', 'Uy-joy']);
    this.renderCategoryBox('finBoxExpenses', categoryExpenseTotals);
    this.renderCategoryBox('finBoxIncome', categoryIncomeTotals);
    this.renderCategoryBox('finBoxDebts', { "Kreditlar": 0, "Qarzlar": 0 });
    this.renderCategoryBox('finBoxSavings', { "Oylik jamg'arma": Math.max(0, netBalance) });

    // Render Daily Transaction Tables
    this.renderDailyTransactions(monthTx);

    // Render Charts
    this.renderFinanceCharts(totalIncome, totalExpense + totalPayments, categoryExpenseTotals);
    this.render503020Rule(totalIncome, categoryExpenseTotals, totalSavings);
    this.renderSubscriptionsView();
    this.renderBudgetLimitsView(categoryExpenseTotals);
    this.updateQuickStatsBar();
  },

  renderCategoryBox(elementId, totalsObj, filterKeys = null) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.innerHTML = '';

    const entries = Object.entries(totalsObj);
    if (entries.length === 0) {
      el.innerHTML = `<span style="color:#9aa0a6; font-size:11px;">Ma'lumot yo'q</span>`;
      return;
    }

    entries.forEach(([cat, val]) => {
      if (filterKeys && !filterKeys.includes(cat)) return;
      const row = document.createElement('div');
      row.className = 'fin-cat-item-row';
      row.innerHTML = `
        <span>${cat}</span>
        <b>${(val || 0).toLocaleString('uz-UZ')} UZS</b>
      `;
      el.appendChild(row);
    });
  },

  renderDailyTransactions(monthTx) {
    const expTbody = document.getElementById('expensesTbody');
    const incTbody = document.getElementById('incomesTbody');
    if (!expTbody || !incTbody) return;

    expTbody.innerHTML = '';
    incTbody.innerHTML = '';

    let expenses = monthTx.filter(t => t.type === 'Xarajat' || t.type === 'To\'lov');
    let incomes = monthTx.filter(t => t.type === 'Tushum');

    // Live search on transactions
    if (this.searchQuery) {
      expenses = expenses.filter(e => `${e.category} ${e.note || ''} ${e.date}`.toLowerCase().includes(this.searchQuery));
      incomes = incomes.filter(i => `${i.category} ${i.note || ''} ${i.date}`.toLowerCase().includes(this.searchQuery));
    }

    expenses.forEach(e => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${e.date}</td>
        <td><b>${e.category}</b></td>
        <td style="color:#c5221f; font-weight:600;">-${(e.amount || 0).toLocaleString('uz-UZ')}</td>
        <td style="color:#5f6368;">${e.note || ''}</td>
        <td style="text-align:right;">
          <button class="btn btn-secondary" style="padding:1px 4px; font-size:10px; color:#ea4335;" onclick="PlannerApp.deleteFinance(${e.id})">✕</button>
        </td>
      `;
      expTbody.appendChild(tr);
    });

    incomes.forEach(i => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i.date}</td>
        <td><b>${i.category}</b></td>
        <td style="color:#137333; font-weight:600;">+${(i.amount || 0).toLocaleString('uz-UZ')}</td>
        <td style="color:#5f6368;">${i.note || ''}</td>
        <td style="text-align:right;">
          <button class="btn btn-secondary" style="padding:1px 4px; font-size:10px; color:#ea4335;" onclick="PlannerApp.deleteFinance(${i.id})">✕</button>
        </td>
      `;
      incTbody.appendChild(tr);
    });
  },

  addExpense() {
    const date = document.getElementById('expDate').value;
    const category = document.getElementById('expCategory').value;
    const amount = Number(document.getElementById('expAmount').value) || 0;
    const note = document.getElementById('expNote').value.trim();

    if (!amount) return;

    this.finances.push({
      id: Date.now(),
      date,
      type: "Xarajat",
      category,
      amount,
      note
    });

    document.getElementById('expAmount').value = '';
    document.getElementById('expNote').value = '';

    this.renderFinanceMonthlyView();
    this.renderYearFinanceView();
    this.saveAllData();
  },

  addIncome() {
    const date = document.getElementById('incDate').value;
    const category = document.getElementById('incCategory').value;
    const amount = Number(document.getElementById('incAmount').value) || 0;
    const note = document.getElementById('incNote').value.trim();

    if (!amount) return;

    this.finances.push({
      id: Date.now(),
      date,
      type: "Tushum",
      category,
      amount,
      note
    });

    document.getElementById('incAmount').value = '';
    document.getElementById('incNote').value = '';

    this.renderFinanceMonthlyView();
    this.renderYearFinanceView();
    this.saveAllData();
  },

  deleteFinance(id) {
    this.finances = this.finances.filter(f => f.id !== id);
    this.renderFinanceMonthlyView();
    this.renderYearFinanceView();
    this.saveAllData();
  },

  // SUBSCRIPTIONS & RECURRING BILLS ENGINE
  renderSubscriptionsView() {
    const tbody = document.getElementById('subscriptionsTbody');
    const badge = document.getElementById('subTotalBadge');
    if (!tbody) return;

    tbody.innerHTML = '';
    let totalMonthly = 0;

    if (!this.subscriptions || this.subscriptions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#9aa0a6; padding: 12px;">Hozircha doimiy obunalar kiritilmagan</td></tr>`;
      if (badge) badge.textContent = "Oylik jami: 0 UZS";
      return;
    }

    this.subscriptions.forEach(sub => {
      totalMonthly += Number(sub.amount) || 0;
      const tr = document.createElement('tr');
      const isPaid = !!sub.paid;

      tr.innerHTML = `
        <td style="text-align: center;">
          <input type="checkbox" class="habit-check" ${isPaid ? 'checked' : ''} onchange="PlannerApp.toggleSubscriptionPaid(${sub.id})" title="${isPaid ? 'To\'langan' : 'Kutilmoqda'}">
        </td>
        <td style="font-weight: 600;">
          ${sub.name}
        </td>
        <td>
          <span style="font-size: 11px; background: rgba(0,0,0,0.04); padding: 2px 6px; border-radius: 4px;">${sub.category || 'Xizmat'}</span>
        </td>
        <td style="font-weight: 700; color: #1a73e8;">
          ${(Number(sub.amount) || 0).toLocaleString('uz-UZ')} UZS
        </td>
        <td>
          Har oyning <b style="color: #b06000;">${sub.dueDay || 1}-kuni</b>
        </td>
        <td style="text-align: center;">
          <button class="btn btn-secondary" style="padding: 1px 6px; font-size: 11px; color: #ea4335;" onclick="PlannerApp.deleteSubscription(${sub.id})" title="O'chirish">✕</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    if (badge) {
      badge.textContent = `Oylik jami: ${(totalMonthly).toLocaleString('uz-UZ')} UZS`;
    }
  },

  addSubscription() {
    const nameInp = document.getElementById('subInputName');
    const catInp = document.getElementById('subInputCategory');
    const amtInp = document.getElementById('subInputAmount');
    const dayInp = document.getElementById('subInputDueDay');

    const name = nameInp ? nameInp.value.trim() : '';
    const category = catInp ? catInp.value : 'Obuna';
    const amount = amtInp ? (Number(amtInp.value) || 0) : 0;
    const dueDay = dayInp ? (Number(dayInp.value) || 1) : 1;

    if (!name || amount <= 0) {
      this.showToast("⚠️ Iltimos, obuna nomi va summasini to'g'ri kiriting!");
      return;
    }

    this.subscriptions.push({
      id: Date.now(),
      name,
      category,
      amount,
      dueDay,
      paid: false
    });

    if (nameInp) nameInp.value = '';
    if (amtInp) amtInp.value = '';
    if (dayInp) dayInp.value = '';

    this.renderSubscriptionsView();
    this.saveAllData();
    this.showToast("✓ Yangi doimiy to'lov qo'shildi!");
  },

  toggleSubscriptionPaid(id) {
    const s = this.subscriptions.find(x => x.id === id);
    if (s) {
      s.paid = !s.paid;
      this.renderSubscriptionsView();
      this.saveAllData();
    }
  },

  deleteSubscription(id) {
    this.subscriptions = this.subscriptions.filter(x => x.id !== id);
    this.renderSubscriptionsView();
    this.saveAllData();
    this.showToast("✓ Obuna o'chirildi");
  },

  renderFinanceCharts(totalIncome = 0, totalExpense = 0, categoryExpenseTotals = {}) {
    if (typeof Chart === 'undefined') return;

    // 1. Plan / Fakt (Bar chart)
    const barCanvas = document.getElementById('finBarChart');
    if (barCanvas) {
      if (this.charts.finBar) this.charts.finBar.destroy();
      this.charts.finBar = new Chart(barCanvas.getContext('2d'), {
        type: 'bar',
        data: {
          labels: ['Tushumlar', 'Xarajatlar'],
          datasets: [{
            label: 'Summa (UZS)',
            data: [totalIncome, totalExpense],
            backgroundColor: ['#8eb68a', '#e8a598'],
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    }

    // 2. Tushum vs Xarajat (Pie chart)
    const pieCanvas = document.getElementById('finPieSummaryChart');
    if (pieCanvas) {
      if (this.charts.finPie) this.charts.finPie.destroy();
      this.charts.finPie = new Chart(pieCanvas.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ['Tushumlar', 'Xarajatlar'],
          datasets: [{
            data: [totalIncome, totalExpense],
            backgroundColor: ['#8eb68a', '#f5b5a8']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }

    // 3. Category Expenses Pie Chart
    const catCanvas = document.getElementById('finCategoryPieChart');
    if (catCanvas) {
      if (this.charts.finCatPie) this.charts.finCatPie.destroy();
      const labels = Object.keys(categoryExpenseTotals);
      const data = Object.values(categoryExpenseTotals);

      this.charts.finCatPie = new Chart(catCanvas.getContext('2d'), {
        type: 'pie',
        data: {
          labels: labels.length ? labels : ['Xarajat yo\'q'],
          datasets: [{
            data: data.length ? data : [1],
            backgroundColor: ['#f7cad0', '#ffb5a7', '#fcd5ce', '#f8edeb', '#e8e8e4', '#d8e2dc', '#ffe5d9']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }
  },

  // 5. YILLIK MOLIYA REJASI (YEARLY FIN PLAN)
  renderYearFinanceView() {
    const tbody = document.getElementById('yearSummaryTbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const year = this.selectedFinYear;
    let yearTotalInc = 0;
    let yearTotalExp = 0;
    let yearTotalSav = 0;

    const monthlyIncData = [];
    const monthlyExpData = [];

    this.monthsUz.forEach((mName, idx) => {
      const monthCode = String(idx + 1).padStart(2, '0');
      let mInc = 0;
      let mExp = 0;
      let mPay = 0;
      let mDebt = 0;

      this.finances.forEach(f => {
        if (!f.date) return;
        const [y, m] = f.date.split('-');
        if (y === year && m === monthCode) {
          const amt = Number(f.amount) || 0;
          if (f.type === 'Tushum') mInc += amt;
          else if (f.type === 'Xarajat') mExp += amt;
          else if (f.type === 'To\'lov') mPay += amt;
          else if (f.type === 'Qarz') mDebt += amt;
        }
      });

      const totalSpent = mExp + mPay;
      const mBalance = mInc - totalSpent;

      yearTotalInc += mInc;
      yearTotalExp += totalSpent;
      yearTotalSav += mBalance;

      monthlyIncData.push(mInc);
      monthlyExpData.push(totalSpent);

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="text-align:left; font-weight:600;">${mName}</td>
        <td>${(mPay || 0).toLocaleString('uz-UZ')}</td>
        <td>${(mExp || 0).toLocaleString('uz-UZ')}</td>
        <td>${(mDebt || 0).toLocaleString('uz-UZ')}</td>
        <td style="color:#137333; font-weight:600;">${(mInc || 0).toLocaleString('uz-UZ')}</td>
        <td style="color:${mBalance >= 0 ? '#1a73e8' : '#c5221f'}; font-weight:700;">${mBalance.toLocaleString('uz-UZ')}</td>
      `;
      tbody.appendChild(tr);
    });

    const fmt = (num) => (num || 0).toLocaleString('uz-UZ') + " UZS";
    document.getElementById('yearTotalIncome').textContent = fmt(yearTotalInc);
    document.getElementById('yearTotalExpense').textContent = fmt(yearTotalExp);
    document.getElementById('yearTotalSavings').textContent = fmt(yearTotalSav);

    // Year chart
    const canvas = document.getElementById('yearBarChart');
    if (canvas && typeof Chart !== 'undefined') {
      if (this.charts.yearBar) this.charts.yearBar.destroy();
      this.charts.yearBar = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
          labels: this.monthsUz,
          datasets: [
            {
              label: 'Tushumlar',
              data: monthlyIncData,
              backgroundColor: '#8eb68a'
            },
            {
              label: 'Xarajatlar',
              data: monthlyExpData,
              backgroundColor: '#e8a598'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }
  },

  // ========================================================
  // 6. SOUND & AUDIO EFFECTS (NATIVE AUDIOCONTEXT HARMONICS)
  // ========================================================
  initSound() {
    const saved = localStorage.getItem('planner_sound_enabled');
    if (saved !== null) {
      this.soundEnabled = saved === 'true';
    }
    const txt = document.getElementById('soundToggleText');
    if (txt) {
      txt.textContent = this.soundEnabled ? "Ovoz: Yoqiq" : "Ovoz: O'chiq";
    }
  },

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem('planner_sound_enabled', this.soundEnabled ? 'true' : 'false');
    const txt = document.getElementById('soundToggleText');
    if (txt) txt.textContent = this.soundEnabled ? "Ovoz: Yoqiq" : "Ovoz: O'chiq";
    this.showToast(this.soundEnabled ? "🔔 Tovush effektlari yoqildi" : "🔕 Tovush o'chirildi");
    if (this.soundEnabled) this.playCelebrationSound('success');
  },

  playCelebrationSound(type = 'success') {
    if (!this.soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      if (type === 'success') {
        // Melodic 4-note ascending chime: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50)
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);

          gain.gain.setValueAtTime(0, now + idx * 0.08);
          gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.08 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.4);
        });
      } else if (type === 'timerDone') {
        // High attention pleasant chime
        [880, 880, 1174.66].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.15);

          gain.gain.setValueAtTime(0, now + idx * 0.15);
          gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.15 + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.15 + 0.5);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.15);
          osc.stop(now + idx * 0.15 + 0.55);
        });
      }
    } catch (e) {
      console.warn("AudioContext playback:", e);
    }
  },

  // ========================================================
  // 7. CONFETTI ANIMATION (PURE HTML5 CANVAS)
  // ========================================================
  triggerConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#34a853', '#4285f4', '#fbbc05', '#ea4335', '#a142f4', '#ff70a6', '#06d6a0'];

    for (let i = 0; i < 70; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 260,
        y: canvas.height * 0.35 + (Math.random() - 0.5) * 120,
        r: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.7) * 14,
        tilt: Math.random() * 10,
        tiltAngleIncremental: (Math.random() * 0.07) + 0.05,
        tiltAngle: 0,
        alpha: 1
      });
    }

    let animationFrame;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach(p => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.tiltAngle) + 3 + p.r / 2) / 2 + p.vy * 0.5;
        p.x += Math.sin(p.tiltAngle) * 2 + p.vx * 0.5;
        p.vx *= 0.98;
        p.vy += 0.25; // gravity
        p.alpha -= 0.009;

        if (p.alpha > 0 && p.y < canvas.height + 20) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.r, p.r / 2, p.tiltAngle, 0, 2 * Math.PI);
          ctx.fill();
          ctx.restore();
        }
      });

      if (alive) {
        animationFrame = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        cancelAnimationFrame(animationFrame);
      }
    };
    render();
  },

  // ========================================================
  // 8. DEEP WORK & POMODORO FOCUS TIMER (OS PIP + FLOATING WIDGET)
  // ========================================================
  initPomodoro() {
    const savedSessions = localStorage.getItem('planner_pomo_sessions');
    if (savedSessions) {
      this.pomoCompletedSessions = Number(savedSessions) || 0;
    }
    const pill = document.getElementById('pomoSessionPill');
    if (pill) pill.textContent = `${this.pomoCompletedSessions} seans`;

    this.initFloatingDraggable();
    this.updatePomodoroDisplay();

    // Notification permission check
    if ('Notification' in window && Notification.permission === 'granted') {
      // ready
    }
  },

  formatPomoTime(totalSecs) {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  },

  setPomodoroMode(mode) {
    this.pausePomodoro();
    this.pomoMode = mode;
    if (mode === 'pomodoro') this.pomoTotalTime = 25 * 60;
    else if (mode === 'deep') this.pomoTotalTime = 50 * 60;
    else if (mode === 'break') this.pomoTotalTime = 5 * 60;
    this.pomoTimeLeft = this.pomoTotalTime;

    // Main card buttons
    document.querySelectorAll('.pomo-mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    // Floating mini widget buttons
    document.querySelectorAll('.pomo-mini-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    this.updatePomodoroDisplay();
  },

  startPomodoro() {
    if (this.pomoTimerId) return;

    // Ask notification permission on first user click
    if ('Notification' in window && Notification.permission === 'default') {
      try { Notification.requestPermission(); } catch (e) {}
    }

    // Toggle main card buttons
    const btnStart = document.getElementById('btnPomoStart');
    const btnPause = document.getElementById('btnPomoPause');
    if (btnStart) btnStart.style.display = 'none';
    if (btnPause) btnPause.style.display = 'inline-block';

    // Toggle floating widget buttons
    const fStart = document.getElementById('btnFloatingPomoStart');
    const fPause = document.getElementById('btnFloatingPomoPause');
    if (fStart) fStart.style.display = 'none';
    if (fPause) fPause.style.display = 'inline-block';

    // Pulse indicators
    const dot = document.getElementById('floatingPomoDot');
    if (dot) dot.classList.add('active');

    this.pomoTimerId = setInterval(() => {
      if (this.pomoTimeLeft > 0) {
        this.pomoTimeLeft--;
        this.updatePomodoroDisplay();
      } else {
        this.onPomodoroComplete();
      }
    }, 1000);

    this.updatePomodoroDisplay();
  },

  pausePomodoro() {
    if (this.pomoTimerId) {
      clearInterval(this.pomoTimerId);
      this.pomoTimerId = null;
    }
    const btnStart = document.getElementById('btnPomoStart');
    const btnPause = document.getElementById('btnPomoPause');
    if (btnStart) btnStart.style.display = 'inline-block';
    if (btnPause) btnPause.style.display = 'none';

    const fStart = document.getElementById('btnFloatingPomoStart');
    const fPause = document.getElementById('btnFloatingPomoPause');
    if (fStart) fStart.style.display = 'inline-block';
    if (fPause) fPause.style.display = 'none';

    const dot = document.getElementById('floatingPomoDot');
    if (dot) dot.classList.remove('active');

    this.updatePomodoroDisplay();
  },

  resetPomodoro() {
    this.pausePomodoro();
    this.pomoTimeLeft = this.pomoTotalTime;
    this.updatePomodoroDisplay();
  },

  updatePomodoroDisplay() {
    const timeStr = this.formatPomoTime(this.pomoTimeLeft);

    // Main card
    const disp = document.getElementById('pomoTimerDisplay');
    if (disp) disp.textContent = timeStr;

    // Header pill
    const headerPomo = document.getElementById('headerPomoText');
    if (headerPomo) headerPomo.textContent = timeStr;

    // Browser tab title
    if (this.pomoTimerId) {
      document.title = `(${timeStr}) 🍅 Super Planner`;
    } else {
      document.title = 'Super Planner Dashboard';
    }

    // In-page floating widget
    const floatingDisp = document.getElementById('floatingPomoTimer');
    if (floatingDisp) floatingDisp.textContent = timeStr;

    // Sync active task name to floating widget
    const taskSelect = document.getElementById('pomoTaskSelect');
    const taskNameElem = document.getElementById('floatingPomoTaskName');
    if (taskNameElem && taskSelect) {
      const selectedOption = taskSelect.options[taskSelect.selectedIndex];
      const title = (selectedOption && selectedOption.value) ? selectedOption.text : "Umumiy fokus";
      taskNameElem.textContent = `🎯 ${title}`;
    }

    // OS Document Picture-in-Picture sync (if open)
    if (this.pipWindow && !this.pipWindow.closed) {
      const pDoc = this.pipWindow.document;
      const pipTimer = pDoc.getElementById('docPipTimerDisplay');
      if (pipTimer) pipTimer.textContent = timeStr;

      const pipDot = pDoc.getElementById('docPipDot');
      if (pipDot) {
        pipDot.style.background = this.pomoTimerId ? '#ea4335' : '#34a853';
      }

      const pStart = pDoc.getElementById('docPipBtnStart');
      const pPause = pDoc.getElementById('docPipBtnPause');
      if (pStart && pPause) {
        pStart.style.display = this.pomoTimerId ? 'none' : 'inline-block';
        pPause.style.display = this.pomoTimerId ? 'inline-block' : 'none';
      }

      // Update active mode in PiP
      ['pomodoro', 'deep', 'break'].forEach(m => {
        const btn = pDoc.getElementById(`docPipMode_${m}`);
        if (btn) btn.classList.toggle('active', this.pomoMode === m);
      });
    }

    // Fallback Canvas Video PiP stream update
    const canvas = document.getElementById('pipCanvas');
    if (canvas && this.pipCanvasStream) {
      this.renderPipCanvas(canvas);
    }
  },

  onPomodoroComplete() {
    this.pausePomodoro();
    this.pomoCompletedSessions++;
    localStorage.setItem('planner_pomo_sessions', this.pomoCompletedSessions);

    const pill = document.getElementById('pomoSessionPill');
    if (pill) pill.textContent = `${this.pomoCompletedSessions} seans`;

    this.playCelebrationSound('timerDone');
    this.triggerConfetti();

    const selectedTaskId = document.getElementById('pomoTaskSelect')?.value;
    let taskName = "";
    if (selectedTaskId) {
      const task = this.tasks.find(t => String(t.id) === String(selectedTaskId));
      if (task) {
        taskName = ` ("${task.title}")`;
        task.status = "✅ Bajarildi";
        task.checked = true;
        this.renderAllViews();
        this.saveAllData();
      }
    }

    // OS Push Notification (Shows over Windows Desktop / Taskbar)
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification("🍅 Pomodoro Fokus Yakunlandi!", {
          body: this.pomoMode === 'break' 
            ? "Tanaffus tugadi! Yangi fokus seansiga tayyormisiz?" 
            : `Fokus vaqti tugadi! Ajoyib mehnat qildingiz.${taskName} 5 daqiqa dam oling.`,
          tag: 'pomo-done',
          renotify: true
        });
      } catch (e) {
        console.warn("Notification error:", e);
      }
    }

    const completionMsg = this.pomoMode === 'break'
      ? "☕ Tanaffus vaqti tugadi! Navbatdagi fokus seansiga tayyormisiz?"
      : `🎉 Fokus seansi muvaffaqiyatli yakunlandi!${taskName} 5 daqiqa dam oling.`;

    this.showToast(completionMsg);
    this.resetPomodoro();
  },

  // ----------------------------------------------------
  // OS-LEVEL ALWAYS-ON-TOP PICTURE-IN-PICTURE (PIP) ENGINE
  // ----------------------------------------------------
  async togglePipWindow() {
    // If PiP is already open, close it
    if (this.pipWindow && !this.pipWindow.closed) {
      try {
        this.pipWindow.close();
      } catch (e) {}
      this.pipWindow = null;
      this.updatePipButtonsState(false);
      this.showToast("📌 Pop-up oyna yopildi.");
      return;
    }

    // Try modern Document Picture-in-Picture API (Chrome 116+, Edge on Windows)
    if ('documentPictureInPicture' in window) {
      try {
        const pipWin = await window.documentPictureInPicture.requestWindow({
          width: 320,
          height: 220,
        });
        this.pipWindow = pipWin;
        this.setupDocumentPipWindow(pipWin);
        this.updatePipButtonsState(true);
        this.showToast("📌 Pop-up oyna ochildi! U barcha ilovalar ustida chiqib turadi.");
        return;
      } catch (err) {
        console.warn("documentPictureInPicture xatosi, video PiP rejimiga o'tilmoqda:", err);
      }
    }

    // Fallback 1: Video PiP using Canvas stream (Standard browser Picture-in-Picture)
    if (document.pictureInPictureEnabled || ('requestPictureInPicture' in HTMLVideoElement.prototype)) {
      try {
        await this.openVideoPip();
        this.updatePipButtonsState(true);
        this.showToast("📌 Video PiP pop-up yoqildi! (Ekranda doimiy qalqib turadi)");
        return;
      } catch (err) {
        console.warn("Video PiP xatosi:", err);
      }
    }

    // Fallback 2: In-page floating widget
    this.showFloatingWidget();
    this.showToast("📌 Sahifadagi suzuvchi pop-up taymer yoqildi!");
  },

  setupDocumentPipWindow(pipWin) {
    const isDark = document.body.classList.contains('dark-theme');
    const doc = pipWin.document;
    doc.title = "🍅 Pomodoro Fokus Taymeri";

    const style = doc.createElement('style');
    style.textContent = `
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      body {
        background: ${isDark ? '#1e1f20' : '#ffffff'};
        color: ${isDark ? '#e3e3e3' : '#202124'};
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        padding: 12px;
        user-select: none;
        overflow: hidden;
      }
      .pip-header {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 600;
        color: ${isDark ? '#9aa0a6' : '#5f6368'};
        margin-bottom: 2px;
      }
      .pip-dot {
        width: 8px; height: 8px; border-radius: 50%;
        background: ${this.pomoTimerId ? '#ea4335' : '#34a853'};
        display: inline-block;
      }
      .pip-task {
        font-size: 11px;
        color: ${isDark ? '#8ab4f8' : '#1a73e8'};
        max-width: 270px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 6px;
      }
      .pip-timer {
        font-size: 40px;
        font-weight: 800;
        letter-spacing: 1.5px;
        color: ${isDark ? '#ffffff' : '#202124'};
        font-variant-numeric: tabular-nums;
        line-height: 1.1;
        margin-bottom: 8px;
      }
      .pip-modes {
        display: flex;
        gap: 6px;
        margin-bottom: 12px;
      }
      .pip-mode-btn {
        padding: 3px 10px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
        border: 1px solid ${isDark ? '#444746' : '#dadce0'};
        background: transparent;
        color: ${isDark ? '#c4c7c5' : '#5f6368'};
        cursor: pointer;
      }
      .pip-mode-btn.active {
        background: #1a73e8;
        color: #ffffff;
        border-color: #1a73e8;
      }
      .pip-controls {
        display: flex;
        gap: 8px;
      }
      .pip-btn {
        padding: 6px 14px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        border: none;
        transition: transform 0.1s, opacity 0.15s;
      }
      .pip-btn:hover { opacity: 0.9; }
      .pip-btn:active { transform: scale(0.96); }
      .pip-btn-primary {
        background: #1a73e8;
        color: white;
      }
      .pip-btn-secondary {
        background: ${isDark ? '#303134' : '#f1f3f4'};
        color: ${isDark ? '#e3e3e3' : '#3c4043'};
        border: 1px solid ${isDark ? '#444746' : '#dadce0'};
      }
    `;
    doc.head.appendChild(style);

    const taskSelect = document.getElementById('pomoTaskSelect');
    const selectedOption = taskSelect ? taskSelect.options[taskSelect.selectedIndex] : null;
    const taskName = (selectedOption && selectedOption.value) ? selectedOption.text : 'Umumiy Fokus';

    doc.body.innerHTML = `
      <div class="pip-header">
        <span class="pip-dot" id="docPipDot"></span>
        <span id="docPipModeTitle">🍅 Fokus Taymer</span>
      </div>
      <div class="pip-task" id="docPipTaskName">🎯 ${taskName}</div>
      <div class="pip-timer" id="docPipTimerDisplay">${this.formatPomoTime(this.pomoTimeLeft)}</div>
      <div class="pip-modes">
        <button class="pip-mode-btn ${this.pomoMode === 'pomodoro' ? 'active' : ''}" id="docPipMode_pomodoro">25m</button>
        <button class="pip-mode-btn ${this.pomoMode === 'deep' ? 'active' : ''}" id="docPipMode_deep">50m</button>
        <button class="pip-mode-btn ${this.pomoMode === 'break' ? 'active' : ''}" id="docPipMode_break">5m</button>
      </div>
      <div class="pip-controls">
        <button class="pip-btn pip-btn-primary" id="docPipBtnStart" style="${this.pomoTimerId ? 'display:none' : ''}">▶ Boshlash</button>
        <button class="pip-btn pip-btn-secondary" id="docPipBtnPause" style="${!this.pomoTimerId ? 'display:none' : ''}">⏸ Pauza</button>
        <button class="pip-btn pip-btn-secondary" id="docPipBtnReset">🔄 Qayta</button>
      </div>
    `;

    // Bind event handlers inside PiP
    const modePomo = doc.getElementById('docPipMode_pomodoro');
    const modeDeep = doc.getElementById('docPipMode_deep');
    const modeBreak = doc.getElementById('docPipMode_break');
    const btnStart = doc.getElementById('docPipBtnStart');
    const btnPause = doc.getElementById('docPipBtnPause');
    const btnReset = doc.getElementById('docPipBtnReset');

    if (modePomo) modePomo.onclick = () => this.setPomodoroMode('pomodoro');
    if (modeDeep) modeDeep.onclick = () => this.setPomodoroMode('deep');
    if (modeBreak) modeBreak.onclick = () => this.setPomodoroMode('break');
    if (btnStart) btnStart.onclick = () => this.startPomodoro();
    if (btnPause) btnPause.onclick = () => this.pausePomodoro();
    if (btnReset) btnReset.onclick = () => this.resetPomodoro();

    pipWin.addEventListener('pagehide', () => {
      this.pipWindow = null;
      this.updatePipButtonsState(false);
    });
  },

  async openVideoPip() {
    const canvas = document.getElementById('pipCanvas');
    const video = document.getElementById('pipVideo');
    if (!canvas || !video) return;

    this.renderPipCanvas(canvas);
    if (!this.pipCanvasStream) {
      this.pipCanvasStream = canvas.captureStream(15);
      video.srcObject = this.pipCanvasStream;
      await video.play().catch(() => {});
    }

    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else {
      await video.requestPictureInPicture();
    }
  },

  renderPipCanvas(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const isDark = document.body.classList.contains('dark-theme');

    ctx.fillStyle = isDark ? '#1e1f20' : '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // Title
    ctx.fillStyle = isDark ? '#8ab4f8' : '#1a73e8';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.pomoMode === 'break' ? '☕ TANAFFUS' : '🍅 POMODORO FOKUS', w / 2, 35);

    // Time
    ctx.fillStyle = isDark ? '#ffffff' : '#202124';
    ctx.font = 'bold 52px monospace';
    ctx.fillText(this.formatPomoTime(this.pomoTimeLeft), w / 2, 100);

    // Progress bar
    const progress = Math.max(0, Math.min(1, 1 - (this.pomoTimeLeft / this.pomoTotalTime)));
    ctx.fillStyle = isDark ? '#333333' : '#e0e0e0';
    ctx.fillRect(30, 125, w - 60, 10);
    ctx.fillStyle = '#1a73e8';
    ctx.fillRect(30, 125, (w - 60) * progress, 10);

    // Sessions count
    ctx.fillStyle = isDark ? '#aaaaaa' : '#5f6368';
    ctx.font = '13px sans-serif';
    ctx.fillText(`${this.pomoCompletedSessions} ta seans bajarildi`, w / 2, 160);
  },

  updatePipButtonsState(isOpen) {
    const headBtn = document.getElementById('btnHeaderPip');
    const pomoBtn = document.getElementById('btnPomoPip');
    const text = isOpen ? "📌 Ekranda Qolmoqda" : "📌 Ekranda Pop-up";
    if (headBtn) {
      headBtn.classList.toggle('active', isOpen);
      const span = headBtn.querySelector('.pip-btn-text');
      if (span) span.textContent = text.replace('📌 ', '');
    }
    if (pomoBtn) {
      pomoBtn.classList.toggle('active', isOpen);
      pomoBtn.textContent = text;
    }
  },

  showFloatingWidget() {
    const widget = document.getElementById('floatingPomoWidget');
    if (widget) {
      widget.style.display = 'block';
      this.updatePomodoroDisplay();
    }
  },

  hideFloatingWidget() {
    const widget = document.getElementById('floatingPomoWidget');
    if (widget) widget.style.display = 'none';
  },

  toggleFloatingCompact() {
    const widget = document.getElementById('floatingPomoWidget');
    if (!widget) return;
    this.isFloatingCompact = !this.isFloatingCompact;
    widget.classList.toggle('compact', this.isFloatingCompact);
    const btn = document.getElementById('btnFloatingCompact');
    if (btn) btn.textContent = this.isFloatingCompact ? '□' : '_';
  },

  initFloatingDraggable() {
    const widget = document.getElementById('floatingPomoWidget');
    const header = document.getElementById('floatingPomoHeader');
    if (!widget || !header) return;

    let isDragging = false;
    let startX = 0, startY = 0, initialLeft = 0, initialTop = 0;

    const onMouseDown = (e) => {
      // Don't drag if clicked on button inside header
      if (e.target.closest('button')) return;
      isDragging = true;
      const rect = widget.getBoundingClientRect();
      widget.style.right = 'auto';
      widget.style.bottom = 'auto';
      widget.style.left = `${rect.left}px`;
      widget.style.top = `${rect.top}px`;

      startX = e.clientX;
      startY = e.clientY;
      initialLeft = rect.left;
      initialTop = rect.top;

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      let newLeft = initialLeft + deltaX;
      let newTop = initialTop + deltaY;

      // Bound to viewport
      const maxLeft = window.innerWidth - widget.offsetWidth;
      const maxTop = window.innerHeight - widget.offsetHeight;

      newLeft = Math.max(10, Math.min(newLeft, maxLeft - 10));
      newTop = Math.max(10, Math.min(newTop, maxTop - 10));

      widget.style.left = `${newLeft}px`;
      widget.style.top = `${newTop}px`;
    };

    const onMouseUp = () => {
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    header.addEventListener('mousedown', onMouseDown);

    // Touch support for tablets/touch laptops
    header.addEventListener('touchstart', (e) => {
      if (e.target.closest('button')) return;
      const touch = e.touches[0];
      isDragging = true;
      const rect = widget.getBoundingClientRect();
      widget.style.right = 'auto';
      widget.style.bottom = 'auto';
      widget.style.left = `${rect.left}px`;
      widget.style.top = `${rect.top}px`;
      startX = touch.clientX;
      startY = touch.clientY;
      initialLeft = rect.left;
      initialTop = rect.top;
    }, { passive: true });

    header.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      let newLeft = initialLeft + deltaX;
      let newTop = initialTop + deltaY;
      widget.style.left = `${newLeft}px`;
      widget.style.top = `${newTop}px`;
    }, { passive: true });

    header.addEventListener('touchend', () => {
      isDragging = false;
    });
  },

  updatePomodoroTaskSelect() {
    const select = document.getElementById('pomoTaskSelect');
    if (!select) return;
    const curVal = select.value;
    select.innerHTML = '<option value="">-- Vazifani tanlang (ixtiyoriy) --</option>';
    this.tasks.filter(t => !t.status.includes('Bajarildi')).forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `${t.title} (${t.priority})`;
      select.appendChild(opt);
    });
    if (curVal) select.value = curVal;
  },

  // ========================================================
  // 9. 2026 STRATEGIC GOALS & OKRS ENGINE
  // ========================================================
  renderGoalsView() {
    const container = document.getElementById('goalsListGrid');
    if (!container) return;
    container.innerHTML = '';

    if (!this.goals || this.goals.length === 0) {
      container.innerHTML = `<span style="color:var(--text-muted); font-size:12px;">Hozircha strategik maqsadlar yo'q. "+ Maqsad" orqali qo'shing.</span>`;
      return;
    }

    this.goals.forEach(goal => {
      const target = Number(goal.target) || 1;
      const current = Number(goal.current) || 0;
      const percent = Math.min(100, Math.round((current / target) * 100));
      const card = document.createElement('div');
      card.className = 'goal-card';
      card.innerHTML = `
        <div class="goal-header">
          <span class="goal-title">${goal.title}</span>
          <span class="goal-badge">${goal.category || 'OKR'}</span>
        </div>
        <div class="goal-progress-wrap">
          <div class="goal-progress-bar" style="width: ${percent}%;"></div>
        </div>
        <div class="goal-footer">
          <span>${current} / ${target} ${goal.unit || '%'} (${percent}%)</span>
          <div style="display: flex; gap: 6px; align-items: center;">
            <button class="btn btn-secondary" style="padding: 1px 5px; font-size: 10px;" onclick="PlannerApp.updateGoalProgress(${goal.id})">✏️ Yangilash</button>
            <button class="btn btn-secondary" style="padding: 1px 5px; font-size: 10px; color: #ea4335;" onclick="PlannerApp.deleteGoal(${goal.id})">✕</button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  },

  openAddGoalPrompt() {
    const title = prompt("2026-Yil Strategik Maqsad nomi (masalan: English C1 yoki 100 mln jamg'arma):");
    if (!title || !title.trim()) return;

    const category = prompt("Yo'nalish (Ta'lim, Moliya, Karyera, Sog'liq, Shaxsiy):", "Moliya") || "Shaxsiy";
    const targetStr = prompt("Maqsad ko'rsatkichi (raqamda, masalan 100):", "100");
    const target = Number(targetStr) || 100;
    const currentStr = prompt("Hozirgi erishilgan daraja (raqamda, masalan 25):", "0");
    const current = Number(currentStr) || 0;
    const unit = prompt("O'lchov birligi (masalan %, mln UZS, kitob):", "%") || "%";

    const newGoal = {
      id: Date.now(),
      title: title.trim(),
      category: category.trim(),
      target,
      current,
      unit: unit.trim(),
      deadline: "2026-12-31"
    };

    if (!this.goals) this.goals = [];
    this.goals.push(newGoal);
    this.saveAllData();
    this.renderGoalsView();
    this.showToast("✓ Yangi strategik maqsad qo'shildi!");
  },

  updateGoalProgress(id) {
    const goal = (this.goals || []).find(g => g.id === id);
    if (!goal) return;
    const val = prompt(`"${goal.title}" uchun hozirgi ko'rsatkichni kiriting (${goal.unit || ''}):`, goal.current);
    if (val === null) return;
    const num = Number(val);
    if (!isNaN(num)) {
      goal.current = num;
      if (goal.current >= goal.target) {
        this.triggerConfetti();
        this.playCelebrationSound('success');
        this.showToast(`🏆 Tabriklaymiz! "${goal.title}" maqsadiga erishildi!`);
      }
      this.saveAllData();
      this.renderGoalsView();
    }
  },

  deleteGoal(id) {
    if (confirm("Ushbu maqsadni ro'yxatdan o'chirmoqchimisiz?")) {
      this.goals = (this.goals || []).filter(g => g.id !== id);
      this.saveAllData();
      this.renderGoalsView();
      this.showToast("✓ Maqsad o'chirildi");
    }
  },

  // ========================================================
  // 10. PASTEL STICKY NOTES & BRAIN DUMP BOARD
  // ========================================================
  renderStickyNotes() {
    const board = document.getElementById('stickyNotesBoard');
    if (!board) return;
    board.innerHTML = '';

    if (!this.stickyNotes || this.stickyNotes.length === 0) {
      board.innerHTML = `<span style="color:var(--text-muted); font-size:12px; grid-column: 1 / -1;">Doskada hozircha qaydlar yo'q. Rangli tugmalar orqali yangi fikr qo'shing.</span>`;
      return;
    }

    this.stickyNotes.forEach(note => {
      const card = document.createElement('div');
      card.className = `sticky-note note-${note.color || 'yellow'}`;
      card.innerHTML = `
        <div class="sticky-note-header">
          <span>${note.date || ''}</span>
          <button class="sticky-del-btn" onclick="PlannerApp.deleteStickyNote(${note.id})" title="O'chirish">✕</button>
        </div>
        <textarea class="sticky-textarea" placeholder="Fikringizni yozing...">${note.content || ''}</textarea>
      `;

      const textarea = card.querySelector('textarea');
      textarea.addEventListener('input', (e) => {
        note.content = e.target.value;
        this.saveAllData(true);
      });

      board.appendChild(card);
    });
  },

  addStickyNote(color = 'yellow') {
    const now = new Date();
    const dateStr = `Bugun, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newNote = {
      id: Date.now(),
      color,
      content: "",
      date: dateStr
    };
    if (!this.stickyNotes) this.stickyNotes = [];
    this.stickyNotes.unshift(newNote);
    this.saveAllData();
    this.renderStickyNotes();

    setTimeout(() => {
      const firstTextarea = document.querySelector('.sticky-textarea');
      if (firstTextarea) firstTextarea.focus();
    }, 50);
  },

  deleteStickyNote(id) {
    this.stickyNotes = (this.stickyNotes || []).filter(n => n.id !== id);
    this.saveAllData();
    this.renderStickyNotes();
    this.showToast("✓ Qayd o'chirildi");
  },

  // ========================================================
  // 11. CATEGORY BUDGET LIMITS & OVERSPEND MONITOR
  // ========================================================
  renderBudgetLimitsView(categoryExpenseTotals = {}) {
    const tbody = document.getElementById('budgetLimitsTbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!this.budgetLimits || this.budgetLimits.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:12px;">Hozircha limitlar belgilanmagan. "+ Limit belgilash" orqali qo'shing.</td></tr>`;
      return;
    }

    this.budgetLimits.forEach(b => {
      const spent = categoryExpenseTotals[b.category] || 0;
      const limit = Number(b.limit) || 1;
      const percent = Math.round((spent / limit) * 100);
      const remaining = limit - spent;
      const isOver = spent > limit;
      const isWarning = !isOver && percent >= 80;

      const meterClass = isOver ? 'meter-danger' : (isWarning ? 'meter-warning' : 'meter-safe');
      const statusText = isOver ? `⚠️ ${Math.abs(remaining).toLocaleString('uz-UZ')} UZS OSHIB KETDI` : `${remaining.toLocaleString('uz-UZ')} UZS qoldi`;
      const statusColor = isOver ? '#c5221f' : (isWarning ? '#b06000' : '#137333');

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight: 600;">${b.category}</td>
        <td style="font-weight: 600;">${limit.toLocaleString('uz-UZ')} UZS</td>
        <td style="color: ${isOver ? '#c5221f' : 'inherit'}; font-weight: 600;">${spent.toLocaleString('uz-UZ')} UZS</td>
        <td>
          <div class="budget-meter-wrap" title="${percent}%">
            <div class="budget-meter-fill ${meterClass}" style="width: ${Math.min(percent, 100)}%;"></div>
          </div>
          <span style="font-size: 10px; color: var(--text-muted);">${percent}% sarflandi</span>
        </td>
        <td style="font-weight: 700; color: ${statusColor}; font-size: 11px;">
          ${statusText}
        </td>
        <td style="text-align: center;">
          <button class="btn btn-secondary" style="padding: 1px 6px; font-size: 11px; color: #ea4335;" onclick="PlannerApp.deleteBudgetLimit(${b.id})" title="O'chirish">✕</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  },

  openAddBudgetLimitPrompt() {
    const category = prompt("Limit belgilamoqchi bo'lgan xarajat kategoriyasini kiriting (masalan: Oila xarajatlari, Benzin, Ko'ngilochar, Mobil Aloqa):", "Oila xarajatlari");
    if (!category || !category.trim()) return;

    const limitStr = prompt(`"${category}" uchun oylik xarajat limiti (so'mda):`, "5000000");
    const limit = Number(limitStr);
    if (!limit || limit <= 0) {
      this.showToast("⚠️ Iltimos, to'g'ri summa kiriting!");
      return;
    }

    if (!this.budgetLimits) this.budgetLimits = [];
    const existing = this.budgetLimits.find(b => b.category.toLowerCase() === category.trim().toLowerCase());
    if (existing) {
      existing.limit = limit;
    } else {
      this.budgetLimits.push({
        id: Date.now(),
        category: category.trim(),
        limit
      });
    }

    this.saveAllData();
    this.renderFinanceMonthlyView();
    this.showToast("✓ Kategoriya limiti belgilandi!");
  },

  deleteBudgetLimit(id) {
    this.budgetLimits = (this.budgetLimits || []).filter(b => b.id !== id);
    this.saveAllData();
    this.renderFinanceMonthlyView();
    this.showToast("✓ Limit o'chirildi");
  },

  // ========================================================
  // 12. MONEY ROADMAP & NET WORTH ENGINE (DAVE RAMSEY & FIRE)
  // ========================================================
  renderRoadmapView() {
    // 1. Calculate Assets, Liabilities & Net Worth
    let totalAssets = 0;
    let totalLiabilities = 0;

    (this.netWorthAssets || []).forEach(a => { totalAssets += (Number(a.amount) || 0); });
    (this.netWorthLiabilities || []).forEach(l => { totalLiabilities += (Number(l.amount) || 0); });

    const netWorth = totalAssets - totalLiabilities;
    const fmt = (num) => (num || 0).toLocaleString('uz-UZ') + " UZS";

    const nwValEl = document.getElementById('nwTotalNetWorth');
    if (nwValEl) {
      nwValEl.textContent = fmt(netWorth);
      nwValEl.style.color = netWorth >= 0 ? '#1a73e8' : '#c5221f';
    }
    const aValEl = document.getElementById('nwTotalAssetsVal');
    if (aValEl) aValEl.textContent = fmt(totalAssets);
    const lValEl = document.getElementById('nwTotalLiabVal');
    if (lValEl) lValEl.textContent = fmt(totalLiabilities);

    // 2. Calculate Emergency Runway (Months of safety)
    let monthlyBurn = 0;
    const year = this.selectedFinYear;
    const month = this.selectedFinMonth;
    (this.finances || []).forEach(f => {
      if (f.date && f.date.startsWith(`${year}-${month}`) && (f.type === 'Xarajat' || f.type === 'To\'lov')) {
        monthlyBurn += (Number(f.amount) || 0);
      }
    });
    (this.subscriptions || []).forEach(s => {
      monthlyBurn += (Number(s.amount) || 0);
    });

    if (monthlyBurn === 0) monthlyBurn = 10000000;

    // Liquid assets: Bank accounts, Deposits, Cash
    let liquidAssets = 0;
    (this.netWorthAssets || []).forEach(a => {
      const cat = (a.category || '').toLowerCase();
      if (cat.includes('bank') || cat.includes('omonat') || cat.includes('naqd') || cat.includes('jamg')) {
        liquidAssets += (Number(a.amount) || 0);
      }
    });

    const runwayMonths = (liquidAssets / monthlyBurn).toFixed(1);
    const rwMonthsEl = document.getElementById('nwRunwayMonths');
    if (rwMonthsEl) rwMonthsEl.textContent = `${runwayMonths} oy`;

    const rwDescEl = document.getElementById('nwRunwayDesc');
    if (rwDescEl) {
      if (runwayMonths >= 6) rwDescEl.textContent = "🌟 Ajoyib! 6 oydan ko'p to'liq moliyaviy immunitet mavjud.";
      else if (runwayMonths >= 3) rwDescEl.textContent = "👍 Yaxshi. 3 oylik minimal xavfsizlik buferi ta'minlangan.";
      else rwDescEl.textContent = "⚠️ Diqqat: Xavfsizlik yostig'ini kamida 3-6 oylik xarajatga yetkazish tavsiya etiladi.";
    }

    // 3. Render 7 Baby Steps Roadmap
    const roadmapList = document.getElementById('roadmapStepsList');
    if (roadmapList) {
      roadmapList.innerHTML = '';
      let doneStepsCount = 0;
      let activeStageName = "7-Qadam: Moliyaviy Mustaqillik";

      (this.roadmapSteps || []).forEach((step) => {
        const isDone = step.status === 'done';
        const isActive = step.status === 'active';
        if (isDone) doneStepsCount++;
        if (isActive) activeStageName = `${step.id}-Qadam: ${step.title.split(':')[1] || step.title}`;

        const card = document.createElement('div');
        card.className = `roadmap-step-card ${isDone ? 'done-step' : ''} ${isActive ? 'active-step' : ''}`;
        card.innerHTML = `
          <div class="step-num-circle">${isDone ? '✓' : step.id}</div>
          <div>
            <div style="font-weight: 700; font-size: 14px; color: var(--text-main);">${step.title}</div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">${step.desc}</div>
          </div>
          <div style="font-size: 12px; font-weight: 600; color: #1a73e8;">
            🎯 Maqsad: ${step.target}
          </div>
          <div style="text-align: right;">
            <button class="btn btn-secondary" style="font-size: 11px; padding: 4px 10px; cursor: pointer;" onclick="PlannerApp.cycleRoadmapStepStatus(${step.id})">
              ${isDone ? '✅ Bajarildi' : (isActive ? '📍 Hozirgi bosqich' : '⏳ Kutilmoqda')}
            </button>
          </div>
        `;
        roadmapList.appendChild(card);
      });

      const progBadge = document.getElementById('nwRoadmapProgressBadge');
      if (progBadge) progBadge.textContent = `${doneStepsCount}/7 Bajarildi`;

      const stageNameEl = document.getElementById('nwCurrentStageName');
      if (stageNameEl) stageNameEl.textContent = activeStageName;
    }

    // 4. Render Assets Table
    const assetsTbody = document.getElementById('nwAssetsTbody');
    if (assetsTbody) {
      assetsTbody.innerHTML = '';
      (this.netWorthAssets || []).forEach(a => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight: 600;">${a.name}</td>
          <td><span style="font-size: 11px; background: rgba(0,0,0,0.04); padding: 2px 6px; border-radius: 4px;">${a.category}</span></td>
          <td style="font-weight: 700; color: #137333;">${(Number(a.amount) || 0).toLocaleString('uz-UZ')} UZS</td>
          <td style="text-align: center;">
            <button class="btn btn-secondary" style="padding: 1px 5px; font-size: 10px; color: #ea4335;" onclick="PlannerApp.deleteNetWorthItem('asset', ${a.id})">✕</button>
          </td>
        `;
        assetsTbody.appendChild(tr);
      });
      if ((this.netWorthAssets || []).length === 0) {
        assetsTbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:10px;">Aktivlar kiritilmagan</td></tr>`;
      }
    }

    // 5. Render Liabilities Table
    const liabTbody = document.getElementById('nwLiabilitiesTbody');
    if (liabTbody) {
      liabTbody.innerHTML = '';
      (this.netWorthLiabilities || []).forEach(l => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight: 600;">${l.name}</td>
          <td><span style="font-size: 11px; background: rgba(0,0,0,0.04); padding: 2px 6px; border-radius: 4px;">${l.category}</span></td>
          <td style="font-weight: 700; color: #c5221f;">${(Number(l.amount) || 0).toLocaleString('uz-UZ')} UZS</td>
          <td style="text-align: center;">
            <button class="btn btn-secondary" style="padding: 1px 5px; font-size: 10px; color: #ea4335;" onclick="PlannerApp.deleteNetWorthItem('liability', ${l.id})">✕</button>
          </td>
        `;
        liabTbody.appendChild(tr);
      });
      if ((this.netWorthLiabilities || []).length === 0) {
        liabTbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:10px;">Qarz va majburiyatlar yo'q 🎉</td></tr>`;
      }
    }
  },

  cycleRoadmapStepStatus(stepId) {
    const step = (this.roadmapSteps || []).find(s => s.id === stepId);
    if (!step) return;
    if (step.status === 'pending') {
      step.status = 'active';
      this.showToast(`📍 ${step.title} hozirgi asosiy bosqich deb belgilandi!`);
    } else if (step.status === 'active') {
      step.status = 'done';
      this.playCelebrationSound('success');
      this.triggerConfetti();
      this.showToast(`🏆 Tabriklaymiz! "${step.title}" bosqichi yakunlandi!`);
    } else {
      step.status = 'pending';
    }
    this.saveAllData();
    this.renderRoadmapView();
  },

  openAddNetWorthItemPrompt(type) {
    const isAsset = type === 'asset';
    const name = prompt(isAsset ? "Yangi aktiv nomi (masalan: Kapitalbank hisobi, Omonat, Tilla, Mashina):" : "Majburiyat / Qarz nomi (masalan: Ipoteka, Avtokredit, Rassrochka):");
    if (!name || !name.trim()) return;

    const cat = prompt("Kategoriya (Bank hisobi, Omonat, Naqd pul, Mulk, Investitsiya, Kredit, Rassrochka):", isAsset ? "Omonat" : "Kredit") || (isAsset ? "Mulk" : "Qarz");
    const amountStr = prompt("Summasi (so'mda):", "10000000");
    const amount = Number(amountStr);
    if (!amount || amount <= 0) {
      this.showToast("⚠️ Iltimos, to'g'ri summa kiriting!");
      return;
    }

    const newItem = {
      id: Date.now(),
      name: name.trim(),
      category: cat.trim(),
      amount
    };

    if (isAsset) {
      if (!this.netWorthAssets) this.netWorthAssets = [];
      this.netWorthAssets.push(newItem);
    } else {
      if (!this.netWorthLiabilities) this.netWorthLiabilities = [];
      this.netWorthLiabilities.push(newItem);
    }

    this.saveAllData();
    this.renderRoadmapView();
    this.showToast(isAsset ? "✓ Yangi aktiv qo'shildi!" : "✓ Yangi majburiyat qayd etildi");
  },

  deleteNetWorthItem(type, id) {
    if (type === 'asset') {
      this.netWorthAssets = (this.netWorthAssets || []).filter(a => a.id !== id);
    } else {
      this.netWorthLiabilities = (this.netWorthLiabilities || []).filter(l => l.id !== id);
    }
    this.saveAllData();
    this.renderRoadmapView();
    this.showToast("✓ O'chirildi");
  },

  // ========================================================
  // 13. REAL ALARM / BUDILNIK MANAGER
  // ========================================================
  initAlarms() {
    setInterval(() => this.checkAlarms(), 10000);
  },

  checkAlarms() {
    if (!this.alarms || !this.alarms.length) return;
    const now = new Date();
    const curTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const curDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    this.alarms.forEach(alarm => {
      if (!alarm.enabled) return;
      const isDateMatch = !alarm.date || alarm.date === curDate || alarm.date === 'daily';
      const isTimeMatch = alarm.time === curTime;
      const triggerKey = `${curDate}_${curTime}`;

      if (isTimeMatch && isDateMatch && alarm.lastTriggered !== triggerKey) {
        alarm.lastTriggered = triggerKey;
        this.triggerAlarm(alarm);
      }
    });
  },

  triggerAlarm(alarm) {
    this.activeRingingAlarm = alarm;
    const modal = document.getElementById('alarmAlertModal');
    const timeElem = document.getElementById('ringingAlarmTime');
    const labelElem = document.getElementById('ringingAlarmLabel');

    if (timeElem) timeElem.textContent = alarm.time;
    if (labelElem) labelElem.textContent = alarm.title || "Ertalab turish vaqti!";
    if (modal) {
      modal.classList.add('active');
      modal.style.display = 'flex';
    }

    this.playAlarmAudio();

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification("⏰ BUDILNIK CHALMOQDA!", {
          body: `${alarm.title || "Vaqt bo'ldi!"} (${alarm.time})`,
          requireInteraction: true,
          tag: 'planner-alarm'
        });
      } catch (e) {}
    }

    if ('vibrate' in navigator) {
      try { navigator.vibrate([500, 250, 500, 250, 500]); } catch (e) {}
    }
  },

  dismissActiveAlarm() {
    this.stopAlarmAudio();
    const modal = document.getElementById('alarmAlertModal');
    if (modal) {
      modal.classList.remove('active');
      modal.style.display = 'none';
    }
    if (this.activeRingingAlarm) {
      this.showToast(`🔕 Budilnik o'chirildi: ${this.activeRingingAlarm.title}`);
      this.activeRingingAlarm = null;
    }
  },

  snoozeActiveAlarm(mins = 5) {
    this.stopAlarmAudio();
    const modal = document.getElementById('alarmAlertModal');
    if (modal) {
      modal.classList.remove('active');
      modal.style.display = 'none';
    }
    if (this.activeRingingAlarm) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + mins);
      const newTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      this.activeRingingAlarm.time = newTime;
      this.activeRingingAlarm.lastTriggered = null;
      this.saveAllData(true);
      this.showToast(`⏱️ Budilnik ${mins} daqiqaga qoldirildi (${newTime} gacha)`);
      this.activeRingingAlarm = null;
    }
  },

  getAudioContext() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      if (!this._audioCtx || this._audioCtx.state === 'closed') {
        this._audioCtx = new AudioCtx();
      }
      if (this._audioCtx.state === 'suspended') {
        this._audioCtx.resume();
      }
      return this._audioCtx;
    } catch(e) {
      return null;
    }
  },

  playAlarmAudio() {
    if (this.alarmAudioInterval) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    
    const ringSequence = () => {
      try {
        const now = ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, now + i * 0.1);
          gain.gain.setValueAtTime(0.25, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.09);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.095);
        });
      } catch (e) {}
    };

    ringSequence();
    this.alarmAudioInterval = setInterval(ringSequence, 1200);
  },

  stopAlarmAudio() {
    if (this.alarmAudioInterval) {
      clearInterval(this.alarmAudioInterval);
      this.alarmAudioInterval = null;
    }
  },

  // ========================================================
  // 14. ANTIGRAVITY AI YORDAMCHI (UZBEK NLU & CHAT ENGINE)
  // ========================================================
  initAIChat() {
    const savedType = localStorage.getItem('planner_ai_type');
    if (savedType) this.aiModelType = savedType;

    const savedKey = localStorage.getItem('planner_gemini_key');
    if (savedKey) this.geminiApiKey = savedKey;

    const savedGeminiModel = localStorage.getItem('planner_gemini_model');
    if (savedGeminiModel) this.geminiModel = savedGeminiModel;

    const savedOllamaUrl = localStorage.getItem('planner_ollama_url');
    if (savedOllamaUrl) this.ollamaUrl = savedOllamaUrl;

    const savedOllamaModel = localStorage.getItem('planner_ollama_model');
    if (savedOllamaModel) this.ollamaModel = savedOllamaModel;

    const savedHistory = localStorage.getItem('planner_ai_history');
    if (savedHistory) {
      try { this.aiHistory = JSON.parse(savedHistory); } catch (e) { this.aiHistory = []; }
    }

    this.updateAIModelBadge();

    const typeSelect = document.getElementById('aiModelTypeSelect');
    if (typeSelect) typeSelect.value = this.aiModelType;

    const keyInp = document.getElementById('geminiApiKeyInput');
    if (keyInp) keyInp.value = this.geminiApiKey;

    const geminiModSelect = document.getElementById('geminiModelSelect');
    if (geminiModSelect && this.geminiModel) geminiModSelect.value = this.geminiModel;

    const urlInp = document.getElementById('ollamaUrlInput');
    if (urlInp) urlInp.value = this.ollamaUrl;

    const modInp = document.getElementById('ollamaModelInput');
    if (modInp) modInp.value = this.ollamaModel;

    this.onAIModelTypeChange();
    this.renderAIChatMessages();

    // Restore dock side preference and initialize draggable
    const savedDock = localStorage.getItem('planner_ai_dock');
    const drawer = document.getElementById('aiChatDrawer');
    if (drawer && savedDock === 'left') {
      drawer.classList.add('dock-left');
    }
    this.initAIDraggable();

    // Voice recognition setup (Web Speech API)
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        this.speechRecognition = new SpeechRec();
        this.speechRecognition.lang = 'uz-UZ';
        this.speechRecognition.continuous = false;
        this.speechRecognition.interimResults = false;

        this.speechRecognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          const input = document.getElementById('aiChatInput');
          if (input) {
            input.value = transcript;
            this.sendAIChatMessage();
          }
        };

        this.speechRecognition.onend = () => {
          this.isVoiceListening = false;
          const btn = document.getElementById('btnVoiceInput');
          if (btn) btn.classList.remove('recording');
        };

        this.speechRecognition.onerror = () => {
          this.isVoiceListening = false;
          const btn = document.getElementById('btnVoiceInput');
          if (btn) btn.classList.remove('recording');
        };
      } catch(e) {}
    }
  },

  updateAIModelBadge() {
    const badge = document.getElementById('aiActiveModelBadge');
    if (!badge) return;
    if (this.aiModelType === 'gemini') {
      const hasKey = !!this.geminiApiKey;
      badge.textContent = hasKey ? "✨ Gemini Flash (Faol)" : "⚠️ Gemini (Kalit kiritilmagan)";
      badge.style.background = hasKey ? "linear-gradient(135deg, #1a73e8, #7b1fa2)" : "#fce8e6";
      badge.style.color = hasKey ? "#ffffff" : "#c5221f";
    } else if (this.aiModelType === 'ollama') {
      badge.textContent = `🦙 Ollama (${this.ollamaModel})`;
      badge.style.background = "#e6f4ea";
      badge.style.color = "#137333";
    } else {
      badge.textContent = "⚡ Offline NLU";
      badge.style.background = "#e8f0fe";
      badge.style.color = "#1a73e8";
    }
  },

  toggleGeminiKeyVisibility() {
    const inp = document.getElementById('geminiApiKeyInput');
    if (!inp) return;
    inp.type = inp.type === 'password' ? 'text' : 'password';
  },

  async testGeminiKey() {
    const keyInp = document.getElementById('geminiApiKeyInput');
    const modSelect = document.getElementById('geminiModelSelect');
    const key = (keyInp ? keyInp.value.trim() : "") || this.geminiApiKey;
    const model = (modSelect ? modSelect.value : "") || this.geminiModel || "gemini-1.5-flash";
    const testStatus = document.getElementById('geminiTestStatus');

    if (!key) {
      if (testStatus) testStatus.innerHTML = '<span style="color: #c5221f; font-weight: 600;">⚠️ Iltimos, oldin API kalitni kiriting!</span>';
      this.showToast("⚠️ Iltimos, API kalitni kiriting!");
      return;
    }

    if (testStatus) testStatus.innerHTML = '<span style="color: #1a73e8;">🔄 Google Gemini tekshirilmoqda...</span>';

    try {
      const res = await fetch('/api/gemini_proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: key,
          model: model,
          payload: {
            contents: [
              { role: "user", parts: [{ text: "Salom, bir so'z bilan 'OK' deb javob ber." }] }
            ]
          }
        })
      });

      const rawText = await res.text();
      let data = null;
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        data = { error: rawText };
      }

      if (!res.ok || data.error) {
        const errMsg = data.error?.message || (typeof data.error === 'string' ? data.error : JSON.stringify(data.error)) || "Ulanishda xatolik yuz berdi";
        if (testStatus) testStatus.innerHTML = `<span style="color: #c5221f; font-weight: 600;">❌ Xato: ${errMsg}</span>`;
        this.showToast(`❌ Xato: ${errMsg}`);
      } else {
        if (testStatus) testStatus.innerHTML = '<span style="color: #137333; font-weight: 700;">✅ Ulanish muvaffaqiyatli! Gemini tayyor.</span>';
        this.showToast("✅ Gemini API kaliti muvaffaqiyatli tekshirildi!");
      }
    } catch (err) {
      if (testStatus) testStatus.innerHTML = `<span style="color: #c5221f; font-weight: 600;">❌ Tarmoq xatosi: ${err.message}</span>`;
      this.showToast(`❌ Xato: ${err.message}`);
    }
  },

  toggleAIChat() {
    if (this.aiChatOpen) this.closeAIChat();
    else this.openAIChat();
  },

  openAIChat() {
    const drawer = document.getElementById('aiChatDrawer');
    if (drawer) {
      drawer.style.display = 'flex';
      this.aiChatOpen = true;
      const inp = document.getElementById('aiChatInput');
      if (inp) setTimeout(() => inp.focus(), 150);
      this.scrollAIChatToBottom();
    }
    const fab = document.getElementById('floatingAIBtn');
    if (fab) fab.style.display = 'none';
  },

  closeAIChat() {
    const drawer = document.getElementById('aiChatDrawer');
    if (drawer) drawer.style.display = 'none';
    this.aiChatOpen = false;
    const fab = document.getElementById('floatingAIBtn');
    if (fab) fab.style.display = 'inline-flex';
  },

  toggleAISettings() {
    const panel = document.getElementById('aiSettingsPanel');
    const memPanel = document.getElementById('aiMemoryPanel');
    if (memPanel) memPanel.style.display = 'none';
    if (panel) {
      panel.style.display = (panel.style.display === 'none' || !panel.style.display) ? 'block' : 'none';
    }
  },

  toggleAIMemoryPanel() {
    const panel = document.getElementById('aiMemoryPanel');
    const setPanel = document.getElementById('aiSettingsPanel');
    if (setPanel) setPanel.style.display = 'none';
    if (!panel) return;
    const isHidden = (panel.style.display === 'none' || !panel.style.display);
    panel.style.display = isHidden ? 'block' : 'none';
    if (isHidden) {
      this.renderAgentMemoryUI();
    }
  },

  switchMemoryTab(tabName) {
    document.querySelectorAll('.ai-mem-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.ai-mem-tab-content').forEach(c => {
      c.classList.remove('active');
      c.style.display = 'none';
    });

    const activeBtn = document.querySelector(`.ai-mem-tab[data-memtab="${tabName}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    const tabMap = {
      'profile': 'memTabProfile',
      'facts': 'memTabFacts',
      'insights': 'memTabInsights'
    };
    const content = document.getElementById(tabMap[tabName]);
    if (content) {
      content.classList.add('active');
      content.style.display = 'block';
    }
    if (tabName === 'insights') {
      this.renderAgentMemoryUI();
    }
  },

  async loadAgentMemory() {
    try {
      const res = await fetch('/api/data?type=agent_memory');
      if (res.ok) {
        const data = await res.json();
        if (data && data.profile) {
          this.agentMemory = data;
          this.renderAgentMemoryUI();
          return;
        }
      }
    } catch (e) {
      console.warn("Agent memory fetch fallback to local storage:", e);
    }

    const local = localStorage.getItem('planner_agent_memory');
    if (local) {
      try {
        this.agentMemory = JSON.parse(local);
      } catch (err) {}
    }
    this.renderAgentMemoryUI();
  },

  async saveAgentMemory(silent = true) {
    localStorage.setItem('planner_agent_memory', JSON.stringify(this.agentMemory));
    if (this.isServerConnected) {
      try {
        await fetch('/api/save?type=agent_memory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.agentMemory, null, 2)
        });
      } catch (e) {
        console.error("Save agent memory error:", e);
      }
    }
    this.renderAgentMemoryUI();
    if (!silent) this.showToast("✓ AI Xotirasi va bilimlari saqlandi!");
  },

  renderAgentMemoryUI() {
    const mem = this.agentMemory;
    if (!mem) return;

    // Inputs
    const nameInp = document.getElementById('agentMemName');
    if (nameInp) nameInp.value = mem.profile?.name || '';

    const occInp = document.getElementById('agentMemOccupation');
    if (occInp) occInp.value = mem.profile?.occupation || '';

    const wakeInp = document.getElementById('agentMemWakeTime');
    if (wakeInp) wakeInp.value = mem.profile?.wakeTime || '05:00';

    const sleepInp = document.getElementById('agentMemSleepTime');
    if (sleepInp) sleepInp.value = mem.profile?.sleepTime || '23:00';

    const goalInp = document.getElementById('agentMemSavingsGoal');
    if (goalInp) goalInp.value = mem.profile?.monthlySavingsGoal || 5000000;

    const toneSel = document.getElementById('agentMemTone');
    if (toneSel) toneSel.value = mem.profile?.personalityTone || 'coach';

    const visInp = document.getElementById('agentMemPrimaryGoal');
    if (visInp) visInp.value = mem.profile?.primaryGoal || '';

    // Facts counter & list
    const countSpan = document.getElementById('memFactsCount');
    if (countSpan) countSpan.textContent = (mem.learnedFacts || []).length;

    const factsList = document.getElementById('memFactsList');
    if (factsList) {
      if (!mem.learnedFacts || mem.learnedFacts.length === 0) {
        factsList.innerHTML = `<div style="font-size: 11px; color: var(--text-muted); padding: 8px; text-align: center;">Hozircha o'rganilgan faktlar yo'q. Chatda o'zingiz haqingizda yozing yoki qo'lda qo'shing.</div>`;
      } else {
        factsList.innerHTML = mem.learnedFacts.map(f => `
          <div class="mem-fact-item">
            <span class="mem-fact-badge ${f.category || 'shaxsiy'}">${f.category || 'Shaxsiy'}</span>
            <span class="mem-fact-text">${f.fact}</span>
            <button class="mem-fact-del-btn" title="O'chirish" onclick="PlannerApp.deleteAgentFact(${f.id})">✕</button>
          </div>
        `).join('');
      }
    }

    // Live insights box
    const insightsBox = document.getElementById('memLiveInsightsBox');
    if (insightsBox) {
      const pendingTasks = (this.tasks || []).filter(t => !t.checked && !t.status.includes('Bajarildi')).length;
      const completedTasks = (this.tasks || []).filter(t => t.checked || t.status.includes('Bajarildi')).length;
      const totalHabits = (this.habits || []).length;
      
      let curMonthIncome = 0;
      let curMonthExpense = 0;
      (this.finances || []).forEach(f => {
        const amt = Number(f.amount) || 0;
        if (f.type === 'Kirim') curMonthIncome += amt;
        else curMonthExpense += amt;
      });
      const savings = curMonthIncome - curMonthExpense;
      const targetSavings = Number(mem.profile?.monthlySavingsGoal) || 5000000;
      const targetPct = targetSavings > 0 ? Math.min(100, Math.round((savings / targetSavings) * 100)) : 0;

      insightsBox.innerHTML = `
        <div style="font-weight: 700; color: #1a73e8; margin-bottom: 6px;">📊 AI Live Tahlil & Foydalanuvchi Holati:</div>
        <p style="margin: 3px 0;">• <b>Foydalanuvchi:</b> ${mem.profile?.name || 'Foydalanuvchi'} (${mem.profile?.occupation || 'Dasturchi'})</p>
        <p style="margin: 3px 0;">• <b>Uyqu / Uyg'onish:</b> ${mem.profile?.wakeTime || '05:00'} — ${mem.profile?.sleepTime || '23:00'} (Kuniga ~6-7 soat)</p>
        <p style="margin: 3px 0;">• <b>Faol Vazifalar:</b> ${pendingTasks} ta ochiq, ${completedTasks} ta bajarilgan</p>
        <p style="margin: 3px 0;">• <b>Odatlar:</b> ${totalHabits} ta faol shakllantirilayotgan odat</p>
        <p style="margin: 3px 0;">• <b>Joriy Moliya Balansi:</b> ${savings >= 0 ? '+' : ''}${savings.toLocaleString('uz-UZ')} so'm (Oylik maqsadning <b>${targetPct}%</b> qismi)</p>
        <p style="margin: 3px 0;">• <b>AI Xarakteri:</b> ${mem.profile?.personalityTone === 'strict' ? '⚡ Qat\'iy & Talabchan' : (mem.profile?.personalityTone === 'analyst' ? '📊 Moliyaviy Tahlilchi' : '🌱 Ruhlantiruvchi Murabbiy')}</p>
      `;
    }
  },

  saveAgentMemoryProfile() {
    if (!this.agentMemory.profile) this.agentMemory.profile = {};
    const p = this.agentMemory.profile;

    p.name = document.getElementById('agentMemName')?.value.trim() || 'Foydalanuvchi';
    p.occupation = document.getElementById('agentMemOccupation')?.value.trim() || 'Mutaxassis';
    p.wakeTime = document.getElementById('agentMemWakeTime')?.value || '05:00';
    p.sleepTime = document.getElementById('agentMemSleepTime')?.value || '23:00';
    p.monthlySavingsGoal = Number(document.getElementById('agentMemSavingsGoal')?.value) || 5000000;
    p.personalityTone = document.getElementById('agentMemTone')?.value || 'coach';
    p.primaryGoal = document.getElementById('agentMemPrimaryGoal')?.value.trim() || '';

    this.saveAgentMemory(false);
    this.showToast("✓ AI Shaxsiy Profili saqlandi!");
  },

  addManualAgentFact() {
    const inp = document.getElementById('agentMemNewFactInput');
    const catSel = document.getElementById('agentMemNewFactCat');
    if (!inp) return;
    const val = inp.value.trim();
    if (!val) return;

    if (!this.agentMemory.learnedFacts) this.agentMemory.learnedFacts = [];
    this.agentMemory.learnedFacts.unshift({
      id: Date.now(),
      fact: val,
      category: catSel ? catSel.value : 'shaxsiy',
      date: this.getTodayDateStr(),
      source: 'manual'
    });
    inp.value = '';
    this.saveAgentMemory(true);
    this.showToast("✓ Yangi fakt AI xotirasiga qo'shildi!");
  },

  deleteAgentFact(id) {
    if (!this.agentMemory.learnedFacts) return;
    this.agentMemory.learnedFacts = this.agentMemory.learnedFacts.filter(f => f.id !== id);
    this.saveAgentMemory(true);
    this.showToast("Fakt o'chirildi");
  },

  exportAgentMemoryJson() {
    const blob = new Blob([JSON.stringify(this.agentMemory, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent_memory_${this.getTodayDateStr()}.json`;
    a.click();
    URL.revokeObjectURL(a);
    this.showToast("⬇️ AI Xotirasi JSON fayl sifatida yuklab olindi");
  },

  resetAgentMemory() {
    if (confirm("Rostdan ham AI xotirasi va barcha o'rganilgan faktlarni tozalashni xohlaysizmi?")) {
      this.agentMemory = {
        profile: {
          name: "Foydalanuvchi",
          occupation: "Dasturchi / Mutaxassis",
          wakeTime: "05:00",
          sleepTime: "23:00",
          monthlySavingsGoal: 5000000,
          personalityTone: "coach",
          primaryGoal: "Shaxsiy unumdorlik va moliyaviy barqarorlik"
        },
        learnedFacts: [],
        coachingHistory: []
      };
      this.saveAgentMemory(false);
      this.showToast("AI Xotirasi boshlang'ich holatga qaytarildi");
    }
  },

  extractAndLearnFacts(rawText) {
    const text = rawText.trim();
    const lower = text.toLowerCase();
    const learned = [];
    if (!this.agentMemory) return learned;
    if (!this.agentMemory.profile) this.agentMemory.profile = {};
    if (!this.agentMemory.learnedFacts) this.agentMemory.learnedFacts = [];

    const addFact = (factText, category) => {
      const exists = this.agentMemory.learnedFacts.some(f => f.fact.toLowerCase() === factText.toLowerCase());
      if (!exists) {
        const item = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          fact: factText,
          category: category,
          date: this.getTodayDateStr(),
          source: 'chat'
        };
        this.agentMemory.learnedFacts.unshift(item);
        learned.push(item);
      }
    };

    // 1. Name detection
    const nameMatch = lower.match(/(?:mening\s*ismim|ismim|meni)\s*([a-z'ʻʼ`]+)(?:\s*deb\s*chaqir|\b)/i);
    if (nameMatch && !['dasturchi', 'talaba', 'ertaga', 'bugun', 'shu', 'shunday'].includes(nameMatch[1].toLowerCase())) {
      const name = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1);
      this.agentMemory.profile.name = name;
      addFact(`Foydalanuvchining ismi: ${name}`, 'shaxsiy');
    }

    // 2. Profession detection
    const occKeywords = ['dasturchi', 'frontendchi', 'backendchi', 'dizayner', 'iqtisodchi', 'talaba', 'buxgalter', 'muhandis', 'shifokor', 'o\'qituvchi', 'frilanser', 'biznesmen', 'tadbirkor', 'marketolog'];
    for (const kw of occKeywords) {
      if (lower.includes(kw)) {
        const formattedOcc = kw.charAt(0).toUpperCase() + kw.slice(1);
        this.agentMemory.profile.occupation = formattedOcc;
        addFact(`Faoliyat sohasi / Kasbi: ${formattedOcc}`, 'shaxsiy');
        break;
      }
    }

    // 3. Sleep routine
    const sleepMatch = lower.match(/(?:kechki|kechqurun|har\s*kuni)?\s*(?:soat\s*)?(\d{1,2})(?::(\d{2}))?\s*(?:da|ga)?\s*(?:uxlayman|yotaman|uyquga)/i);
    if (sleepMatch) {
      let h = parseInt(sleepMatch[1]);
      let m = sleepMatch[2] ? parseInt(sleepMatch[2]) : 0;
      if (h < 12 && (lower.includes('kechki') || lower.includes('kechqurun') || h < 4)) {
        if (h <= 4) h += 24;
        else h += 12;
      }
      if (h >= 24) h -= 24;
      const sleepTimeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      this.agentMemory.profile.sleepTime = sleepTimeStr;
      addFact(`Kechki uyqu odati: soat ${sleepTimeStr}`, 'kun_tartibi');
    }

    // 4. Wake routine
    const wakeMatch = lower.match(/(?:ertalab|har\s*kuni)?\s*(?:soat\s*)?(\d{1,2})(?::(\d{2}))?\s*(?:da|ga)?\s*(?:turaman|uyg['’`]?onaman)/i);
    if (wakeMatch) {
      let h = parseInt(wakeMatch[1]);
      let m = wakeMatch[2] ? parseInt(wakeMatch[2]) : 0;
      const wakeTimeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      this.agentMemory.profile.wakeTime = wakeTimeStr;
      addFact(`Ertalabki uyg'onish odati: soat ${wakeTimeStr}`, 'kun_tartibi');
    }

    // 5. Savings goal
    const saveGoalMatch = lower.match(/(?:maqsadim|oylik\s*maqsadim|oyiga)?\s*(\d+(?:[.,]\d+)?)\s*(?:mln|million|ming)?\s*(?:so['’`]?m)?\s*(?:jamg['’`]?arish|yig['’`]?ish|orttirish)/i);
    if (saveGoalMatch) {
      let amt = parseFloat(saveGoalMatch[1].replace(',', '.'));
      if (lower.includes('mln') || lower.includes('million')) amt *= 1000000;
      else if (lower.includes('ming')) amt *= 1000;
      if (amt >= 100000) {
        this.agentMemory.profile.monthlySavingsGoal = amt;
        addFact(`Oylik jamg'arma maqsadi: ${amt.toLocaleString('uz-UZ')} so'm`, 'moliya');
      }
    }

    // 6. Lifestyle / Habits / Interests
    if (lower.includes('shakarsiz') || lower.includes('parhez') || lower.includes('vegetarian')) {
      addFact("Oziqlanish odati: shakarsiz / parhez taomlarni ma'qul ko'radi", "shaxsiy");
    }
    if (lower.includes('ingliz tili') || lower.includes('inglizcha')) {
      addFact("Shaxsiy rivojlanish: ingliz tili o'rganadi", "unumdorlik");
    }
    if (lower.includes('zal') || lower.includes('fitness') || lower.includes('sport zal') || lower.includes('yugurish')) {
      addFact("Salomatlik: sport, yugurish yoki fitnes bilan shug'ullanadi", "kun_tartibi");
    }

    if (learned.length > 0) {
      this.saveAgentMemory(true);
    }
    return learned;
  },

  triggerProactiveQuestion() {
    this.openAIChat();
    const nextQ = this.getNextProactiveQuestion();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    this.aiHistory.push({
      role: 'assistant',
      content: `🎯 **Sizni yaxshiroq tushunishim va rejalashtirish uchun savol:**\n${nextQ.question}`,
      coachingCard: nextQ,
      time: timeStr
    });

    localStorage.setItem('planner_ai_history', JSON.stringify(this.aiHistory));
    this.renderAIChatMessages();
  },

  getNextProactiveQuestion() {
    const facts = this.agentMemory?.learnedFacts || [];
    const pool = this.proactiveQuestionsPool || [];
    for (const q of pool) {
      const alreadyAnswered = facts.some(f => f.fact.includes(q.key) || (q.key === 'sleepTime' && this.agentMemory.profile?.sleepTime && this.agentMemory.profile?.sleepTime !== '23:00'));
      if (!alreadyAnswered) return q;
    }
    return pool[Math.floor(Math.random() * pool.length)];
  },

  answerCoachingQuestion(questionId, answerText) {
    const qObj = (this.proactiveQuestionsPool || []).find(q => q.id === questionId) || { category: 'shaxsiy', question: 'Savol' };
    
    // Add user message
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    this.aiHistory.push({
      role: 'user',
      content: answerText,
      time: timeStr
    });

    // Record as learned fact & update profile
    if (!this.agentMemory.learnedFacts) this.agentMemory.learnedFacts = [];
    const factText = `${qObj.question.replace(/^[^\w\s]+/g, '').trim()}: "${answerText}"`;
    this.agentMemory.learnedFacts.unshift({
      id: Date.now(),
      fact: factText,
      category: qObj.category || 'shaxsiy',
      date: this.getTodayDateStr(),
      source: 'interview'
    });

    if (questionId === 'sleep_time') {
      const match = answerText.match(/(\d{1,2}):(\d{2})/);
      if (match) this.agentMemory.profile.sleepTime = `${match[1].padStart(2, '0')}:${match[2]}`;
    }

    this.saveAgentMemory(true);

    // AI Coaching response
    const tone = this.agentMemory.profile?.personalityTone || 'coach';
    let feedback = "";
    if (tone === 'strict') {
      feedback = `✅ **Javobingiz xotiraga qayd etildi!**\nUshbu ma'lumot asosida kuningizni qat'iy intizom va aniq jadvallar bilan nazorat qilib boraman. Har bir soatingiz qadrli!`;
    } else if (tone === 'analyst') {
      feedback = `📊 **Ma'lumotlar bazasiga kiritildi.**\nBu parametr kelgusi tahlillar va samaradorlik hisobotlariga integratsiya qilindi. O'sish ko'rsatkichlaringizni kuzatib boramiz.`;
    } else {
      feedback = `🌱 **Ajoyib! Javobingizni xotiramda saqlab qoldim.**\nSizni kundan-kunga yaxshiroq tushunib, rejalaringizni eng qulay va samarali tarzda tuzishga yordam beraman! ✨`;
    }

    this.aiHistory.push({
      role: 'assistant',
      content: feedback,
      learnedFactAlert: factText,
      time: timeStr
    });

    localStorage.setItem('planner_ai_history', JSON.stringify(this.aiHistory));
    this.renderAIChatMessages();
    this.playCelebrationSound('success');
  },

  onAIModelTypeChange() {
    const typeSelect = document.getElementById('aiModelTypeSelect');
    const geminiRow = document.getElementById('geminiSettingsRow');
    const ollamaRow = document.getElementById('ollamaSettingsRow');
    if (!typeSelect) return;

    const val = typeSelect.value;
    if (geminiRow) geminiRow.style.display = val === 'gemini' ? 'block' : 'none';
    if (ollamaRow) ollamaRow.style.display = val === 'ollama' ? 'block' : 'none';
  },

  saveAISettings() {
    const typeSelect = document.getElementById('aiModelTypeSelect');
    const keyInp = document.getElementById('geminiApiKeyInput');
    const geminiModSelect = document.getElementById('geminiModelSelect');
    const urlInp = document.getElementById('ollamaUrlInput');
    const modInp = document.getElementById('ollamaModelInput');

    if (typeSelect) this.aiModelType = typeSelect.value;
    if (keyInp) this.geminiApiKey = keyInp.value.trim();
    if (geminiModSelect) this.geminiModel = geminiModSelect.value || 'gemini-1.5-flash';
    if (urlInp) this.ollamaUrl = urlInp.value.trim() || 'http://localhost:11434';
    if (modInp) this.ollamaModel = modInp.value.trim() || 'llama3';

    localStorage.setItem('planner_ai_type', this.aiModelType);
    localStorage.setItem('planner_gemini_key', this.geminiApiKey);
    localStorage.setItem('planner_gemini_model', this.geminiModel);
    localStorage.setItem('planner_ollama_url', this.ollamaUrl);
    localStorage.setItem('planner_ollama_model', this.ollamaModel);

    this.updateAIModelBadge();
    this.toggleAISettings();
    this.showToast("✓ AI Model sozlamalari saqlandi!");
  },

  clearAIChatHistory() {
    this.aiHistory = [];
    localStorage.removeItem('planner_ai_history');
    this.renderAIChatMessages();
    this.showToast("Chat tarixi tozalandi");
  },

  renderAIChatMessages() {
    const container = document.getElementById('aiMessagesContainer');
    if (!container) return;

    if (!this.aiHistory || this.aiHistory.length === 0) {
      container.innerHTML = `
        <div class="ai-msg assistant">
          <div class="ai-msg-bubble">
            <p style="font-weight: 600; margin-bottom: 6px;">👋 Assalomu alaykum!</p>
            <p>Men sizning shaxsiy <strong>Antigravity AI Rejalashtiruvchingizman</strong>. Menga shunchaki tabiiy tilda yozing, men barchasini kerakli joylarga avtomatik joylashtiraman:</p>
            <ul style="margin: 8px 0 8px 18px; line-height: 1.5; font-size: 12px;">
              <li><strong>"Ertaga 5 da turishim kerak"</strong> ➔ Vazifaga qo'shaman va 05:00 ga budilnik sozlayman</li>
              <li><strong>"Har kuni ertalab bomdod o'qishim kerak"</strong> ➔ Odatlarga qo'shaman</li>
              <li><strong>"Bugun tushlikka 45 000 so'm ishlatdim"</strong> ➔ Xarajatlarga yozaman</li>
              <li><strong>"Oyiga 15 mln maosh tushdi"</strong> ➔ Daromadlarga qo'shaman</li>
              <li><strong>"25 minut pomodoro fokus boshla"</strong> ➔ Fokus taymerini yoqaman</li>
            </ul>
            <p style="font-size: 11px; color: var(--text-muted);">Quyidagi tayyor namunalardan birini bosib sinab ko'rishingiz mumkin 👇</p>
          </div>
          <span class="ai-msg-time">AI Assistant</span>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    this.aiHistory.forEach(msg => {
      const msgDiv = document.createElement('div');
      msgDiv.className = `ai-msg ${msg.role}`;

      let actionCardsHtml = '';
      if (msg.actions && msg.actions.length > 0) {
        actionCardsHtml = msg.actions.map(act => this.generateActionCardHtml(act)).join('');
      }

      let coachingCardHtml = '';
      if (msg.coachingCard) {
        coachingCardHtml = `
          <div class="ai-coaching-card">
            <div class="ai-coaching-question">🎯 <b>Agent savoli:</b> ${msg.coachingCard.question}</div>
            <div class="ai-coaching-options">
              ${(msg.coachingCard.options || []).map(opt => `<button class="ai-coaching-chip" onclick="PlannerApp.answerCoachingQuestion('${msg.coachingCard.id}', '${opt.replace(/'/g, "\\'")}')">${opt}</button>`).join('')}
            </div>
          </div>
        `;
      }

      let factAlertHtml = '';
      if (msg.learnedFactAlert) {
        factAlertHtml = `
          <div class="ai-learned-fact-alert">
            <span>💡 <b>Yangi bilim xotiraga yozildi:</b> ${msg.learnedFactAlert}</span>
            <button style="background:transparent; border:none; cursor:pointer; font-size:11px; color:#137333; font-weight:700;" onclick="PlannerApp.toggleAIMemoryPanel()">🧠 Ko'rish</button>
          </div>
        `;
      }

      msgDiv.innerHTML = `
        <div class="ai-msg-bubble">
          <div style="white-space: pre-wrap;">${this.formatAIMessageContent(msg.content)}</div>
          ${actionCardsHtml}
          ${coachingCardHtml}
          ${factAlertHtml}
        </div>
        <span class="ai-msg-time">${msg.time || ''}</span>
      `;
      container.appendChild(msgDiv);
    });

    this.scrollAIChatToBottom();
  },

  generateActionCardHtml(act) {
    const actId = act.actionId || act.id || Date.now();
    if (act.type === 'create_task') {
      return `
        <div class="ai-action-card task" id="aiActCard_${actId}">
          <div class="ai-action-header">
            <span>📋 Yangi Vazifa Qo'shildi</span>
            <span style="font-size: 10px; color: var(--text-muted);">${act.deadline || 'Bugun'}</span>
          </div>
          <div class="ai-action-desc">"${act.title}" • Prioritet: ${act.priority || 'Oddiy'}</div>
          <div class="ai-action-btn-row">
            <button class="ai-view-btn" onclick="PlannerApp.switchTabAndHighlight('tab-tasks', '${act.title}')">👁️ Ko'rish</button>
            <button class="ai-undo-btn" onclick="PlannerApp.undoAIAction('create_task', ${actId})">↩️ Bekor qilish</button>
          </div>
        </div>
      `;
    } else if (act.type === 'set_alarm') {
      return `
        <div class="ai-action-card alarm" id="aiActCard_${actId}">
          <div class="ai-action-header">
            <span>⏰ Budilnik Sozlandi</span>
            <span style="font-size: 12px; font-weight: bold; color: #ea4335;">${act.time}</span>
          </div>
          <div class="ai-action-desc">Qo'ng'iroq vaqti: soat ${act.time} (${act.date || 'Ertaga'})</div>
          <div class="ai-action-btn-row">
            <button class="ai-undo-btn" onclick="PlannerApp.undoAIAction('set_alarm', ${actId})">🔕 O'chirish</button>
          </div>
        </div>
      `;
    } else if (act.type === 'create_habit') {
      return `
        <div class="ai-action-card habit" id="aiActCard_${actId}">
          <div class="ai-action-header">
            <span>🔄 Yangi Odat Qo'shildi</span>
            <span style="font-size: 10px; color: var(--text-muted);">${act.frequency === 'weekly' ? 'Haftalik' : 'Kunlik'}</span>
          </div>
          <div class="ai-action-desc">"${act.title}" • Maqsad: ${act.goal || 30} kun</div>
          <div class="ai-action-btn-row">
            <button class="ai-view-btn" onclick="PlannerApp.switchTabAndHighlight('tab-habits', '${act.title}')">👁️ Ko'rish</button>
            <button class="ai-undo-btn" onclick="PlannerApp.undoAIAction('create_habit', ${actId})">↩️ Bekor qilish</button>
          </div>
        </div>
      `;
    } else if (act.type === 'add_finance') {
      const isInc = act.type_op === 'Kirim';
      return `
        <div class="ai-action-card finance" id="aiActCard_${actId}">
          <div class="ai-action-header">
            <span>${isInc ? '🟢 Yangi Daromad' : '🔴 Yangi Xarajat'}</span>
            <span style="font-weight: bold;">${Number(act.amount).toLocaleString('uz-UZ')} so'm</span>
          </div>
          <div class="ai-action-desc">${act.category || 'Moliya'} • ${act.note || ''}</div>
          <div class="ai-action-btn-row">
            <button class="ai-view-btn" onclick="PlannerApp.switchTabAndHighlight('tab-finance-month', '')">👁️ Ko'rish</button>
            <button class="ai-undo-btn" onclick="PlannerApp.undoAIAction('add_finance', ${actId})">↩️ Bekor qilish</button>
          </div>
        </div>
      `;
    } else if (act.type === 'start_pomodoro') {
      return `
        <div class="ai-action-card task">
          <div class="ai-action-header">
            <span>⏱️ Pomodoro Taymer Faol</span>
            <span style="font-weight: bold; color: #1a73e8;">25:00</span>
          </div>
          <div class="ai-action-desc">25 daqiqalik fokus seansi boshlandi</div>
          <div class="ai-action-btn-row">
            <button class="ai-view-btn" onclick="PlannerApp.switchTabAndHighlight('tab-dashboard', '')">👁️ Ko'rish</button>
          </div>
        </div>
      `;
    }
    return '';
  },

  undoAIAction(type, id) {
    if (type === 'create_task') {
      this.tasks = this.tasks.filter(t => t.id !== id);
      this.showToast("↩️ Vazifa bekor qilindi");
    } else if (type === 'set_alarm') {
      this.alarms = (this.alarms || []).filter(a => a.id !== id);
      this.showToast("🔕 Budilnik o'chirildi");
    } else if (type === 'create_habit') {
      this.habits = this.habits.filter(h => h.id !== id);
      this.showToast("↩️ Odat bekor qilindi");
    } else if (type === 'add_finance') {
      this.finances = this.finances.filter(f => f.id !== id);
      this.showToast("↩️ Moliyaviy yozuv bekor qilindi");
    }
    const card = document.getElementById(`aiActCard_${id}`);
    if (card) {
      card.style.opacity = '0.4';
      card.style.pointerEvents = 'none';
      const desc = card.querySelector('.ai-action-desc');
      if (desc) desc.textContent += ' (Bekor qilindi)';
    }
    this.saveAllData(true);
    this.renderAllViews();
  },

  toggleAIDockSide() {
    const drawer = document.getElementById('aiChatDrawer');
    if (!drawer) return;
    drawer.classList.toggle('dock-left');
    drawer.style.left = '';
    drawer.style.right = '';
    drawer.style.top = '';
    drawer.style.bottom = '';
    const isLeft = drawer.classList.contains('dock-left');
    localStorage.setItem('planner_ai_dock', isLeft ? 'left' : 'right');
    this.showToast(isLeft ? "⇋ Chat chap tomonga ko'chirildi" : "⇋ Chat o'ng tomonga ko'chirildi");
  },

  toggleAIMinimize() {
    const drawer = document.getElementById('aiChatDrawer');
    if (!drawer) return;
    drawer.classList.toggle('minimized');
    const isMin = drawer.classList.contains('minimized');
    const btn = document.getElementById('btnAIMinimize');
    if (btn) btn.textContent = isMin ? '□' : '—';
  },

  onAIChatInputResize(textarea) {
    if (!textarea) return;
    textarea.style.height = '38px';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
    const charElem = document.getElementById('aiCharCount');
    if (charElem) charElem.textContent = `${textarea.value.length} belgi`;
  },

  initAIDraggable() {
    const drawer = document.getElementById('aiChatDrawer');
    const header = drawer?.querySelector('.ai-drawer-header');
    if (!drawer || !header) return;

    let isDragging = false;
    let startX = 0, startY = 0, initialLeft = 0, initialTop = 0;

    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('button')) return;
      isDragging = true;
      const rect = drawer.getBoundingClientRect();
      drawer.style.right = 'auto';
      drawer.style.bottom = 'auto';
      drawer.style.left = `${rect.left}px`;
      drawer.style.top = `${rect.top}px`;

      startX = e.clientX;
      startY = e.clientY;
      initialLeft = rect.left;
      initialTop = rect.top;

      const onMouseMove = (ev) => {
        if (!isDragging) return;
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        drawer.style.left = `${Math.max(10, Math.min(window.innerWidth - drawer.offsetWidth - 10, initialLeft + dx))}px`;
        drawer.style.top = `${Math.max(10, Math.min(window.innerHeight - drawer.offsetHeight - 10, initialTop + dy))}px`;
      };

      const onMouseUp = () => {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  },

  formatAIMessageContent(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  },

  scrollAIChatToBottom() {
    const container = document.getElementById('aiMessagesContainer');
    if (container) {
      setTimeout(() => { container.scrollTop = container.scrollHeight; }, 50);
    }
  },

  sendQuickPrompt(text) {
    this.openAIChat();
    const input = document.getElementById('aiChatInput');
    if (input) {
      input.value = text;
      this.sendAIChatMessage();
    }
  },

  sendHeroPrompt() {
    const heroInp = document.getElementById('aiHeroInput');
    if (!heroInp) return;
    const val = heroInp.value.trim();
    if (!val) return;
    heroInp.value = '';
    this.openAIChat();
    const chatInp = document.getElementById('aiChatInput');
    if (chatInp) chatInp.value = val;
    this.sendAIChatMessage();
  },

  toggleVoiceInputHero() {
    if (!this.speechRecognition) {
      this.showToast("⚠️ Brauzeringiz ovozli kiritishni (Web Speech API) qo'llab-quvvatlamaydi.");
      return;
    }
    try {
      this.speechRecognition.start();
      this.showToast("🎙️ Gapiring... (O'zbek tilida tinglanmoqda)");
      this.speechRecognition.onresult = (e) => {
        const text = e.results[0][0].transcript;
        const heroInp = document.getElementById('aiHeroInput');
        if (heroInp) {
          heroInp.value = text;
          this.sendHeroPrompt();
        }
      };
    } catch(err) {
      console.warn("Speech error:", err);
    }
  },

  onAIChatKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.sendAIChatMessage();
    }
  },

  toggleVoiceInput() {
    if (!this.speechRecognition) {
      this.showToast("⚠️ Brauzeringiz ovozli kiritishni (Web Speech API) qo'llab-quvvatlamaydi.");
      return;
    }
    const btn = document.getElementById('btnVoiceInput');
    if (this.isVoiceListening) {
      this.speechRecognition.stop();
      this.isVoiceListening = false;
      if (btn) btn.classList.remove('recording');
    } else {
      try {
        this.speechRecognition.start();
        this.isVoiceListening = true;
        if (btn) btn.classList.add('recording');
        this.showToast("🎙️ Gapiring... (O'zbek tilida tinglanmoqda)");
      } catch (err) {
        this.isVoiceListening = false;
        if (btn) btn.classList.remove('recording');
      }
    }
  },

  async sendAIChatMessage() {
    const input = document.getElementById('aiChatInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    input.value = '';

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // 1. Add user message
    this.aiHistory.push({
      role: 'user',
      content: text,
      time: timeStr
    });
    this.renderAIChatMessages();

    // 2. Extract and learn facts from user message
    const newLearnedFacts = this.extractAndLearnFacts(text);

    // Show temporary thinking state
    const container = document.getElementById('aiMessagesContainer');
    const thinkingId = 'aiThinkingMsg_' + Date.now();
    if (container) {
      const thinkingDiv = document.createElement('div');
      thinkingDiv.id = thinkingId;
      thinkingDiv.className = 'ai-msg assistant';
      thinkingDiv.innerHTML = `
        <div class="ai-msg-bubble" style="opacity: 0.7; font-style: italic;">
          ✨ AI tahlil qilmoqda va xotiradan rejalashtirmoqda...
        </div>
      `;
      container.appendChild(thinkingDiv);
      this.scrollAIChatToBottom();
    }

    try {
      let result = null;

      // Check configured model type
      if (this.aiModelType === 'gemini' && this.geminiApiKey) {
        result = await this.queryGeminiModel(text);
      } else if (this.aiModelType === 'ollama') {
        result = await this.queryOllamaModel(text);
      }

      // Fallback to built-in Offline Uzbek NLU Engine
      if (!result || !result.reply) {
        result = this.parseUzbekNaturalLanguage(text);
      }

      // Execute all parsed actions
      if (result.actions && result.actions.length > 0) {
        result.actions.forEach(action => this.executeAIAction(action));
        this.saveAllData(true);
        this.renderAllViews();
      }

      // Remove thinking element
      const thinkingElem = document.getElementById(thinkingId);
      if (thinkingElem) thinkingElem.remove();

      // Add assistant response
      this.aiHistory.push({
        role: 'assistant',
        content: result.reply,
        actions: result.actions || [],
        coachingCard: result.coachingCard || null,
        learnedFactAlert: (newLearnedFacts && newLearnedFacts.length > 0) ? newLearnedFacts.map(f => f.fact).join('; ') : (result.learnedFactAlert || null),
        time: timeStr
      });

      if (this.aiHistory.length > 50) this.aiHistory = this.aiHistory.slice(-50);
      localStorage.setItem('planner_ai_history', JSON.stringify(this.aiHistory));

      this.renderAIChatMessages();
      this.playCelebrationSound('success');

    } catch (err) {
      console.error("AI chat error:", err);
      const thinkingElem = document.getElementById(thinkingId);
      if (thinkingElem) thinkingElem.remove();

      // Run offline fallback
      const fallback = this.parseUzbekNaturalLanguage(text);
      if (fallback.actions && fallback.actions.length > 0) {
        fallback.actions.forEach(action => this.executeAIAction(action));
        this.saveAllData(true);
        this.renderAllViews();
      }

      this.aiHistory.push({
        role: 'assistant',
        content: fallback.reply,
        actions: fallback.actions || [],
        coachingCard: fallback.coachingCard || null,
        learnedFactAlert: (newLearnedFacts && newLearnedFacts.length > 0) ? newLearnedFacts.map(f => f.fact).join('; ') : null,
        time: timeStr
      });
      this.renderAIChatMessages();
    }
  },

  // ========================================================
  // UZBEK NATURAL LANGUAGE UNDERSTANDING & INTENT PARSER
  // ========================================================

  // Helper 1: Detects if user is asking to verify/check status rather than add blindly
  isVerificationQuestion(lower) {
    return (
      lower.includes('qo\'shdingmi') || 
      lower.includes('qo\'shildimi') || 
      lower.includes('qo\'shilganmi') ||
      lower.includes('yoki qo\'shdingmi') || 
      lower.includes('yoki qo\'shildimi') ||
      lower.includes('bormi') || 
      lower.includes('mavjudmi') || 
      lower.includes('bormikin') || 
      lower.includes('bormikan') ||
      lower.includes('tekshir') || 
      lower.includes('tekshirchi') || 
      lower.includes('tekshirib ko\'r') ||
      lower.includes('qani ko\'raychi') || 
      lower.includes('jadvaldami') || 
      lower.includes('ro\'yxatdami') ||
      (lower.includes('?') && (lower.includes('qo\'sh') || lower.includes('namoz') || lower.includes('vazifa') || lower.includes('odat') || lower.includes('bor')))
    );
  },

  // Helper 2: Responds to status inquiries without creating duplicate database rows
  handleVerificationQuestion(rawText, lower) {
    // 1. Prayer / Namoz inquiry
    if (lower.includes('namoz') || lower.includes('bomdod') || lower.includes('peshin') || lower.includes('asr') || lower.includes('shom') || lower.includes('xufton') || lower.includes('5 mahal') || lower.includes('besh mahal') || lower.includes('5 ta')) {
      const prayers = (this.habits || []).filter(h => h.title.toLowerCase().includes('namoz'));
      if (prayers.length > 0) {
        const list = prayers.map(p => `• ${p.title}`).join('\n');
        return {
          reply: `✅ **Tekshiruv muvaffaqiyatli:**\n\nHa, tekshirdim! 5 mahal namoz vaqtlari bo'yicha alohida-alohida sozlangan:\n\n${list}\n\n🛡️ **Dublikatdan himoya:** Har bir namoz o'z vaqti bilan alohida kiritilgan va faol. Yangi takroriy qator ochilmadi!`,
          actions: []
        };
      } else {
        return {
          reply: `🔍 **Tekshiruv natijasi:**\nOdatlar jadvalingiz tekshirildi, hozircha namoz vaqtlari kiritilmagan ekan.\nBarcha 5 mahal namozni o'z vaqtlari bilan (05:40, 12:45, 16:15, 18:15, 19:45) alohida qo'shib qo'yaymi?`,
          actions: []
        };
      }
    }

    // 2. Alarm inquiry
    if (lower.includes('budilnik') || lower.includes('turish') || lower.includes('uyg\'on')) {
      const activeAlarms = (this.alarms || []).filter(a => a.enabled !== false);
      if (activeAlarms.length > 0) {
        const list = activeAlarms.map(a => `• ⏰ **${a.time}** — ${a.title}`).join('\n');
        return {
          reply: `⏰ **Faol budilniklar tekshiruvi:**\nSizda quyidagi budilniklar sozlangan va yoqilgan:\n${list}\n\n🛡️ Takroriy budilnik qo'shilmadi.`,
          actions: []
        };
      } else {
        return {
          reply: `⏰ **Tekshiruv:** Hozirda faol budilniklar mavjud emas. Ertaga ertalabki vaqtga budilnik qo'ymoqchimisiz?`,
          actions: []
        };
      }
    }

    // 3. Task inquiry
    if (lower.includes('vazifa') || lower.includes('topshiriq') || lower.includes('ish')) {
      const pending = (this.tasks || []).filter(t => !t.checked && !t.status.includes('Bajarildi'));
      if (pending.length > 0) {
        const list = pending.slice(0, 5).map(t => `• 📌 **${t.title}** (${t.deadline || 'Muddatsiz'})`).join('\n');
        return {
          reply: `📋 **Vazifalar tekshiruvi:**\nSizda ${pending.length} ta faol vazifa mavjud:\n${list}`,
          actions: []
        };
      } else {
        return {
          reply: `🎉 **Tekshiruv:** Barcha vazifalaringiz bajarilgan yoki ro'yxat bo'sh. Yangi vazifa qo'shish uchun shunchaki yozing.`,
          actions: []
        };
      }
    }

    // 4. General Habit inquiry
    if (lower.includes('odat')) {
      const list = (this.habits || []).map(h => `• 🔄 **${h.title}**`).join('\n');
      return {
        reply: `🔄 **Mavjud odatlaringiz ro'yxati (${(this.habits || []).length} ta):**\n${list || 'Hozircha odatlar kiritilmagan.'}`,
        actions: []
      };
    }

    // General fallback check
    return {
      reply: `🔍 **Tekshiruv natijasi:**\n• Odatlar: ${(this.habits || []).map(h => h.title).join(', ') || 'bo\'sh'}\n• Faol vazifalar soni: ${(this.tasks || []).filter(t => !t.checked).length} ta\n• Budilniklar soni: ${(this.alarms || []).length} ta\n\n🛡️ Ma'lumotlaringiz to'liq nazorat ostida, dublikatlar yo'q!`,
      actions: []
    };
  },

  // Helper 3: Deep Entity Title Cleaning for Habits (Removes all conversational fluff)
  cleanHabitEntity(rawText, lower) {
    // Specific Canonical prayer mapping
    if (lower.includes('bomdod')) {
      return {
        title: "🕌 Bomdod namozi (05:40)",
        frequency: "daily",
        routine: "morning",
        goal: 30,
        isValid: true
      };
    }
    if (lower.includes('peshin')) {
      return {
        title: "🕌 Peshin namozi (12:45)",
        frequency: "daily",
        routine: "day",
        goal: 30,
        isValid: true
      };
    }
    if (lower.includes('asr')) {
      return {
        title: "🕌 Asr namozi (16:15)",
        frequency: "daily",
        routine: "day",
        goal: 30,
        isValid: true
      };
    }
    if (lower.includes('shom')) {
      return {
        title: "🕌 Shom namozi (18:15)",
        frequency: "daily",
        routine: "evening",
        goal: 30,
        isValid: true
      };
    }
    if (lower.includes('xufton')) {
      return {
        title: "🕌 Xufton namozi (19:45)",
        frequency: "daily",
        routine: "evening",
        goal: 30,
        isValid: true
      };
    }
    if (lower.includes('kitob') || lower.includes('mutolaa')) {
      return {
        title: "📚 Kitob mutolaasi (30 daqiqa)",
        frequency: "daily",
        routine: "morning",
        goal: 30,
        isValid: true
      };
    }
    if (lower.includes('suv') && (lower.includes('ich') || lower.includes('litr') || lower.includes('2l'))) {
      return {
        title: "💧 2 litr toza suv ichish",
        frequency: "daily",
        routine: "anytime",
        goal: 30,
        isValid: true
      };
    }
    if (lower.includes('sport') || lower.includes('mashq') || lower.includes('yugurish') || lower.includes('zal')) {
      return {
        title: "🏃 Ertalabki badantarbiya / Sport",
        frequency: "daily",
        routine: "morning",
        goal: 30,
        isValid: true
      };
    }
    if (lower.includes('ingliz') || lower.includes('english')) {
      return {
        title: "🇬🇧 Ingliz tili (30 daqiqa)",
        frequency: "daily",
        routine: "day",
        goal: 30,
        isValid: true
      };
    }

    // Generic cleaner: Remove all command phrases and conversational fluff
    let cleaned = rawText
      .replace(/men\s+/gi, '')
      .replace(/yoki\s+qo['’`]?shdingmi.*$/gi, '')
      .replace(/qo['’`]?shdingmi.*$/gi, '')
      .replace(/qo['’`]?shildimi.*$/gi, '')
      .replace(/qo['’`]?shib\s*(?:ber|qo['’`]?y)?/gi, '')
      .replace(/qo['’`]?shing/gi, '')
      .replace(/qo['’`]?sh/gi, '')
      .replace(/odatga/gi, '')
      .replace(/vazifaga/gi, '')
      .replace(/ro['’`]?yxatga/gi, '')
      .replace(/jadvalga/gi, '')
      .replace(/o['’`]?qiyman/gi, '')
      .replace(/qilaman/gi, '')
      .replace(/bajaraman/gi, '')
      .replace(/qilishim\s+kerak/gi, '')
      .replace(/o['’`]?qishim\s+kerak/gi, '')
      .replace(/bajarishim\s+kerak/gi, '')
      .replace(/har\s+kuni/gi, '')
      .replace(/har\s+hafta/gi, '')
      .replace(/kunlik/gi, '')
      .replace(/haftalik/gi, '')
      .replace(/doimiy/gi, '')
      .replace(/ertalab/gi, '')
      .replace(/kechqurun/gi, '')
      .replace(/kunduzi/gi, '')
      .replace(/kerak/gi, '')
      .replace(/lozim/gi, '')
      .replace(/shart/gi, '')
      .replace(/iltimos/gi, '')
      .replace(/vaqti\s+bilan/gi, '')
      .replace(/bilan/gi, '')
      .trim();

    cleaned = cleaned.replace(/[^\w\s\u0400-\u04FF'ʻʼ`-]/gi, ' ').replace(/\s+/g, ' ').trim();

    if (cleaned.length < 3) {
      return { isValid: false, title: "" };
    }

    return {
      title: cleaned.charAt(0).toUpperCase() + cleaned.slice(1),
      frequency: lower.includes('hafta') ? "weekly" : "daily",
      routine: lower.includes('kech') ? "evening" : (lower.includes('peshin') ? "day" : "morning"),
      goal: lower.includes('hafta') ? 12 : 30,
      isValid: true
    };
  },

  // Helper 4: Checks for semantic duplicates in habits
  checkHabitDuplicate(targetTitle) {
    if (!this.habits || !this.habits.length) return { isDuplicate: false };
    const tLower = targetTitle.toLowerCase();

    // Check by specific prayer name (bomdod, peshin, asr, shom, xufton)
    const prayerKeys = ['bomdod', 'peshin', 'asr', 'shom', 'xufton'];
    for (const key of prayerKeys) {
      if (tLower.includes(key)) {
        const existing = this.habits.find(h => h.title.toLowerCase().includes(key));
        if (existing) {
          if (existing.title.toLowerCase() !== tLower) {
            existing.title = targetTitle;
            this.saveAllData(true);
            this.renderAllViews();
            return { isDuplicate: true, updated: true, existingTitle: targetTitle };
          }
          return { isDuplicate: true, updated: false, existingTitle: existing.title };
        }
      }
    }

    // Exact or normalized match
    const norm = tLower.replace(/[^\w\s]/gi, '').trim();
    const existing = this.habits.find(h => h.title.toLowerCase().replace(/[^\w\s]/gi, '').trim() === norm);
    if (existing) {
      return { isDuplicate: true, updated: false, existingTitle: existing.title };
    }

    return { isDuplicate: false };
  },

  parseUzbekNaturalLanguage(rawText) {
    const text = rawText.trim();
    const lower = text.toLowerCase();
    const actions = [];
    const replyParts = [];

    // =====================================================
    // CHECK 0: VERIFICATION & STATUS INQUIRY ("Qo'shdingmi?", "Bormi?", "Tekshir")
    // =====================================================
    if (this.isVerificationQuestion(lower)) {
      return this.handleVerificationQuestion(text, lower);
    }

    // CHECK 0.1: KNOWLEDGE BASE & PERSONAL PROFILE QUERIES
    if (lower.includes('men haqimda') || lower.includes('nima bilasan') || lower.includes('xotirangda') || lower.includes('mening profilim')) {
      const p = this.agentMemory?.profile || {};
      const facts = this.agentMemory?.learnedFacts || [];
      const factsList = facts.slice(0, 8).map(f => `• [${f.category || 'Shaxsiy'}] ${f.fact}`).join('\n');

      return {
        reply: `🧠 **Siz haqingizdagi Shaxsiy Bilimlar Bazasi:**\n\n` +
               `👤 **Profil:**\n` +
               `• Ism: **${p.name || 'Foydalanuvchi'}**\n` +
               `• Kasb: **${p.occupation || 'Belgilanmagan'}**\n` +
               `• Uyg'onish vaqti: **${p.wakeTime || '05:00'}**\n` +
               `• Uyquga yotish vaqti: **${p.sleepTime || '23:00'}**\n` +
               `• Oylik jamg'arma maqsadi: **${Number(p.monthlySavingsGoal || 0).toLocaleString('uz-UZ')} so'm**\n` +
               `• Bosh maqsad: *"${p.primaryGoal || 'Moliyaviy va shaxsiy rivojlanish'}"*\n\n` +
               `📚 **O'rganilgan faktlar (${facts.length} ta):**\n${factsList || "Hozircha faktlar kiritilmagan."}\n\n` +
               `💡 *Xotirani to'liq ko'rish, tahrirlash yoki yangi fakt qo'shish uchun yuqoridagi 🧠 tugmasini bosing!*`,
        actions: []
      };
    }

    // CHECK 0.2: EXTENDED COMPREHENSIVE DAILY REPORT (Tasks + Habits + Finances)
    if (lower.includes('umumiy hisobot') || lower.includes('umumiy holatim') || lower.includes('kunlik xulosa') || lower.includes('bugungi holat')) {
      const p = this.agentMemory?.profile || {};
      const pendingTasks = this.tasks.filter(t => !t.checked && !t.status.includes('Bajarildi'));
      const doneTasks = this.tasks.filter(t => t.checked || t.status.includes('Bajarildi'));
      
      const todayStr = this.getTodayDateStr();
      const todayFin = this.finances.filter(f => f.date === todayStr && f.type === 'Chiqim');
      const todaySpent = todayFin.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
      
      const todayDayOfMonth = new Date().getDate();
      const dayIdx = Math.min(todayDayOfMonth - 1, 30);
      const habitsDone = this.habits.filter(h => h.days && h.days[dayIdx] === 1).length;

      let curMonthIncome = 0;
      let curMonthExpense = 0;
      this.finances.forEach(f => {
        const amt = Number(f.amount) || 0;
        if (f.type === 'Kirim') curMonthIncome += amt;
        else curMonthExpense += amt;
      });
      const netSavings = curMonthIncome - curMonthExpense;

      return {
        reply: `📊 **Bugungi Kunning Kengaytirilgan Xulosasi:**\n\n` +
               `📋 **Vazifalar:**\n• Bajarildi: **${doneTasks.length} ta** ✅\n• Ochiq vazifalar: **${pendingTasks.length} ta** (Eng muhimi: ${pendingTasks[0]?.title || 'Barcha vazifalar yopilgan'})\n\n` +
               `🔄 **Odatlar:** Bugun **${habitsDone}/${this.habits.length} ta** odat bajarildi ${habitsDone === this.habits.length && this.habits.length > 0 ? '🔥 (100% natija!)' : ''}\n\n` +
               `💸 **Moliya:**\n• Bugungi xarajat: **${todaySpent.toLocaleString('uz-UZ')} so'm**\n• Joriy oylik sof qoldiq: **${netSavings >= 0 ? '+' : ''}${netSavings.toLocaleString('uz-UZ')} so'm**\n\n` +
               `🎯 **Xulosa & Tavsiya:** ${p.name || 'Siz'} reja bo'yicha ketmoqdasiz. Kechki soat ${p.sleepTime || '23:00'} ga qadar qolgan vazifalarni tugatib, unumli dam olishingizni tilayman!`,
        actions: []
      };
    }

    // CHECK 0.3: REQUEST PROACTIVE QUESTION / INTERVIEW
    if (lower.includes('savol ber') || lower.includes('meni o\'rgan') || lower.includes('savol so\'ra') || lower.includes('savol bering')) {
      const q = this.getNextProactiveQuestion();
      return {
        reply: `🎯 **Sizni yaxshiroq o'rganishim uchun savol:**\n${q.question}`,
        coachingCard: q,
        actions: []
      };
    }

    // CHECK 0.4: COACHING & RECOMMENDATIONS
    if (lower.includes('maslahat') || lower.includes('tavsiya')) {
      const p = this.agentMemory?.profile || {};
      const pendingCount = this.tasks.filter(t => !t.checked).length;
      return {
        reply: `💡 **AI Shaxsiy Maslahati:**\n` +
               `1. **Uyg'onish & Fokus:** Soat **${p.wakeTime || '05:00'}** dagi erta turish odatingiz sizga kunda qo'shimcha 2-3 soat tinch fokus vaqti beradi. Bu vaqtdan eng og'ir vazifalaringiz uchun foydalaning.\n` +
               `2. **Vazifalar oqimi:** Hozirda sizda **${pendingCount} ta** faol topshiriq bor. Pomodoro (25 daqiqa fokus) uslubida bittalab yopishni tavsiya qilaman.\n` +
               `3. **Moliyaviy intizom:** Oylik maqsadingiz bo'lgan **${Number(p.monthlySavingsGoal || 5000000).toLocaleString('uz-UZ')} so'm** jamg'armaga erishish uchun xarajatlaringizni kundalik qayd etib boring.\n\n` +
               `Siz bilan yanada aniqroq reja tuzishim uchun menga qo'shimcha ma'lumot berishingiz yoki *"savol ber"* deb yozishingiz mumkin!`,
        actions: []
      };
    }

    // CHECK 0.5: ANALYTICAL & Q&A QUERIES (Hisobot va Tahlillar)
    if (lower.includes('qancha pul') || lower.includes('qancha xarajat') || lower.includes('qancha ishlatdim') || lower.includes('bugungi xarajat')) {
      const todayStr = this.getTodayDateStr();
      const todayFin = this.finances.filter(f => f.date === todayStr && f.type === 'Chiqim');
      const todayTotal = todayFin.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
      let catBreakdown = todayFin.map(f => `• ${f.category}: ${Number(f.amount).toLocaleString('uz-UZ')} UZS (${f.note || ''})`).join('\n');
      if (!catBreakdown) catBreakdown = "Bugun hali xarajat qilinmagan.";

      return {
        reply: `📊 **Bugungi Xarajatlar Hisoboti (${todayStr}):**\nJami chiqim: **${todayTotal.toLocaleString('uz-UZ')} so'm**\n\n${catBreakdown}`,
        actions: []
      };
    }

    if (lower.includes('balans') || lower.includes('oylik hisobot') || lower.includes('moliya hisobot') || lower.includes('qancha qoldi')) {
      let curMonthIncome = 0;
      let curMonthExpense = 0;
      this.finances.forEach(f => {
        const amt = Number(f.amount) || 0;
        if (f.type === 'Kirim') curMonthIncome += amt;
        else curMonthExpense += amt;
      });
      const net = curMonthIncome - curMonthExpense;

      return {
        reply: `🪙 **Joriy Moliya Balansi:**\n• Jami Kirim: **${curMonthIncome.toLocaleString('uz-UZ')} so'm**\n• Jami Chiqim: **${curMonthExpense.toLocaleString('uz-UZ')} so'm**\n• Sof Qoldiq: **${net >= 0 ? '+' : ''}${net.toLocaleString('uz-UZ')} so'm** ${net >= 0 ? '🟢 (Foyda)' : '🔴 (Kamomad)'}`,
        actions: []
      };
    }

    if (lower.includes('qanday vazifa') || lower.includes('qaysi vazifa') || lower.includes('ishlarim') || lower.includes('topshiriqlar')) {
      const pending = this.tasks.filter(t => !t.status.includes('Bajarildi') && !t.checked);
      if (pending.length === 0) {
        return {
          reply: `🎉 **Barcha vazifalar bajarilgan!** Sizda hozircha ochiq vazifalar mavjud emas. Yangi vazifa qo'shish uchun shunchaki yozing.`,
          actions: []
        };
      }
      const list = pending.slice(0, 5).map((t, i) => `${i + 1}. **${t.title}** (${t.priority}, Muddati: ${t.deadline || 'Belgilanmagan'})`).join('\n');
      return {
        reply: `📋 **Sizda ${pending.length} ta faol vazifa bor:**\n${list}${pending.length > 5 ? `\n...va yana ${pending.length - 5} ta vazifa.` : ''}`,
        actions: []
      };
    }

    if (lower.includes('odatlarim') || lower.includes('odatlar qanday') || lower.includes('odat hisoboti')) {
      const todayDayOfMonth = new Date().getDate();
      const dayIdx = Math.min(todayDayOfMonth - 1, 30);
      let done = 0;
      const list = this.habits.map(h => {
        const isDone = h.days && h.days[dayIdx] === 1;
        if (isDone) done++;
        return `• ${isDone ? '✅' : '⚪'} **${h.title}** (${h.frequency === 'weekly' ? 'Haftalik' : 'Kunlik'})`;
      }).join('\n');

      return {
        reply: `🔄 **Bugungi Odatlar Progressi (${done}/${this.habits.length}):**\n${list}`,
        actions: []
      };
    }

    // CHECK 1: COUNTDOWN REMINDER (e.g. "15 daqiqadan keyin choy ichishni eslat", "10 minutdan keyin qo'ng'iroq")
    const countdownMatch = lower.match(/(\d+)\s*(?:daqiqa|minut|min)\s*(?:dan\s*keyin|ichida)?\s*(.*)/i);
    if (countdownMatch && !lower.includes('pomodoro')) {
      const mins = parseInt(countdownMatch[1]);
      let remLabel = countdownMatch[2].replace(/eslat|kerak|qilish|qo['’`]?ng['’`]?iroq/gi, '').trim() || "Eslatma";
      remLabel = remLabel.charAt(0).toUpperCase() + remLabel.slice(1);

      const targetDate = new Date();
      targetDate.setMinutes(targetDate.getMinutes() + mins);
      const targetTimeStr = `${String(targetDate.getHours()).padStart(2, '0')}:${String(targetDate.getMinutes()).padStart(2, '0')}`;
      const targetDateStr = this.formatDateIso(targetDate);

      actions.push({
        type: 'create_task',
        title: `⏰ ${remLabel}`,
        deadline: targetDateStr,
        time: targetTimeStr,
        priority: "‼️ O'ta muhim",
        category: "Shaxsiy",
        note: `${mins} daqiqalik eslatma (${targetTimeStr})`
      });

      actions.push({
        type: 'set_alarm',
        title: remLabel,
        time: targetTimeStr,
        date: targetDateStr
      });

      return {
        reply: `⏱️ **Eslatma taymer sozlandi!**\n• ${mins} daqiqadan keyin (soat **${targetTimeStr}** da) budilnik chalinadi;\n• 📋 Vazifalar ro'yxatiga *"⏰ ${remLabel}"* qo'shildi.`,
        actions
      };
    }

    // CHECK 2: CHECK OFF / MARK COMPLETED VIA CHAT
    if (lower.includes('bajarildi') || lower.includes('bajardim') || lower.includes('tugatdim') || lower.includes('tayyor')) {
      // Check habits
      const matchedHabit = this.habits.find(h => lower.includes(h.title.toLowerCase().replace(/[^\w\s]/gi, '').trim()));
      if (matchedHabit) {
        const todayDayOfMonth = new Date().getDate();
        const dayIdx = Math.min(todayDayOfMonth - 1, 30);
        if (!matchedHabit.days) matchedHabit.days = new Array(31).fill(0);
        matchedHabit.days[dayIdx] = 1;
        this.saveAllData(true);
        this.renderHabitsView();
        return {
          reply: `🎉 **Tabriklaymiz!** "${matchedHabit.title}" odati bugun uchun muvaffaqiyatli bajarildi deb belgilandi! Streak davom etmoqda 🔥`,
          actions: []
        };
      }
      // Check tasks
      const matchedTask = this.tasks.find(t => !t.checked && lower.includes(t.title.toLowerCase().replace(/[^\w\s]/gi, '').trim()));
      if (matchedTask) {
        matchedTask.status = "✅ Bajarildi";
        matchedTask.checked = true;
        this.saveAllData(true);
        this.renderTasksView();
        return {
          reply: `✅ **Ajoyib natija!** "${matchedTask.title}" vazifasi bajarilgan deb belgilandi!`,
          actions: []
        };
      }
    }

    // Date extraction
    let dateStr = this.getTodayDateStr();
    const today = new Date();
    if (lower.includes('ertaga') || lower.includes('ertalab')) {
      const tmrw = new Date(today);
      tmrw.setDate(today.getDate() + 1);
      dateStr = this.formatDateIso(tmrw);
    } else if (lower.includes('indin') || lower.includes('ertadan keyin')) {
      const dayAfter = new Date(today);
      dayAfter.setDate(today.getDate() + 2);
      dateStr = this.formatDateIso(dayAfter);
    } else if (lower.includes('kecha')) {
      const yest = new Date(today);
      yest.setDate(today.getDate() - 1);
      dateStr = this.formatDateIso(yest);
    }

    // Time extraction (e.g., "5 da", "05:00 da", "soat 5 da", "18:30 da")
    let timeStr = null;
    const timeStrictMatch = lower.match(/(?:soat\s*)?(\d{1,2})(?::(\d{2}))?\s*(?:da|ga)?\s*(?:turish|uyg['’`]?onish|uchrashuv|budilnik)/i) ||
                            lower.match(/(\d{1,2}):(\d{2})/) ||
                            lower.match(/(\d{1,2})\s*da\b/i);

    if (timeStrictMatch) {
      let hour = parseInt(timeStrictMatch[1]);
      let min = timeStrictMatch[2] ? parseInt(timeStrictMatch[2]) : 0;
      if ((lower.includes('kechki') || lower.includes('kechqurun') || lower.includes('shomda')) && hour < 12) {
        hour += 12;
      }
      timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    }

    // Money / Amount extraction (e.g., 45000, 45 ming, 1.5 mln)
    let amount = 0;
    let isMoney = false;
    const mlnMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:mln|million)/i);
    const mingMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:ming|k\b)/i);
    const rawNumMatch = lower.match(/(\d{2,}(?:[.,]\d+)?)\s*(?:so['’`]?m|som|\$|dollar)?/i);

    if (mlnMatch) {
      amount = parseFloat(mlnMatch[1].replace(',', '.')) * 1000000;
      isMoney = true;
    } else if (mingMatch) {
      amount = parseFloat(mingMatch[1].replace(',', '.')) * 1000;
      isMoney = true;
    } else if (rawNumMatch) {
      const val = parseFloat(rawNumMatch[1].replace(',', '.'));
      if (val >= 100 || lower.includes('so\'m') || lower.includes('som') || lower.includes('ishlat') || lower.includes('tushdi') || lower.includes('maosh') || lower.includes('oylik')) {
        amount = val;
        isMoney = true;
      }
    }

    // INTENT 1: WAKE UP / ALARM + TASK (User's primary request!)
    const isWakeUpOrAlarm = lower.includes('turish') || lower.includes('turishim') || 
                            lower.includes('uyg\'on') || lower.includes('uygon') || 
                            lower.includes('budilnik') || lower.includes('uygot') || lower.includes('uyg\'ot');

    if (isWakeUpOrAlarm) {
      const alarmTime = timeStr || "05:00";
      const taskTitle = `Ertalab soat ${alarmTime} da turish`;
      
      // Check if alarm already exists
      const existingAlarm = (this.alarms || []).find(a => a.time === alarmTime);
      let alarmMsg = "";
      if (existingAlarm) {
        existingAlarm.enabled = true;
        alarmMsg = `• ⏰ Soat **${alarmTime}** dagi budilnik allaqachon sozlangan va faollashtirildi!`;
      } else {
        actions.push({
          type: 'set_alarm',
          title: taskTitle,
          time: alarmTime,
          date: dateStr
        });
        alarmMsg = `• ⏰ Soat **${alarmTime}** ga yangi budilnik signali yoqildi!`;
      }

      // Check if task already exists
      const existingTask = (this.tasks || []).find(t => !t.checked && t.title.toLowerCase().includes(alarmTime));
      if (!existingTask) {
        actions.push({
          type: 'create_task',
          title: taskTitle,
          deadline: dateStr,
          time: alarmTime,
          priority: "‼️ O'ta muhim",
          status: "✏️ Jarayonda",
          category: "Shaxsiy",
          note: `Budilnik sozlangan (${alarmTime}) - AI Yordamchi orqali qo'shildi`
        });
        replyParts.push(`🌅 Ertaga soat **${alarmTime}** da turishingiz uchun:\n• 📋 Vazifalar ro'yxatiga *"Ertalab soat ${alarmTime} da turish"* qo'shildi;\n${alarmMsg}`);
      } else {
        replyParts.push(`🌅 Ertaga soat **${alarmTime}** da turish rejasi tekshirildi:\n• 📋 Vazifa allaqachon mavjud;\n${alarmMsg}`);
      }
    }

    // INTENT 1.5: 5 MAHAL NAMOZ VAQTLARI (5 ALOHIDA VAQTLI VAZIFA VA BUDILNIK)
    const isFivePrayers = 
      (lower.includes('5') || lower.includes('besh') || lower.includes('hamma') || lower.includes('barcha')) && 
      (lower.includes('namoz') || lower.includes('vaqt'));

    if (isFivePrayers) {
      const prayers = [
        { name: "🕌 Bomdod namozi", time: "05:40", routine: "morning", period: "Tonggi (05:40)" },
        { name: "🕌 Peshin namozi", time: "12:45", routine: "day", period: "Kunduzgi (12:45)" },
        { name: "🕌 Asr namozi", time: "16:15", routine: "day", period: "Asr payti (16:15)" },
        { name: "🕌 Shom namozi", time: "18:15", routine: "evening", period: "Shom vaqti (18:15)" },
        { name: "🕌 Xufton namozi", time: "19:45", routine: "evening", period: "Kechki (19:45)" }
      ];

      prayers.forEach(p => {
        // 1. Task for today with distinct time
        const normKey = p.name.toLowerCase().replace('🕌 ', '').replace(' namozi', '').trim();
        const existingTask = (this.tasks || []).find(t => 
          t.title.toLowerCase().includes(normKey) &&
          (!t.deadline || t.deadline === dateStr)
        );

        if (!existingTask) {
          actions.push({
            type: 'create_task',
            title: `${p.name} (${p.time})`,
            deadline: dateStr,
            time: p.time,
            priority: "‼️ O'ta muhim",
            status: "✏️ Jarayonda",
            category: "Ibodat",
            note: `${p.period} farz namozi`
          });
        }

        // 2. Alarm for each prayer time
        const existingAlarm = (this.alarms || []).find(a => a.time === p.time);
        if (existingAlarm) {
          existingAlarm.enabled = true;
        } else {
          actions.push({
            type: 'set_alarm',
            title: p.name,
            time: p.time,
            date: dateStr
          });
        }

        // 3. Habit for each prayer
        const existingHabit = (this.habits || []).find(h => h.title.toLowerCase().includes(normKey));
        if (!existingHabit) {
          actions.push({
            type: 'create_habit',
            title: `${p.name} (${p.time})`,
            frequency: "daily",
            routine: p.routine,
            goal: 30
          });
        }
      });

      return {
        reply: `🕌 **5 Mahal Namoz vaqtlari bo'yicha alohida-alohida kiritildi:**\n\n` +
               `Har bir namoz har xil vaqtda bo'lgani uchun bitta umumiy emas, balki **5 ta alohida vazifa va budilnik** sifatida sozlandi:\n\n` +
               `1. 🌅 **Bomdod namozi:** soat **05:40** (Tong)\n` +
               `2. ☀️ **Peshin namozi:** soat **12:45** (Kunduzi)\n` +
               `3. 🌤️ **Asr namozi:** soat **16:15** (Peshindan keyin)\n` +
               `4. 🌇 **Shom namozi:** soat **18:15** (Quyosh botganda)\n` +
               `5. 🌙 **Xufton namozi:** soat **19:45** (Kechasi)\n\n` +
               `✅ **Bugungi Vazifalar** va **Odatlar** ro'yxatida har biri o'z vaqti bilan paydo bo'ldi. Kelgan vaqtida 1-klik bilan bajarildi qilib belgilab borishingiz mumkin!`,
        actions: actions
      };
    }

    // INTENT 2: HABIT (Odat) with Strict Entity Cleaning & Duplicate Protection
    const isHabit = lower.includes('har kuni') || lower.includes('har hafta') || 
                    lower.includes('odat') || lower.includes('kunlik') || 
                    lower.includes('haftalik') || lower.includes('doimiy') ||
                    lower.includes('namoz') || lower.includes('bomdod') ||
                    lower.includes('kitob') || lower.includes('suv ichish') ||
                    (lower.includes('o\'qiyman') && (lower.includes('namoz') || lower.includes('kitob')));

    if (isHabit) {
      const entity = this.cleanHabitEntity(text, lower);

      if (!entity.isValid) {
        return {
          reply: `⚠️ **Aniqlashtirish zarur:** Kiritilgan buyruqdan aniq odat nomi ajratib olinmadi.\nIltimos, odat nomini aniqroq yozing (masalan: *"Har kuni kitob o'qish"*, *"5 mahal namoz"* yoki *"2 litr suv ichish"*).`,
          actions: []
        };
      }

      // Check for duplicate in existing habits
      const dupCheck = this.checkHabitDuplicate(entity.title);

      if (dupCheck.isDuplicate) {
        if (dupCheck.updated) {
          return {
            reply: `🔄 **Mavjud odat yangilandi:**\nSizdagi avvalgi odat to'liq **'${entity.title}'** ga yangilandi!\n\n🛡️ Yangi dublikat qator ochilmadi — ma'lumotlaringiz toza va tartibli saqlanmoqda.`,
            actions: []
          };
        } else {
          return {
            reply: `⚠️ **Dublikat tekshiruvi:**\n**'${dupCheck.existingTitle}'** odati sizning jadvalingizda allaqachon mavjud!\n\n🛡️ **Himoya:** Jadval toza bo'lishi uchun takroriy qator qo'shilmadi.`,
            actions: []
          };
        }
      }

      actions.push({
        type: 'create_habit',
        title: entity.title,
        frequency: entity.frequency,
        routine: entity.routine,
        goal: entity.goal
      });

      const routineUz = entity.routine === 'morning' ? '🌅 Ertalabki' : (entity.routine === 'evening' ? '🌙 Kechki' : (entity.routine === 'day' ? '☀️ Kunduzgi' : '⚡ Kun davomida'));
      replyParts.push(`🔄 **Odatlar tekshirildi va yangi odat qo'shildi:**\n• **Nomi**: ${entity.title}\n• **Tartibi**: ${routineUz}\n• **Davriylik**: ${entity.frequency === 'weekly' ? 'Haftalik' : 'Kunlik (Daily)'}\n• **Oylik maqsad**: ${entity.goal} kun\n\n🛡️ *Dublikat mavjud emasligi tasdiqlandi.*`);
    }

    // INTENT 3: FINANCE (Xarajat yoki Daromad)
    if (isMoney && amount > 0) {
      const isIncome = lower.includes('oldim') || lower.includes('tushdi') || 
                       lower.includes('daromad') || lower.includes('maosh') || 
                       lower.includes('oylik') || lower.includes('kirim') || 
                       lower.includes('foyda');
      
      const typeOp = isIncome ? "Kirim" : "Chiqim";
      
      let category = isIncome ? "Maosh & Daromad" : "Boshqa xarajatlar";
      let note = isIncome ? "Daromad" : "Xarajat";

      if (lower.includes('tushlik') || lower.includes('ovqat') || lower.includes('kafe') || lower.includes('osh') || lower.includes('lavash')) {
        category = "Oziq-ovqat & Kafe";
        note = "Tushlik";
      } else if (lower.includes('taksi') || lower.includes('benzin') || lower.includes('yo\'l') || lower.includes('yandex')) {
        category = "Transport & Yo'l";
        note = "Transport";
      } else if (lower.includes('ijara') || lower.includes('svet') || lower.includes('gaz') || lower.includes('kommunal') || lower.includes('kvartira')) {
        category = "Kommunal & Uy";
        note = "Kommunal to'lov";
      } else if (lower.includes('dori') || lower.includes('apteka') || lower.includes('vrach') || lower.includes('doktor')) {
        category = "Salomatlik";
        note = "Dorixona / Davolanish";
      } else if (lower.includes('bozor') || lower.includes('kiyim') || lower.includes('shopping')) {
        category = "Xaridlar & Shaxsiy";
        note = "Bozorlik";
      } else if (lower.includes('maosh') || lower.includes('oylik')) {
        category = "Maosh & Daromad";
        note = "Oylik maosh";
      }

      actions.push({
        type: 'add_finance',
        type_op: typeOp,
        amount: amount,
        category: category,
        date: dateStr,
        note: `${note} (AI Chat orqali qo'shildi)`
      });

      const fmtAmt = Number(amount).toLocaleString('uz-UZ') + " so'm";
      replyParts.push(`💸 Moliyaviy yozuv qayd etildi:\n• **Turi**: ${typeOp === 'Kirim' ? '🟢 Kirim (Daromad)' : '🔴 Chiqim (Xarajat)'}\n• **Summa**: **${fmtAmt}**\n• **Kategoriya**: ${category}\n• **Izoh**: ${note}`);
    }

    // INTENT 4: POMODORO TIMER
    if (lower.includes('pomodoro') || (lower.includes('fokus') && (lower.includes('boshla') || lower.includes('yoq')))) {
      actions.push({ type: 'start_pomodoro' });
      replyParts.push(`⏱️ **Pomodoro fokus taymeri** 25 daqiqaga ishga tushirildi! Diqqatingizni jamlab, unumli ishlang.`);
    }

    // INTENT 5: GENERAL TASK with Cleaning & Duplicate Check
    if (actions.length === 0 && (lower.includes('vazifa') || lower.includes('uchrashuv') || lower.includes('qilishim') || lower.includes('borish') || lower.includes('topshiriq') || lower.includes('qilish'))) {
      let cleanTask = text
        .replace(/men\s+/gi, '')
        .replace(/vazifaga\s+qo['’`]?sh/gi, '')
        .replace(/qo['’`]?shib\s*(?:ber|qo['’`]?y)?/gi, '')
        .replace(/qo['’`]?shing/gi, '')
        .replace(/qo['’`]?sh/gi, '')
        .replace(/qilishim\s+kerak/gi, '')
        .replace(/qilish\s+kerak/gi, '')
        .replace(/kerak/gi, '')
        .replace(/lozim/gi, '')
        .replace(/shart/gi, '')
        .replace(/iltimos/gi, '')
        .trim();

      cleanTask = cleanTask.replace(/[^\w\s\u0400-\u04FF'ʻʼ`-]/gi, ' ').replace(/\s+/g, ' ').trim();

      if (cleanTask.length < 3) {
        return {
          reply: `⚠️ **Aniqlashtirish zarur:** Vazifa nomi tushunarsiz yoki juda qisqa. Iltimos, aniqroq yozing (masalan: *"Ertaga soat 15:00 da hisobot tayyorlash"*).`,
          actions: []
        };
      }

      const formattedTitle = cleanTask.charAt(0).toUpperCase() + cleanTask.slice(1);

      // Check if task already exists
      const normTask = formattedTitle.toLowerCase().replace(/[^\w\s]/gi, '').trim();
      const existingTask = (this.tasks || []).find(t => 
        !t.checked && 
        t.title.toLowerCase().replace(/[^\w\s]/gi, '').trim() === normTask &&
        (!t.deadline || t.deadline === dateStr)
      );

      if (existingTask) {
        return {
          reply: `⚠️ **Vazifa tekshiruvi:** **'${existingTask.title}'** vazifasi allaqachon rejalashtirilgan (${existingTask.deadline || 'Bugun'}). Takroriy vazifa qo'shilmadi.`,
          actions: []
        };
      }

      actions.push({
        type: 'create_task',
        title: formattedTitle,
        deadline: dateStr,
        time: timeStr || "12:00",
        priority: lower.includes('muhim') ? "‼️ O'ta muhim" : "⚡ O'rtacha muhim",
        status: "✏️ Jarayonda",
        category: "Ish",
        note: "AI Yordamchi orqali qo'shildi"
      });
      replyParts.push(`📋 **Vazifalar tekshirildi va yangi vazifa qo'shildi:**\n• **Vazifa**: "${formattedTitle}"\n• **Muddati**: ${dateStr}${timeStr ? ' soat ' + timeStr : ''}\n\n🛡️ Dublikat yo'qligi tasdiqlandi.`);
    }

    // Default response if no specific intent recognized
    if (actions.length === 0) {
      replyParts.push(`Tushundim! Siz quyidagi amallarni tabiiy tilda yozishingiz mumkin:\n• *"Ertaga 5 da turishim kerak"* ➔ Vazifa + Budilnik 05:00\n• *"5 mahal namozni qo'sh"* ➔ Kunlik Odat (Dublikat tekshiruvi bilan)\n• *"Namoz qo'shildimi?"* ➔ Mavjudlikni tekshirish\n• *"Bugun tushlikka 45 000 so'm ishlatdim"* ➔ Xarajat\n• *"25 minut pomodoro fokus boshla"* ➔ Taymer`);
    }

    return {
      reply: replyParts.join('\n\n'),
      actions: actions
    };
  },

  executeAIAction(act) {
    if (!act) return;

    if (act.type === 'create_task') {
      const norm = (act.title || '').toLowerCase().replace(/[^\w\s]/gi, '').trim();
      const existing = (this.tasks || []).find(t => !t.checked && t.title.toLowerCase().replace(/[^\w\s]/gi, '').trim() === norm);
      if (existing) {
        this.showToast(`⚠️ Vazifa allaqachon mavjud: "${existing.title}"`);
        return;
      }
      const newTask = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        title: act.title,
        deadline: act.deadline || this.getTodayDateStr(),
        time: act.time || "12:00",
        priority: act.priority || "⚡ O'rtacha muhim",
        status: act.status || "✏️ Jarayonda",
        category: act.category || "Shaxsiy",
        note: act.note || "AI Yordamchi orqali qo'shildi",
        checked: false
      };
      act.actionId = newTask.id;
      this.tasks.unshift(newTask);
      this.showToast(`📋 Vazifa qo'shildi: "${act.title}"`);
    } 
    else if (act.type === 'set_alarm') {
      const targetTime = act.time || "05:00";
      if (!this.alarms) this.alarms = [];
      const existing = this.alarms.find(a => a.time === targetTime);
      if (existing) {
        existing.enabled = true;
        this.showToast(`⏰ Budilnik (${targetTime}) faollashtirildi`);
        return;
      }
      const newAlarm = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        time: targetTime,
        date: act.date || this.getTodayDateStr(),
        title: act.title || "Budilnik",
        enabled: true,
        lastTriggered: null
      };
      act.actionId = newAlarm.id;
      this.alarms.push(newAlarm);
      this.showToast(`⏰ Budilnik ${targetTime} ga muvaffaqiyatli yoqildi!`);
    } 
    else if (act.type === 'create_habit') {
      const dup = this.checkHabitDuplicate(act.title);
      if (dup.isDuplicate) {
        if (dup.updated) {
          this.showToast(`🔄 Odat yangilandi: "${act.title}"`);
        } else {
          this.showToast(`⚠️ Odat allaqachon mavjud: "${dup.existingTitle}"`);
        }
        return;
      }
      const newHabit = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        title: act.title,
        month: this.selectedHabitMonth || "Fevral",
        frequency: act.frequency || "daily",
        routine: act.routine || "morning",
        days: new Array(31).fill(0),
        goal: act.goal || 30
      };
      act.actionId = newHabit.id;
      this.habits.push(newHabit);
      this.showToast(`🔄 Odat qo'shildi: "${act.title}"`);
    } 
    else if (act.type === 'add_finance') {
      const newFin = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        date: act.date || this.getTodayDateStr(),
        type: act.type_op || "Chiqim",
        category: act.category || "Oziq-ovqat & Kafe",
        amount: Number(act.amount) || 0,
        note: act.note || "AI Chat orqali kiritildi"
      };
      act.actionId = newFin.id;
      this.finances.unshift(newFin);
      this.showToast(`💸 ${act.type_op === 'Kirim' ? 'Daromad' : 'Xarajat'} qayd etildi: ${Number(act.amount).toLocaleString('uz-UZ')} so'm`);
    } 
    else if (act.type === 'start_pomodoro') {
      this.startPomodoro();
    }
  },

  switchTabAndHighlight(tabId, itemTitle) {
    const tabBtn = document.querySelector(`.sheet-tab[data-tab="${tabId}"]`);
    if (tabBtn) tabBtn.click();
    this.closeAIChat();
    if (itemTitle) {
      setTimeout(() => {
        const target = Array.from(document.querySelectorAll('tr, .kanban-card, .habit-row')).find(el => el.textContent.includes(itemTitle));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          target.style.transition = 'box-shadow 0.4s ease';
          target.style.boxShadow = '0 0 0 4px #1a73e8';
          setTimeout(() => { target.style.boxShadow = ''; }, 2000);
        }
      }, 200);
    }
  },

  getTodayDateStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  formatDateIso(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  async queryGeminiModel(userPrompt) {
    if (!this.geminiApiKey) {
      this.showToast("⚠️ Gemini API kaliti kiritilmagan. Sozlamalardan (⚙️) kalitni kiriting.");
      return null;
    }
    const p = this.agentMemory?.profile || {};
    const facts = (this.agentMemory?.learnedFacts || []).map(f => f.fact).join('; ');
    const pendingTasks = this.tasks.filter(t => !t.checked).map(t => t.title).slice(0, 5).join(', ');

    const systemInstruction = `Siz o'zbek tilidagi aqlli shaxsiy AI rejalashtiruvchi va murabbiy assistentsiz.
FOYDALANUVCHI PROFILI:
- Ismi: ${p.name || 'Foydalanuvchi'}
- Kasbi/Faoliyati: ${p.occupation || 'Mutaxassis'}
- Uyg'onish vaqti: ${p.wakeTime || '05:00'}, Uyqu vaqti: ${p.sleepTime || '23:00'}
- Oylik jamg'arma maqsadi: ${Number(p.monthlySavingsGoal || 5000000).toLocaleString('uz-UZ')} so'm
- Asosiy vision/maqsad: ${p.primaryGoal || 'Moliyaviy va shaxsiy muvaffaqiyat'}
- AI Xarakteri: ${p.personalityTone || 'coach'} (Do'stona, tahliliy yoki qat'iy)
- O'rganilgan shaxsiy faktlar: ${facts || 'Hozircha yo\'q'}
- Hozirgi ochiq vazifalar: ${pendingTasks || 'Barcha vazifalar bajarilgan'}

NAMOZ VAQTLARI QOIDASI:
Agar foydalanuvchi 5 mahal namoz haqida gapirsa yoki namozlarni so'rasa, har doim 5 ta alohida vaqtli vazifa, budilnik va odat qilib ajrating:
1. 🌅 Bomdod namozi (05:40)
2. ☀️ Peshin namozi (12:45)
3. 🌤️ Asr namozi (16:15)
4. 🌇 Shom namozi (18:15)
5. 🌙 Xufton namozi (19:45)
Hech qachon hammasini bitta umumiy "5 mahal namoz" qatoriga birlashtirmang!

TALABLAR:
- Foydalanuvchi bilan tabiiy, o'zbek tilida samimiy, do'stona va rag'batlantiruvchi tarzda gaplashing.
- Foydalanuvchi so'rovidagi barcha harakatlarni aniqlab, quyidagi qat'iy JSON formatida javob bering.
- Faqat toza JSON qaytaring (hech qanday markdown \`\`\`json blocksiz):
{
  "reply": "O'zbekcha shaxsiy kontekstga asoslangan do'stona, aniq va foydali javob...",
  "actions": [
    { "type": "create_task", "title": "Vazifa nomi", "deadline": "YYYY-MM-DD", "priority": "‼️ O'ta muhim" | "⚡ O'rtacha muhim", "category": "Shaxsiy" | "Ish" | "Ibodat" | "O'qish", "time": "HH:mm" },
    { "type": "set_alarm", "title": "Budilnik nomi", "time": "HH:mm", "date": "YYYY-MM-DD" },
    { "type": "create_habit", "title": "Odat nomi", "frequency": "daily" | "weekly", "routine": "morning" | "day" | "evening", "goal": 30 },
    { "type": "add_finance", "type_op": "Kirim" | "Chiqim", "category": "Kategoriya nomi", "amount": 45000, "note": "Izoh" },
    { "type": "start_pomodoro" }
  ],
  "newFact": "Foydalanuvchi o'zi haqida yangi fakt aytgan bo'lsa (odat, kasb, vaqt, xohish) shu matn, aks holda null"
}`;

    const modelName = this.geminiModel || "gemini-1.5-flash";
    const bodyPayload = {
      apiKey: this.geminiApiKey,
      model: modelName,
      payload: {
        contents: [
          { role: "user", parts: [{ text: `${systemInstruction}\n\nFoydalanuvchi so'rovi: "${userPrompt}"\nBugungi sana: ${this.getTodayDateStr()}` }] }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.3
        }
      }
    };

    const res = await fetch('/api/gemini_proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload)
    });

    if (!res.ok) {
      const errRaw = await res.text().catch(() => "");
      let errData = {};
      try { errData = JSON.parse(errRaw); } catch(e) { errData = { error: errRaw }; }
      console.warn("Gemini proxy error:", errData);
      const errMsg = errData.error?.message || (typeof errData.error === 'string' ? errData.error : 'Ulanishda xato');
      this.showToast(`⚠️ Gemini: ${errMsg}. Offline rejim ishlatildi.`);
      return null;
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    try {
      const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      // Persist newly learned facts into agent memory
      if (parsed.newFact && typeof parsed.newFact === 'string' && parsed.newFact.length > 5) {
        if (!this.agentMemory.learnedFacts) this.agentMemory.learnedFacts = [];
        const already = this.agentMemory.learnedFacts.some(f => f.fact.toLowerCase() === parsed.newFact.toLowerCase());
        if (!already) {
          this.agentMemory.learnedFacts.push({
            id: Date.now(),
            fact: parsed.newFact,
            category: "umumiy",
            date: this.getTodayDateStr()
          });
          this.saveAgentMemory();
          parsed.learnedFactAlert = parsed.newFact;
        }
      }

      return parsed;
    } catch (parseErr) {
      console.error("Gemini JSON parse error:", parseErr, rawText);
      return null;
    }
  },

  async queryOllamaModel(userPrompt) {
    const p = this.agentMemory?.profile || {};
    const facts = (this.agentMemory?.learnedFacts || []).map(f => f.fact).join('; ');
    const url = `${this.ollamaUrl}/api/generate`;
    const prompt = `Siz o'zbek tilidagi shaxsiy AI rejalashtiruvchisiz.
Foydalanuvchi: ${p.name || 'Foydalanuvchi'} (${p.occupation || 'Dasturchi'}).
O'rganilgan faktlar: ${facts}.
Foydalanuvchi yozuvi: "${userPrompt}".
Bugungi sana: ${this.getTodayDateStr()}.
Faqat quyidagi JSON formatida javob qaytaring:
{
  "reply": "O'zbekcha shaxsiy ma'lumotlarga asoslangan javob...",
  "actions": [
    { "type": "create_task" | "set_alarm" | "create_habit" | "add_finance" | "start_pomodoro", ... }
  ]
}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.ollamaModel,
        prompt: prompt,
        stream: false,
        format: "json"
      })
    });

    if (!res.ok) return null;
    const data = await res.json();
    return JSON.parse(data.response);
  }
};

// Auto start when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  PlannerApp.init();
});
