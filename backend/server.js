const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Ollama } = require('ollama');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize Ollama client
const ollama = new Ollama({ host: process.env.OLLAMA_HOST || 'http://localhost:11434' });

// Knowledge base path
const KNOWLEDGE_PATH = path.join(__dirname, 'knowledge');

// Load knowledge documents for RAG
function loadKnowledgeBase() {
  try {
    if (!fs.existsSync(KNOWLEDGE_PATH)) {
      return '';
    }
    
    const files = fs.readdirSync(KNOWLEDGE_PATH);
    let knowledge = '';
    
    for (const file of files) {
      if (file.endsWith('.txt') || file.endsWith('.md')) {
        const content = fs.readFileSync(path.join(KNOWLEDGE_PATH, file), 'utf-8');
        knowledge += `\n--- ${file} ---\n${content}\n`;
      }
    }
    
    return knowledge;
  } catch (error) {
    console.error('Error loading knowledge base:', error);
    return '';
  }
}

// Generate response using Ollama
async function getOllamaResponse(message, context, weather) {
  const knowledgeBase = loadKnowledgeBase();
  
  const systemPrompt = `You are an expert agricultural advisor for Indian farmers. Your role is to help farmers with:
- Crop selection based on season, weather, soil type, and location
- Farming tools and equipment recommendations
- Growing tips, pest control, and best practices
- Irrigation and fertilizer guidance
- Market trends and harvest timing

${knowledgeBase ? `Reference Knowledge Base:\n${knowledgeBase}\n` : ''}
Current Context:
${context}

Guidelines:
- Give practical, actionable advice for Indian farming conditions
- Consider local climate, monsoon patterns, and regional practices
- Recommend affordable tools and organic methods when possible
- Keep responses clear, concise (2-4 paragraphs max)
- Use simple language, avoid jargon
- If the knowledge base contains relevant information, use it in your response
- Focus on sustainable and profitable farming`;

  const response = await ollama.chat({
    model: process.env.OLLAMA_MODEL || 'llama3.2',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ],
    options: {
      temperature: 0.7,
      num_predict: 500
    }
  });
  
  return response.message.content;
}

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// Fallback agricultural advice function
function getFallbackAdvice(message, weather) {
  const msg = message.toLowerCase();
  
  // Crop recommendations
  if (msg.includes('crop') || msg.includes('plant') || msg.includes('grow') || msg.includes('cultivate')) {
    const season = weather ? (weather.temperature > 30 ? 'summer' : weather.temperature < 20 ? 'winter' : 'monsoon') : 'current';
    return `🌾 **Crop Recommendations for ${season} season:**\n\n` +
           `For current weather conditions (${weather?.temperature || '25'}°C), consider:\n\n` +
           `• **Rice** - Ideal for monsoon season with good water availability\n` +
           `• **Wheat** - Best for winter/rabi season (Oct-Mar)\n` +
           `• **Cotton** - Suitable for black soil regions, kharif season\n` +
           `• **Sugarcane** - Requires irrigation, long-term crop\n` +
           `• **Pulses** (Lentils, Chickpeas) - Good for rotation, improves soil\n\n` +
           `💡 Choose based on your soil type, water availability, and local market demand.`;
  }
  
  // Weather/irrigation advice
  if (msg.includes('water') || msg.includes('irrigat') || msg.includes('rain')) {
    return `💧 **Irrigation & Water Management:**\n\n` +
           `Current conditions: ${weather?.description || 'Normal'}, ${weather?.humidity || '60'}% humidity\n\n` +
           `• Use drip irrigation for water efficiency (saves 40-60% water)\n` +
           `• Water early morning or evening to reduce evaporation\n` +
           `• Mulching helps retain soil moisture\n` +
           `• During monsoon, ensure proper drainage to prevent waterlogging\n` +
           `• Check soil moisture before watering - avoid overwatering`;
  }
  
  // Pest control
  if (msg.includes('pest') || msg.includes('insect') || msg.includes('disease')) {
    return `🐛 **Organic Pest Control Methods:**\n\n` +
           `• **Neem spray** - Mix neem oil with water for general pest control\n` +
           `• **Crop rotation** - Prevents pest buildup in soil\n` +
           `• **Companion planting** - Marigold, basil deter many pests\n` +
           `• **Natural predators** - Encourage ladybugs, birds\n` +
           `• **Regular monitoring** - Early detection prevents major damage\n\n` +
           `⚠️ Use chemical pesticides only as last resort, follow safety guidelines.`;
  }
  
  // Fertilizer advice
  if (msg.includes('fertili') || msg.includes('manure') || msg.includes('compost') || msg.includes('soil')) {
    return `🌱 **Soil & Fertilizer Management:**\n\n` +
           `• **Organic compost** - Best for soil health, use farm waste\n` +
           `• **Vermicompost** - Rich in nutrients, improves soil structure\n` +
           `• **Green manure** - Grow legumes, plow back for nitrogen\n` +
           `• **NPK balance** - Test soil, apply as needed (not excess)\n` +
           `• **Crop rotation** - Alternate deep/shallow root crops\n\n` +
           `📊 Get soil tested every 2-3 years for accurate fertilizer recommendations.`;
  }
  
  // Tools and equipment
  if (msg.includes('tool') || msg.includes('equipment') || msg.includes('machine') || msg.includes('tractor')) {
    return `🔧 **Essential Farming Tools & Equipment:**\n\n` +
           `**Basic Tools:**\n` +
           `• Spade, hoe, rake for small-scale farming\n` +
           `• Sickle for harvesting\n` +
           `• Sprayer for pesticides/fertilizers\n\n` +
           `**Powered Equipment:**\n` +
           `• **Tiller/cultivator** - Soil preparation (₹15,000-50,000)\n` +
           `• **Water pump** - Irrigation (₹5,000-25,000)\n` +
           `• **Seed drill** - Efficient sowing\n\n` +
           `💰 Consider renting expensive equipment or sharing with neighbors to reduce costs.`;
  }
  
  // Market/selling advice
  if (msg.includes('market') || msg.includes('sell') || msg.includes('price') || msg.includes('profit')) {
    return `💰 **Marketing & Selling Tips:**\n\n` +
           `• **Direct selling** - Cut middlemen, use platforms like ours\n` +
           `• **Farmer markets** - Better prices than wholesale\n` +
           `• **Contract farming** - Guaranteed price, less risk\n` +
           `• **Storage** - Store produce when prices are low, sell later\n` +
           `• **Value addition** - Processing increases profit margins\n\n` +
           `📱 Use online platforms to connect directly with buyers for better prices!`;
  }
  
  // General advice
  return `🌾 **General Farming Guidance:**\n\n` +
         `Hello! I'm your agricultural assistant. I can help you with:\n\n` +
         `• 🌱 Crop selection and recommendations\n` +
         `• 💧 Irrigation and water management\n` +
         `• 🐛 Pest control methods\n` +
         `• 🌱 Soil health and fertilizers\n` +
         `• 🔧 Tools and equipment advice\n` +
         `• 💰 Marketing and selling tips\n\n` +
         `Current weather in your area: ${weather?.temperature || 'N/A'}°C, ${weather?.description || 'N/A'}\n\n` +
         `Please ask me specific questions about farming, and I'll provide helpful advice!`;
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access denied' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    console.log('Decoded JWT user:', user);
    req.user = user;
    next();
  });
};

// ============ AUTH ROUTES ============

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, address } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password required' });
    }
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'farmer',
        phone,
        address
      }
    });
    
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, address: user.address },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, address: user.address },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get user profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    console.log('Profile request - req.user:', req.user);
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        experience: true,
        about: true,
        profilePhoto: true
      }
    });

    if (!user) {
      console.log('User not found for userId:', req.user.userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Profile found:', user);
    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, address, experience, about, profilePhoto } = req.body;
    
    console.log('Profile update request for userId:', req.user.userId);
    console.log('Update data received:', { 
      name, 
      phone, 
      address, 
      experience: experience || 'null', 
      about: about ? 'provided' : 'null',
      profilePhoto: profilePhoto ? 'provided' : 'null'
    });
    
    // Build update data - explicitly handle all fields
    const updateData = {};
    if (name !== undefined && name !== null) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    // Always update experience, about, and profilePhoto even if null
    updateData.experience = experience || null;
    updateData.about = about || null;
    updateData.profilePhoto = profilePhoto || null;
    
    console.log('Updating database with:', updateData);
    
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        experience: true,
        about: true,
        profilePhoto: true
      }
    });
    
    console.log('✅ Profile updated successfully in database');
    console.log('Saved data:', { 
      experience: user.experience, 
      about: user.about ? 'saved' : 'null',
      profilePhoto: user.profilePhoto ? 'saved' : 'null'
    });
    res.json(user);
  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile: ' + error.message });
  }
});

// Debug: list all users (no passwords) for data recovery (remove in production)
app.get('/api/debug/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, phone: true, address: true }
    });
    res.json(users);
  } catch (err) {
    console.error('Debug users fetch error:', err);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

// Password reset (if old password lost) - supply email & newPassword
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and newPassword required' });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { email }, data: { password: hashed } });
    res.json({ success: true });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

// ============ PRODUCT ROUTES ============

// Get all products with filters
app.get('/api/products', async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, location, sort } = req.query;
    
    const where = { available: true };
    
    if (search) {
      where.productName = { contains: search, mode: 'insensitive' };
    }
    if (category && category !== '') {
      where.category = category;
    }
    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }
    
    let orderBy = { createdAt: 'desc' };
    if (sort === 'name') orderBy = { productName: 'asc' };
    if (sort === 'price-low') orderBy = { price: 'asc' };
    if (sort === 'price-high') orderBy = { price: 'desc' };
    if (sort === 'date-new') orderBy = { createdAt: 'desc' };
    
    const products = await prisma.product.findMany({
      where,
      orderBy,
      include: {
        seller: {
          select: { id: true, name: true, phone: true, email: true, address: true }
        }
      }
    });
    
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        seller: {
          select: { id: true, name: true, phone: true, email: true, address: true }
        }
      }
    });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create product (protected)
app.post('/api/products', authenticateToken, async (req, res) => {
  try {
    const {
      productName,
      category,
      price,
      location,
      description,
      harvestDate,
      bestBefore,
      image
    } = req.body;
    
    if (!productName || !category || !price || !location || !description || !harvestDate || !bestBefore || !image) {
      return res.status(400).json({ error: 'All fields required' });
    }
    
    const product = await prisma.product.create({
      data: {
        sellerId: req.user.userId,
        productName,
        category,
        price: parseFloat(price),
        location,
        description,
        harvestDate,
        bestBefore,
        image,
        available: true
      },
      include: {
        seller: {
          select: { id: true, name: true, phone: true, email: true }
        }
      }
    });
    
    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product (protected)
app.put('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id }
    });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    if (product.sellerId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        seller: {
          select: { id: true, name: true, phone: true, email: true }
        }
      }
    });
    
    res.json(updated);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product (protected)
app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id }
    });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    if (product.sellerId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await prisma.product.delete({
      where: { id: req.params.id }
    });
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Get seller's products (protected)
app.get('/api/my-products', authenticateToken, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { sellerId: req.user.userId },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(products);
  } catch (error) {
    console.error('Get my products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// ============ ORDER ROUTES ============

// Create order (protected)
app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const {
      productId,
      quantity,
      buyerName,
      buyerPhone,
      buyerAddress
    } = req.body;
    
    if (!productId || !quantity || !buyerName || !buyerPhone || !buyerAddress) {
      return res.status(400).json({ error: 'All fields required' });
    }
    
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    if (!product.available) {
      return res.status(400).json({ error: 'Product not available' });
    }
    
    const totalPrice = product.price * quantity;
    
    const order = await prisma.order.create({
      data: {
        buyerId: req.user.userId,
        productId,
        quantity,
        totalPrice,
        buyerName,
        buyerPhone,
        buyerAddress,
        status: 'placed'
      },
      include: {
        product: true,
        buyer: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    
    res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get user's orders (protected)
app.get('/api/my-orders', authenticateToken, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { buyerId: req.user.userId },
      include: {
        product: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get farmer's received orders (protected)
app.get('/api/farmer-orders', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'farmer') {
      return res.status(403).json({ error: 'Access denied. Farmers only.' });
    }
    
    const orders = await prisma.order.findMany({
      where: {
        product: {
          sellerId: req.user.userId
        }
      },
      include: {
        product: {
          select: {
            id: true,
            productName: true,
            price: true,
            image: true
          }
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(orders);
  } catch (error) {
    console.error('Get farmer orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ============ AI CHATBOT ROUTES ============

// Get weather data for location
async function getWeatherData(location) {
  try {
    if (!process.env.OPENWEATHER_API_KEY || process.env.OPENWEATHER_API_KEY === 'your_openweather_api_key_here') {
      return null; // Weather API not configured yet
    }
    
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return {
      temperature: data.main.temp,
      humidity: data.main.humidity,
      description: data.weather[0].description,
      rainfall: data.rain?.['1h'] || 0
    };
  } catch (error) {
    console.error('Weather API error:', error);
    return null;
  }
}

// Chat endpoint
app.post('/api/chat', authenticateToken, async (req, res) => {
  try {
    const { message, location } = req.body;
    const userId = req.user.userId; // Fix: Changed from req.user.id to req.user.userId
    
    console.log('=== CHAT REQUEST ===');
    console.log('User ID:', userId);
    console.log('Message:', message);
    console.log('Location:', location);
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Check if Gemini API key is configured
    console.log('Gemini API Key exists:', !!process.env.GEMINI_API_KEY);
    console.log('Gemini API Key value:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 20) + '...' : 'NOT SET');
    
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      console.log('ERROR: Gemini API key not configured');
      return res.status(500).json({ 
        error: 'AI service not configured. Please add GEMINI_API_KEY to .env file.',
        needsSetup: true
      });
    }
    
    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, address: true }
    });
    
    // Get weather data if location provided
    const userLocation = location || user?.address || 'India';
    const weather = await getWeatherData(userLocation);
    
    // Build context for AI
    let contextInfo = `User: ${user?.name || 'Farmer'}\nLocation: ${userLocation}\n`;
    
    if (weather) {
      contextInfo += `Current Weather: ${weather.temperature}°C, ${weather.description}, Humidity: ${weather.humidity}%\n`;
    }
    
    // Agricultural expert system prompt
    const systemPrompt = `You are an expert agricultural advisor for Indian farmers. Your role is to help farmers with:
- Crop selection based on season, weather, soil type, and location
- Farming tools and equipment recommendations
- Growing tips, pest control, and best practices
- Irrigation and fertilizer guidance
- Market trends and harvest timing

Current context:
${contextInfo}

Guidelines:
- Give practical, actionable advice for Indian farming conditions
- Consider local climate, monsoon patterns, and regional practices
- Recommend affordable tools and organic methods when possible
- Keep responses clear, concise (2-4 paragraphs max)
- Use simple language, avoid jargon
- If asked about weather, use the provided weather data
- Focus on sustainable and profitable farming

User question: ${message}`;

    // Generate AI response
    let aiResponse;
    
    // Layer 1: Try Ollama (local LLM) first
    try {
      console.log('Calling Ollama (local LLM)...');
      aiResponse = await getOllamaResponse(message, contextInfo, weather);
      console.log('Ollama response received, length:', aiResponse.length);
    } catch (ollamaError) {
      console.log('Ollama failed:', ollamaError.message);
      
      // Layer 2: Try Gemini API
      try {
        console.log('Falling back to Gemini AI...');
        const result = await model.generateContent(systemPrompt);
        console.log('Gemini response received');
        aiResponse = result.response.text();
        console.log('Response text extracted, length:', aiResponse.length);
      } catch (geminiError) {
        console.log('Gemini API failed, falling back to Hugging Face:', geminiError.message);
        
        // Layer 3: Fallback to free Hugging Face API
        try {
          const hfResponse = await fetch('https://api-inference.huggingface.co/models/google/flan-t5-large', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              inputs: systemPrompt,
              parameters: {
                max_length: 500,
                temperature: 0.7,
                top_p: 0.9
              }
            })
          });
          
          const hfData = await hfResponse.json();
          
          if (Array.isArray(hfData) && hfData[0]?.generated_text) {
            aiResponse = hfData[0].generated_text;
            console.log('Hugging Face response received');
          } else {
            throw new Error('Invalid Hugging Face response');
          }
        } catch (hfError) {
          console.error('Hugging Face also failed:', hfError.message);
          // Layer 4: Use rule-based fallback response
          aiResponse = getFallbackAdvice(message, weather);
        }
      }
    }
    
    // Save chat history to database
    try {
      await prisma.chatMessage.create({
        data: {
          userId: userId,
          message: message,
          response: aiResponse,
          location: userLocation,
          weather: weather ? JSON.stringify(weather) : null
        }
      });
    } catch (dbError) {
      console.log('Chat history save skipped (table may not exist yet):', dbError.message);
    }
    
    res.json({ 
      response: aiResponse,
      weather: weather,
      location: userLocation
    });
    
  } catch (error) {
    console.error('===== CHAT ERROR =====');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error:', JSON.stringify(error, null, 2));
    res.status(500).json({ 
      error: 'Failed to generate response. Please try again.',
      details: error.message 
    });
  }
});

// Get chat history
app.get('/api/chat/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId; // Fix: Changed from req.user.id to req.user.userId
    const limit = parseInt(req.query.limit) || 20;
    
    const history = await prisma.chatMessage.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        message: true,
        response: true,
        location: true,
        weather: true,
        createdAt: true
      }
    });
    
    res.json({ history: history.reverse() });
    
  } catch (error) {
    console.error('Chat history error:', error);
    // If table doesn't exist yet, return empty history
    res.json({ history: [] });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Farmer Marketplace API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Database: SQLite (${process.env.DATABASE_URL})`);
  console.log(`🌾 Farmer Marketplace API ready!`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
