# 🚀 Quick Deploy Guide

## For Users Who Want to Run This App

### 1. Prerequisites
- Node.js 16+ installed
- Git installed
- IBM Watson service account (free tier available)

### 2. Clone & Setup
```bash
# Clone the repository
git clone https://github.com/YOURUSERNAME/educational-pdf-ai-app.git
cd educational-pdf-ai-app

# Install all dependencies
npm install
```

### 3. Environment Setup
```bash
# Copy example environment files
cp .env.example .env
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### 4. Get IBM Watson Credentials
1. **Sign up at IBM Cloud**: https://cloud.ibm.com/
2. **Create these services** (free tier available):
   - Natural Language Understanding
   - Text to Speech
   - Speech to Text
   - Watsonx.ai (requires subscription)

3. **Copy credentials** to `server/.env`

### 5. Launch the App
```bash
# Start both frontend and backend
npm run dev
```

The app will open automatically in your browser!

### 6. Test Features
1. **Upload a PDF** using drag & drop
2. **Generate summaries** using AI
3. **Create quizzes** from PDF content
4. **Listen to podcasts** with text-to-speech
5. **Try voice input** with speech-to-text

## 🔧 Troubleshooting

**Port Issues**: App automatically finds available ports  
**API Errors**: Check your Watson credentials in `server/.env`  
**Upload Issues**: Make sure uploads/ directory has write permissions  

## 📞 Support

Open an issue on GitHub if you need help!
