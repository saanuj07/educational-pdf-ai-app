# 🚀 Deploy to Render.com

This guide will help you deploy your Educational PDF AI App to Render.com for free!

## 📋 Prerequisites

1. **GitHub Account** with your project repository
2. **Render Account** - Sign up at [render.com](https://render.com)
3. **IBM Watson API Keys** - Get from [IBM Cloud](https://cloud.ibm.com)

## 🔧 Step 1: Prepare Your Repository

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Ensure these files exist** (already created for you):
   - `render.yaml` - Render configuration
   - `build.sh` - Build script
   - `.env.production` - Environment template

## 🌐 Step 2: Deploy on Render

### Option A: Using Render Dashboard (Recommended)

1. **Login to Render** → [dashboard.render.com](https://dashboard.render.com)

2. **Click "New Web Service"**

3. **Connect GitHub Repository**:
   - Select your `educational-pdf-ai-app` repository
   - Branch: `main`

4. **Configure Service**:
   ```
   Name: educational-pdf-ai-app
   Environment: Node
   Build Command: chmod +x build.sh && ./build.sh
   Start Command: npm start
   ```

5. **Add Environment Variables** (click "Advanced" → "Add Environment Variable"):
   ```
   NODE_ENV=production
   PORT=10000
   WATSON_API_KEY=[your-watson-api-key]
   WATSON_SPACE_ID=[your-watson-space-id] 
   WATSON_NLU_API_KEY=[your-nlu-api-key]
   WATSON_TTS_API_KEY=[your-tts-api-key]
   WATSON_STT_API_KEY=[your-stt-api-key]
   ```

6. **Click "Create Web Service"** 🎉

### Option B: Using render.yaml (Blueprint)

1. **Fork this repository** to your GitHub

2. **Go to Render** → "Blueprints" → "New Blueprint Instance"

3. **Connect repository** and deploy automatically

## 🔑 Step 3: Get IBM Watson API Keys

1. **Go to IBM Cloud** → [cloud.ibm.com](https://cloud.ibm.com)

2. **Create these services** (free tier available):
   - **Watsonx.ai** (Foundational Models)
   - **Natural Language Understanding**
   - **Text to Speech** 
   - **Speech to Text**

3. **Copy API keys** from each service dashboard

4. **Add to Render Environment Variables**:
   - Go to your Render service → "Environment"
   - Add each API key as a new variable

## 🎯 Step 4: Test Your Deployment

1. **Wait for build to complete** (~5-10 minutes)

2. **Visit your app URL**: `https://your-app-name.onrender.com`

3. **Test core features**:
   - ✅ Upload PDF
   - ✅ Generate quiz
   - ✅ Create flashcards
   - ✅ AI chat
   - ✅ Summary generation

## 🐛 Troubleshooting

### Build Failed?
```bash
# Check build logs in Render dashboard
# Common issues:
- Missing environment variables
- Node version mismatch
- Permission errors with build.sh
```

### App Won't Start?
```bash
# Check service logs for:
- Missing API keys
- Port configuration issues
- Database connection problems
```

### Features Not Working?
```bash
# Verify in Render Environment tab:
✅ All Watson API keys added
✅ NODE_ENV=production
✅ PORT=10000
✅ No extra spaces in API keys
```

## 🎉 Success!

Your app should now be live at: `https://your-app-name.onrender.com`

### Next Steps:
1. **Custom Domain**: Add your own domain in Render dashboard
2. **Monitoring**: Set up uptime monitoring
3. **Analytics**: Add Google Analytics or similar
4. **Backup**: Regular database backups (if using database)

## 💡 Pro Tips

- **Free Tier**: Render provides 750 hours/month free
- **Sleep Mode**: Free apps sleep after 15min inactivity
- **Wakeup**: First request after sleep takes ~30 seconds
- **Upgrade**: Paid plans ($7/month) keep apps always awake

## 🔗 Useful Links

- [Render Documentation](https://render.com/docs)
- [IBM Watson Documentation](https://cloud.ibm.com/docs)
- [GitHub Repository](https://github.com/saanuj07/educational-pdf-ai-app)

---

**Need help?** Check the troubleshooting section or create an issue on GitHub!
