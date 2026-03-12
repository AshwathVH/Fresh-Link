# AI Chatbot Setup Guide

## 🤖 Google Gemini AI Integration

Your Fresh Link application now has an intelligent AI chatbot that helps farmers with:
- Crop selection based on weather, season, and location
- Tool and equipment recommendations
- Growing tips and best practices
- Pest control and fertilizer guidance

## 🔑 Step 1: Get Your Google Gemini API Key (FREE)

1. Go to **Google AI Studio**: https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click **"Get API Key"** or **"Create API Key"**
4. Copy your API key (it will look like: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`)

### Free Tier Limits:
- ✅ **1,500 requests per day** (FREE forever)
- ✅ **15 requests per minute**
- ✅ **1 million tokens per minute**
- ✅ Perfect for your farming marketplace!

## 🌤️ Step 2: Get Weather API Key (Optional but Recommended)

1. Go to **OpenWeatherMap**: https://openweathermap.org/api
2. Sign up for a free account
3. Go to **"API Keys"** section
4. Copy your default API key

### Free Tier Limits:
- ✅ **1,000 API calls per day** (FREE)
- ✅ **60 calls per minute**
- ✅ Current weather data for any location

## ⚙️ Step 3: Configure Your Keys

1. Open the file: `backend/.env`
2. Find these lines:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   OPENWEATHER_API_KEY=your_openweather_api_key_here
   ```
3. Replace `your_gemini_api_key_here` with your actual Gemini API key
4. Replace `your_openweather_api_key_here` with your actual OpenWeather API key
5. Save the file

### Example:
```env
GEMINI_API_KEY=your_gemini_api_key_here
OPENWEATHER_API_KEY=your_openweather_api_key_here
```

## 🚀 Step 4: Restart the Server

1. Stop your backend server if it's running (Ctrl+C in the terminal)
2. Start it again:
   ```powershell
   cd backend
   node server.js
   ```
3. You should see: `🚀 Server running on http://localhost:3000`

## ✅ Step 5: Test the Chatbot

1. Go to your application: http://localhost:5500
2. Login as a farmer or buyer
3. Look for the **green floating button** with 🌾 icon (bottom-right corner)
4. Click it to open the AI chatbot
5. Try asking:
   - "What crops should I plant this season?"
   - "What tools do I need for rice farming?"
   - "How to improve soil quality?"

## 🎯 Features

### ✨ Smart Features:
- **Location-aware**: Uses your address to provide local advice
- **Weather-based**: Suggests crops based on current weather (if API configured)
- **Chat history**: Saves your conversations in the database
- **Suggested questions**: Quick-start buttons for common queries
- **Real-time responses**: Powered by Google's Gemini 1.5 Flash AI

### 🌾 What the AI Can Help With:
1. **Crop Planning**
   - Best crops for current season
   - Weather-appropriate planting
   - Soil type considerations

2. **Tools & Equipment**
   - Required farming tools
   - Equipment recommendations
   - Maintenance tips

3. **Growing Guidance**
   - Planting techniques
   - Irrigation schedules
   - Fertilizer application

4. **Problem Solving**
   - Pest identification
   - Disease prevention
   - Yield optimization

## 🔧 Troubleshooting

### Error: "AI service not configured"
- **Solution**: You haven't added the Gemini API key yet. Follow Step 3 above.

### Error: "Failed to generate response"
- **Check**: Is your API key valid?
- **Check**: Have you exceeded the free tier limit (1,500 requests/day)?
- **Check**: Is your internet connection working?

### Weather data not showing
- **Optional**: Weather integration requires the OpenWeather API key
- **Note**: The chatbot will still work without weather data, just less context-aware

### Chat history not loading
- **Normal**: This happens if you just set up the database
- **Solution**: Use the chatbot once, it will automatically create the history

## 📊 Database Schema

The chatbot uses a new `ChatMessage` table:
- **id**: Unique identifier
- **userId**: Who asked the question
- **message**: User's question
- **response**: AI's answer
- **location**: Location context
- **weather**: Weather data (JSON)
- **createdAt**: Timestamp

## 🎨 Customization

### Change the AI's personality:
Edit `backend/server.js`, find the `systemPrompt` around line 530 and modify the instructions.

### Add more suggestion buttons:
Edit `frontend/farmer_page.html` or `buyer_page.html`, find the `.chat-suggestions` section and add more buttons.

### Adjust chat window size:
Edit the CSS in `farmer_page.html` or `buyer_page.html`, find `.chat-window` and change `width` and `height`.

## 💡 Tips

1. **API Key Security**: Never commit your `.env` file to GitHub
2. **Rate Limits**: With 1,500 requests/day, you can handle ~60 users asking 25 questions each
3. **Cost**: Gemini 1.5 Flash is **FREE forever** for this usage level
4. **Upgrade**: If you need more, Google offers paid tiers starting at $7/month for 1 million requests

## 🆘 Need Help?

- **Google Gemini Docs**: https://ai.google.dev/gemini-api/docs
- **OpenWeather Docs**: https://openweathermap.org/api
- **Prisma Docs**: https://www.prisma.io/docs

---

**Note**: The AI chatbot appears on both farmer and buyer pages. All users can ask farming questions regardless of their role!
