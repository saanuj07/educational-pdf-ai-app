// IBM API keys and config loaded from environment variables - Multi-Region Setup
module.exports = {
  // Watson X.AI Configuration (EU-DE Region)
  watsonxApiKey: process.env.WATSON_API_KEY || process.env.WATSONX_API_KEY,
  watsonxUrl: process.env.WATSON_URL || process.env.WATSONX_URL,
  watsonModelId: process.env.WATSON_MODEL_ID || 'ibm/granite-13b-instruct-v2',
  spaceId: process.env.WATSON_SPACE_ID || process.env.SPACE_ID,
  // Note: No project ID required when using space ID
  
  // Watson Text to Speech (TTS) - AU-SYD Region
  ttsApiKey: process.env.WATSON_TTS_API_KEY || process.env.TTS_API_KEY,
  ttsUrl: process.env.WATSON_TTS_URL || process.env.TTS_URL,
  
  // Watson Natural Language Understanding (NLU) - AU-SYD Region
  nluApiKey: process.env.WATSON_NLU_API_KEY || process.env.NLU_API_KEY || process.env.NATURAL_LANGUAGE_UNDERSTANDING_APIKEY,
  nluUrl: process.env.WATSON_NLU_URL || process.env.NLU_URL || process.env.NATURAL_LANGUAGE_UNDERSTANDING_URL,
  
  // Watson Speech to Text (STT) - AU-SYD Region
  sttApiKey: process.env.WATSON_STT_API_KEY || process.env.STT_API_KEY || process.env.SPEECH_TO_TEXT_APIKEY,
  sttUrl: process.env.WATSON_STT_URL || process.env.STT_URL || process.env.SPEECH_TO_TEXT_URL
};
