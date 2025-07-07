# 📱 Sam Frontend – AI-Powered Smart Shopping Assistant

This is the **Frontend module** of **SAM**, an AI-driven in-store shopping assistant. The mobile interface is built with **React Native (Expo)** and offers users a seamless, intelligent, and inclusive shopping experience directly within physical retail environments.

---

## 🚀 Features

### 🔍 Landing Page (LandingScreen.tsx)
- **Store QR Integration:** Connects user to store inventory by scanning QR codes.
- **Smart Location Services:**
  - Requests user location permission.
  - Retrieves current coordinates and displays nearby stores.
  - Provides navigation via in-app map.
- **Nearby Stores Display:**
  - FlatList rendering of store data.
  - Allows visual discovery of close store branches.
- **Interactive Cards:**
  - Walmart-themed product/offer browsing cards.
- **Quick Access Shortcuts:**
  - Profile, Wallet, Location, and QR Scanner icons in the header/footer.

### 🗺️ Location Functionality
- Accurate geolocation via `expo-location`
- Custom debouncing and alert logic
- Smart redirection to map screen using coordinates

---

## 📂 Folder Structure (Relevant to Frontend)

```
Frontend/
├── app/
│   ├── (tabs)/                  # Tab-based screens (map, explore, wallet, etc.)
│   ├── _layout.tsx              # Root layout for routing and font loading
    ├── +not-found.tsx           # To handle page not found error
│
├── assets/
│   ├── fonts/                  # Custom fonts like PixelifySans-Regular.ttf
│   └── images/                 # Images used in cards and UI backgrounds
│
├── components/                # UI components
├── utils/                     # Utility functions (e.g., debounce)
│
├── app.json                   # Expo configuration
├── .gitignore
├── package.json
└── tsconfig.json              # TypeScript configuration
```

---

## 🛠️ Tech Stack

- **Framework:** React Native (Expo)
- **Navigation:** Expo Router
- **Location Services:** `expo-location`
- **Iconography:** `@expo/vector-icons` (Ionicons)
- **Font Loading:** `expo-font`
- **State Management:** React hooks
- **UX Components:** `FlatList`, `ImageBackground`, `TouchableOpacity`, `ActivityIndicator`, `SafeAreaView`

---

## 📦 Setup Instructions

Follow these steps to get the frontend up and running:

### 1. Clone the Repository

```bash
git clone https://github.com/codeitnav/Sparkathon-SAM.git
cd sam/Frontend
```

### 2. Install Dependencies

Make sure you have Node.js and npm installed. Then run:

```bash
npm install
```

### 3. Install Expo CLI (if not already installed)

```bash
npm install -g expo-cli
```

### 4. Start the Expo Development Server

```bash
npx expo start
```

This will open Expo Dev Tools in your browser.

### 5. Run on Device or Emulator

- Scan the QR code with the **Expo Go app** (iOS/Android)  
- Or press `i` to open iOS simulator or `a` for Android emulator

### 6. Grant Location Permissions

The app uses geolocation to find nearby stores. Ensure you allow location access when prompted.

---

> ✅ Fonts and images are automatically bundled via the `assets/` folder and referenced locally. No additional configuration is needed.
