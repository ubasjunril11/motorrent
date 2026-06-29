const { GoogleGenAI } = require('@google/genai');
const pool = require('../config/db');

const SYSTEM_PROMPT = `You are a helpful motorcycle rental assistant for MotorRent app.
Your role is ONLY to provide recommendations and information about motorcycles.

You can help customers:
- Choose motorcycles based on budget, travel purpose, passenger capacity, and rental price
- Explain motorcycle features and specifications
- Compare different motorcycles
- Provide general rental tips

You MUST NOT:
- Perform bookings or reservations
- Modify any data
- Access administrative functions
- Pretend to have booked anything

When a user wants to book or reserve a motorcycle, respond helpfully but clearly tell them:
"To complete your booking, please go to the motorcycle details page and tap 'Book Now', or visit the Bookings section after logging in."

Always be friendly, concise, and practical. When recommending, mention specific motorcycle names from the available list.
If budget is mentioned, filter recommendations accordingly.
Format responses with clear bullet points when listing options.`;

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'your_gemini_api_key') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

exports.chat = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        success: false,
        message: 'AI assistant is not configured. Please set GEMINI_API_KEY in backend/.env',
      });
    }

    const [motorcycles] = await pool.query(
      "SELECT id, brand, model, year, description, daily_rate, capacity, engine_cc, fuel_type, status FROM motorcycles WHERE status = 'available'"
    );

    const motorcycleList = motorcycles
      .map(
        (m) =>
          `- ${m.brand} ${m.model} (${m.year}): ₱${m.daily_rate}/day, ${m.capacity} passengers, ${m.engine_cc || 'N/A'}cc, ${m.fuel_type}. ${m.description || ''} [ID: ${m.id}]`
      )
      .join('\n');

    const systemInstruction = `${SYSTEM_PROMPT}

Available motorcycles in our fleet:
${motorcycleList || 'No motorcycles currently available.'}`;

    const contents = history.slice(-10).map((h) => ({
      role: h.role === 'assistant' || h.role === 'model' ? 'model' : 'user',
      parts: [{ text: h.content }],
    }));

    contents.push({
      role: 'user',
      parts: [{ text: message.trim() }],
    });

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    const response = await ai.models.generateContent({
      model,
      contents,
      config: { systemInstruction },
    });

    const reply = response.text || 'Sorry, I could not generate a response. Please try again.';

    const wantsBooking = /book|reserve|rent|reservation/i.test(message);
    const bookingRedirect = wantsBooking
      ? '\n\n📌 To complete your booking, open the motorcycle details and tap **Book Now**, or go to **Bookings** after logging in.'
      : '';

    res.json({
      success: true,
      data: {
        reply: reply + bookingRedirect,
        suggested_motorcycles: motorcycles.slice(0, 3).map((m) => ({
          id: m.id,
          name: `${m.brand} ${m.model}`,
          daily_rate: m.daily_rate,
        })),
      },
    });
  } catch (err) {
    console.error('Gemini AI error:', err.message || err);

    const status = err.status || err.code;
    const errMsg = (err.message || '').toLowerCase();

    if (status === 401 || status === 403 || errMsg.includes('api key') || errMsg.includes('unauthorized')) {
      return res.status(503).json({
        success: false,
        message: 'Invalid Gemini API key. Get a key from https://aistudio.google.com/apikey and set GEMINI_API_KEY in backend/.env',
      });
    }

    if (status === 404 || errMsg.includes('not found') || errMsg.includes('model')) {
      return res.status(503).json({
        success: false,
        message: `Gemini model not available. Set GEMINI_MODEL=gemini-2.5-flash in backend/.env`,
      });
    }

    return res.status(503).json({
      success: false,
      message: 'AI assistant is temporarily unavailable. Please try again later.',
    });
  }
};

exports.getRecommendations = async (req, res, next) => {
  try {
    const { budget, purpose, capacity } = req.query;
    let query = "SELECT * FROM motorcycles WHERE status = 'available'";
    const params = [];

    if (budget) {
      query += ' AND daily_rate <= ?';
      params.push(parseFloat(budget));
    }

    if (capacity) {
      query += ' AND capacity >= ?';
      params.push(parseInt(capacity, 10));
    }

    query += ' ORDER BY daily_rate ASC LIMIT 5';

    const [motorcycles] = await pool.query(query, params);

    res.json({
      success: true,
      data: motorcycles,
      filters: { budget, purpose, capacity },
      message: purpose
        ? `Motorcycles suitable for ${purpose}`
        : 'Recommended motorcycles based on your criteria',
    });
  } catch (err) {
    next(err);
  }
};
