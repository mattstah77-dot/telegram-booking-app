require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cron = require('node-cron');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Import routes
const servicesRoutes = require('./api/routes/services');
const slotsRoutes = require('./api/routes/slots');
const bookingsRoutes = require('./api/routes/bookings');
const businessRoutes = require('./api/routes/business');
const adminRoutes = require('./api/routes/admin');

// Import services
const SlotEngine = require('./services/slot-engine');
const BookingEngine = require('./services/booking-engine');
const NotificationService = require('./services/notifications');

// Initialize app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make prisma and services available in req
app.use((req, res, next) => {
  req.prisma = prisma;
  req.slotEngine = new SlotEngine(prisma);
  req.bookingEngine = new BookingEngine(prisma);
  req.notificationService = new NotificationService(prisma);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API Routes
app.use('/api/services', servicesRoutes);
app.use('/api/slots', slotsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/admin', adminRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.details
    });
  }
  
  if (err.name === 'NotFoundError') {
    return res.status(404).json({
      error: 'Not Found',
      message: err.message
    });
  }
  
  if (err.name === 'ConflictError') {
    return res.status(409).json({
      error: 'Conflict',
      message: err.message
    });
  }
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Scheduled jobs
const ReminderJob = require('./services/notifications/reminder-job');
const reminderJob = new ReminderJob(prisma);

// Run every hour
cron.schedule('0 * * * *', () => {
  console.log('Running reminder job...');
  reminderJob.run();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
