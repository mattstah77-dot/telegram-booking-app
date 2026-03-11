// Vercel Serverless API Entry Point
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// Глобальный кэш для Prisma Client в serverless
let prisma;
function getPrismaClient() {
  if (!prisma) {
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
  }
  return prisma;
}

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    platform: 'vercel'
  });
});

// Подключаем роутеры
const servicesRouter = require('./routes/services');
const slotsRouter = require('./routes/slots');
const bookingsRouter = require('./routes/bookings');
const businessRouter = require('./routes/business');
const adminRouter = require('./routes/admin');

// Middleware для передачи Prisma в роуты
const prismaMiddleware = (req, res, next) => {
  req.prisma = getPrismaClient();
  next();
};

app.use('/api/services', prismaMiddleware, servicesRouter);
app.use('/api/slots', prismaMiddleware, slotsRouter);
app.use('/api/bookings', prismaMiddleware, bookingsRouter);
app.use('/api/business', prismaMiddleware, businessRouter);
app.use('/api/admin', prismaMiddleware, adminRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

module.exports = app;
