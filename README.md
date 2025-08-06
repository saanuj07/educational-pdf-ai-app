# 🚀 Educational PDF AI App

A powerful full-stack web application that transforms PDF documents into interactive educational content using IBM Watson AI services.

## ✨ Features

### 📄 PDF Processing
- **Drag & Drop Upload**: Intuitive PDF file upload interface
- **Text Extraction**: Advanced PDF parsing and content analysis
- **Local Storage**: Secure file management with metadata persistence

### 🧠 AI-Powered Learning Tools
- **Smart Summaries**: Generate concise document summaries
- **Quiz Generation**: Create interactive quizzes from PDF content
- **Flashcards**: Automatic flashcard generation for key concepts
- **Study Guides**: Comprehensive study materials creation
- **Podcast Generation**: Convert text to audio for auditory learning

### 🎯 IBM Watson Integration
- **Natural Language Understanding**: Extract keywords, concepts, and sentiment
- **Text-to-Speech**: High-quality audio generation with 23+ English voices
- **Speech-to-Text**: Voice input support with 87+ language models
- **Watsonx.ai**: Advanced text generation using Granite models

### 🎨 Modern Interface
- **Animated UI**: Beautiful gradient backgrounds with floating shapes
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Professional Logging**: Next.js style development experience
- **Error Detection**: Comprehensive error handling and reporting

## 🏗️ Architecture

### Frontend (React)
- **Framework**: React 18 with Create React App
- **Styling**: Custom CSS with animations and gradients
- **Components**: Modular, reusable UI components
- **State Management**: React hooks and context

### Backend (Node.js/Express)
- **Framework**: Express.js with modern middleware
- **Storage**: Local file system with JSON metadata
- **AI Services**: IBM Watson SDK integration
- **API**: RESTful endpoints for all features

### Multi-Region Watson Setup
- **Watsonx.ai**: EU-DE region for text generation
- **NLU/TTS/STT**: AU-SYD region for other services
- **Authentication**: IAM-based service authentication

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager
- IBM Watson service credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/educational-pdf-ai-app.git
   cd educational-pdf-ai-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   Create `.env` files in the root, client, and server directories:

   **Root .env:**
   ```env
   NODE_ENV=development
   PORT=5000
   CLIENT_PORT=3000
   ```

   **Server .env:**
   ```env
   # Watson Natural Language Understanding (AU-SYD)
   NLU_API_KEY=your_nlu_api_key
   NLU_URL=https://api.au-syd.natural-language-understanding.watson.cloud.ibm.com/instances/your_instance_id

   # Watson Text to Speech (AU-SYD)
   TTS_API_KEY=your_tts_api_key
   TTS_URL=https://api.au-syd.text-to-speech.watson.cloud.ibm.com/instances/your_instance_id

   # Watson Speech to Text (AU-SYD)
   STT_API_KEY=your_stt_api_key
   STT_URL=https://api.au-syd.speech-to-text.watson.cloud.ibm.com/instances/your_instance_id

   # Watsonx.ai (EU-DE)
   WATSONX_API_KEY=your_watsonx_api_key
   WATSONX_URL=https://eu-de.ml.cloud.ibm.com
   WATSONX_SPACE_ID=your_space_id
   WATSONX_MODEL_ID=ibm/granite-13b-instruct-v2
   ```

   **Client .env:**
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_FEATURES_ENABLED=true
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```

   This will start both the backend server and React frontend automatically.

## 📖 Usage

### Uploading PDFs
1. Open the application in your browser
2. Drag and drop a PDF file onto the upload area
3. Wait for the file to be processed and analyzed

### Generating Educational Content
- **Summary**: Click "Generate Summary" for a concise overview
- **Quiz**: Create interactive questions based on the content
- **Flashcards**: Generate key concept cards for studying
- **Study Guide**: Comprehensive study materials
- **Podcast**: Convert content to audio format

### Voice Features
- **Text-to-Speech**: Listen to generated content
- **Speech-to-Text**: Use voice input for queries

## 🛠️ Development

### Project Structure
```
educational-pdf-ai-app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── styles/       # CSS styles
│   │   └── utils/        # Utility functions
│   └── public/           # Static assets
├── server/                # Node.js backend
│   ├── controllers/      # API controllers
│   ├── services/         # Watson service integrations
│   ├── utils/           # Utility functions
│   ├── uploads/         # Local file storage
│   └── server.js        # Main server file
├── dev-server.js         # Development launcher
└── package.json          # Project configuration
```

### Available Scripts

#### Development
- `npm run dev` - Start both frontend and backend
- `npm run server` - Start backend only
- `npm run client` - Start frontend only

#### Production
- `npm run build` - Build for production
- `npm start` - Start production server

#### Testing
- `npm test` - Run test suite

### Adding New Features
1. Create API endpoints in `server/controllers/`
2. Add Watson service integrations in `server/services/`
3. Build React components in `client/src/components/`
4. Update routing and state management as needed

## 🔧 Configuration

### Watson Services Setup
1. Create IBM Cloud account
2. Provision Watson services in appropriate regions
3. Copy service credentials to environment files
4. Test connectivity using the provided test script

### Local Storage
The application uses local file storage by default:
- PDF files stored in `server/uploads/`
- Metadata tracked in `metadata.json`
- Audio files generated in `server/uploads/audio/`

## 🚨 Troubleshooting

### Common Issues

**Port Conflicts**
- The app automatically detects available ports
- Backend defaults to 5000, frontend to 3000
- Check console output for actual port assignments

**Watson API Errors**
- Verify credentials in `.env` files
- Check service region configuration
- Run test script to verify connectivity

**File Upload Issues**
- Ensure `uploads/` directory exists
- Check file permissions
- Verify PDF file format and size

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
- Open a GitHub issue
- Check existing documentation
- Review troubleshooting guide

## 🙏 Acknowledgments

- IBM Watson for AI services
- React and Node.js communities
- PDF-parse library for document processing

---

**Made with ❤️ for better education through AI**
