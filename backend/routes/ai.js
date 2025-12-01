import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { prompt } = req.body || {};
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'OPENAI_API_KEY manquant dans les variables d’environnement.' });
    }

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt requis.' });
    }

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content:
              "Tu es un assistant téléphonique pour des téléconseillers. Tu aides à préparer les appels commerciaux en analysant les informations de l'entreprise.",
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    );

    const reply = response.data?.choices?.[0]?.message?.content || '';
    res.json({ reply });
  } catch (error) {
    console.error('Erreur appel OpenAI:', error.response?.data || error.message);
    res.status(500).json({
      error: "Erreur lors de l'appel à l'assistant IA.",
      details: error.response?.data || null,
    });
  }
});

export { router as aiRoutes };


