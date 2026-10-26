# 📊 Antigravity Planner & Moliya Dashboard (AI Agent bilan)

O'zbek tilidagi aqlli shaxsiy rejalashtiruvchi, odatlar nazoratchisi (Habit Tracker), moliyaviy hisobot va AI Agent assistenti (Google Gemini 4 Argon / 3.8 Flash / 3.1 Pro integratsiyasi bilan).

Barcha ma'lumotlar avtomatik ravishda `data/` papkasidagi toza **CSV** va **JSON** fayllarga saqlanadi.

---

## 🚀 Asosiy imkoniyatlar:

1. **🤖 Antigravity AI Agent (O'zbekcha NLU & Gemini):**
   * Tabiiy tilda yozilgan matnlarni tushunish: *"Ertaga 5 da turishim kerak"*, *"Bugun tushlikka 45 000 so'm ishlatdim"*, *"5 mahal namoz vaqti bilan qo'sh"*.
   * Google Gemini eng so'nggi modellari: **4 Argon**, **3.1 Pro**, **3.8 Flash**, **3.5 Flash-Lite** bilan to'liq integratsiya.
   * Doimiy xotira (`data/agent_memory.json`): shaxsiy profil, uyqu/uyg'onish tartibi va o'rganilgan faktlar.
   * Ekranning o'ng pastki burchagidagi qulay suzuvchi AI Chat tugmasi.

2. **🕌 5 Mahal Namoz vaqtlari (Avtomatik alohida vazifa va odat):**
   * Bomdod (05:40), Peshin (12:45), Asr (16:15), Shom (18:15), Xufton (19:45).
   * Har bir namoz alohida vaqtli vazifa, budilnik va 31 kunlik jadvalda mustaqil odat sifatida belgilanadi.

3. **📋 Vazifalar nazorati (Task Manager):**
   * Prioritetlar (‼️ O'ta muhim, 🔥 Muhim, ⚡ O'rtacha), muddatlar, bajarilganlik holati va toifalar.
   * Oylik kalendar va Kanban matrisi ko'rinishi.

4. **🔄 Odatlar planneri (Habit Tracker):**
   * 1-dan 31-kungacha bo'lgan kunlik odatlar matritsasi.
   * Oylik progres %, kunlik to'lqinli (Area) grafik.

5. **💳 Moliya boshqaruvi (Oylik & Yillik Fin Plan):**
   * Daromadlar, xarajatlar, jamg'arma va qoldiq monitoringi.
   * Diagrammalar va toifalar bo'yicha tahlil.

---

## 💻 Mahalliy kompyuterda ishga tushirish:

```bash
# 1. Kutubxonalarni o'rnatish
pip install -r requirements.txt

# 2. Serverni ishga tushirish
python app.py
```
Brauzerda oching: `http://localhost:8000`

---

## ☁️ PythonAnywhere ga GitHub orqali joylash (Deploy qilish):

### 1-qadam: Loyihani GitHub'ga yuklash (Push):
Agar GitHub'da yangi repository ochgan bo'lsangiz:
```bash
git remote add origin https://github.com/<GITHUB_USERNAME>/<REPO_NAME>.git
git branch -M main
git push -u origin main
```

### 2-qadam: PythonAnywhere Bash konsolida klonlash:
1. [PythonAnywhere](https://www.pythonanywhere.com) saytiga kiring va profilingizni oching.
2. **Consoles** bo'limiga o'ting va **Bash** konsolini bosing.
3. Quyidagi buyruqni kiriting:
   ```bash
   git clone https://github.com/<GITHUB_USERNAME>/<REPO_NAME>.git planner_dashboard
   cd planner_dashboard
   pip install --user -r requirements.txt
   ```

### 3-qadam: Web App yaratish va sozlash:
1. PythonAnywhere boshqaruv panelida **Web** bo'limiga o'ting.
2. **"Add a new web app"** tugmasini bosing.
3. Domen nomini tasdiqlang (`yourusername.pythonanywhere.com`), **Next** ni bosing.
4. Framework tanlashda **"Manual configuration"** (yoki **Flask**) ni tanlang, Python versiyasini tanlang (masalan, **Python 3.10** yoki **3.11**).
5. **Code** bo'limida:
   * **Source code**: `/home/<yourusername>/planner_dashboard`
   * **Working directory**: `/home/<yourusername>/planner_dashboard`
6. **WSGI configuration file** havolasini bosing (`/var/www/<yourusername>_pythonanywhere_com_wsgi.py`).
7. Ichidagi barcha yozuvlarni tozalab, faqat quyidagini yozing va **Save** tugmasini bosing:
   ```python
   import sys
   import os

   path = '/home/<yourusername>/planner_dashboard'
   if path not in sys.path:
       sys.path.insert(0, path)

   from app import app as application
   ```
   *(Eslatma: `<yourusername>` o'rniga o'zingizning PythonAnywhere akkaunt nomingizni yozing!)*

### 4-qadam: Saytni ishga tushirish:
1. **Web** sahifasiga qaytib, yashil **"Reload <yourusername>.pythonanywhere.com"** tugmasini bosing.
2. Saytingiz internetda jonli ishlaydi:
   `https://<yourusername>.pythonanywhere.com`

---

## 🔒 Xavfsizlik va Ma'lumotlar zaxirasi:
* Barcha vazifalar, odatlar va hisob-kitoblar `data/*.csv` va `data/agent_memory.json` fayllarida saqlanadi.
* Gemini API kalitingiz brauzeringizda va server xotirasida xavfsiz saqlanadi.
