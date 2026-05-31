import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import projectsRouter from './routes/projects';
import webhooksRouter from './routes/webhooks';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS with customizable origin rules
app.use(cors({
  origin: '*', // In production, replace with your client domain (e.g. process.env.CLIENT_URL)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Express built-in JSON body parser
app.use(express.json());

// API Routes
app.use('/api', projectsRouter);
app.use('/api/webhooks', webhooksRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start listening
app.listen(PORT, () => {
  console.log(`Easy Dubbing server successfully initialized on port ${PORT}`);
  console.log(`Serving API routes...`);
});
