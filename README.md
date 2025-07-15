#  SAM  
**AI-Powered In-Store Assistant for Retail**

SAM transforms the in-store shopping experience by giving customers real-time inventory intelligence, contextual guidance, and sustainable nudges all through a sleek mobile app.

---

## What Are We Solving ?

Retail customers often struggle to:
- Find products or check live availability, causing frustration and up to 30% sales loss from stockouts.  
- Rely on staff, which drives up costs and causes in-store crowding.  
- Discover eco-friendly alternatives at checkout.

---

## How are we solving it ?

We built a generative AI–powered assistant that customers launch by scanning a QR code at the store entrance. That QR code triggers a Supabase–FastAPI pipeline, streaming that location’s live inventory into the app with millisecond latency.  

A custom LLM-driven intent engine (via OpenRouter API) classifies queries—whether a product search, recipe idea, or sustainability tip—and returns precise, actionable guidance. Behind the scenes, recipes are scraped with BeautifulSoup4, parsed via Pandas, and mapped against live stock to show aisle locations and quantities.  

Speech-to-text (SpeechRecognition) and text-to-speech (pyttsx3) deliver a hands-free experience—vital for accessibility. Sustainable suggestions (e.g., paper straws, green-coin rewards) nudge greener shopping behaviors and boost repeat purchases.

---

<img width="1024" height="1536" alt="ChatGPT Image Jul 15, 2025, 02_48_56 PM" src="https://github.com/user-attachments/assets/baec9a0d-9d2d-4b88-9e7f-c349261d45d3" />

<img width="1024" height="1536" alt="ChatGPT Image Jul 15, 2025, 02_37_45 PM" src="https://github.com/user-attachments/assets/05334304-6afe-4d75-a1e9-7e76fc2868c1" />

---

## 🏗️ Architecture & Tech Stack

```text
+------------+      +-------------------------------------+      +--------------+
| React/Expo | <--> |           FastAPI Backend           | <--> | PostgreSQL & |
|  Frontend  |      | +-------------------------------+   |      |  Supabase    |
+------------+      | |           AI Engine           |   |      +--------------+
                    | | ┌─────────────────────────────┐   |   
                    | | │  • Intent Classification    │   |   
                    | | │  • LLM (OpenRouter API)     │   |   
                    | | │  • Recipe Scraping (BS4)    │   |    
                    | | │  • Data Parsing (Pandas)    │   |   
                    | | │  • Speech In/Out (SR & TTS) │   |   
                    | | └─────────────────────────────┘   |   
                    +-------------------------------------+                                 
```

- **Frontend**: React Native (Expo Go)  
- **Backend**: FastAPI, Python  
- **Database & Realtime**: PostgreSQL, Supabase  
- **LLM Intents**: OpenRouter API  
- **Scraping & Analysis**: BeautifulSoup4, Pandas  
- **Accessibility**: SpeechRecognition, pyttsx3  

---

## ⚙️ Prerequisites

- Node.js & npm  
- Python 3.8+ & pip3  
- Expo Go (mobile)  
- Git  

---

## 🛠️ Installation & Setup

### 1. Clone & Enter Project  
```bash
git clone https://github.com/codeitnav/Sparkathon-SAM.git
cd Sparkathon-SAM
```

### 2. Frontend (Expo)  
```bash
cd frontend
npm install
npx expo start
```  
Scan the QR code in Expo Go (on the same Wi-Fi).

### 3. Backend API  
```bash
cd backend/API
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4. Chatbot Service  
```bash
cd ../chatbot
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

```
### 5. Running in Root
```bash
cd ../SAM
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

---

##  How to Use

1. Launch both backend services (API on port 8000, Chatbot on 5000).  
2. Start the Expo app and scan the store-specific QR code.  
3. In the mobile UI:  
   - Search a product or speak a recipe request.  
   - See real-time shelf locations, quantities, and checkout nudges.  
   - Tap the mic icon for hands-free voice input; listen to responses aloud.

---

##  How It Works

1. **QR → Store ID**  
   The app sends the store ID to FastAPI, which queries Supabase for that inventory snapshot.  
2. **Intent Classification**  
   User input → OpenRouter LLM → JSON intent (e.g. `{ "type": "recipe", "dish": "fried rice" }`).  
3. **Data Enrichment**  
   - For recipes: Scrape external sites (BeautifulSoup4), parse ingredients (Pandas).  
   - Match ingredients to live stock → return aisle & count.  
4. **Accessibility Layer**  
   - Voice in: SpeechRecognition → text.  
   - Voice out: pyttsx3 reads the JSON response.  
5. **Sustainable Nudge**  
   Suggest eco-friendly swaps + track “green coins” to boost loyalty.

---

##  Contributing

We welcome code improvements, UX enhancements, or fresh comic panels ! Please fork, branch, and submit PRs with clear issue references.

---
##  Authors
Navya Srivastava – Frontend development & integration of services.

Ekansh Dubey – Dataset creation & UI design; Frontend assistance.

Aayush Chauhan – Chatbot core; backend assistance.

Manish Sharma – Supabase, FastAPI & backend development.

---
##  License

This project is MIT-licensed. Let’s spark smarter, greener retail together.
