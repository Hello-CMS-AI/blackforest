const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const cron = require('node-cron'); // Step: Import node-cron
const { updateStockOrderStatus } = require('./controllers/orderController'); // Step: Import the function

require('dotenv').config();
const categoryRoutes = require('./routes/categoryRoutes');
const albumRoutes = require('./routes/albumRoutes');
const authRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const branchRoutes = require('./routes/branchRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/order');
const dailyAssignmentsRoutes = require('./routes/dailyAssignments');
const tableCategoryRoutes = require('./routes/tableCategoryRoutes');
const tableRoutes = require('./routes/tableRoutes');

const app = express();

// Ensure the uploads/products directory exists
const uploadDir = path.join(__dirname, 'uploads/products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Upload directory created:', uploadDir);
}

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api', categoryRoutes);
app.use('/api', albumRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', productRoutes);
app.use('/api', branchRoutes);
app.use('/api', employeeRoutes);
app.use('/api', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/daily-assignments', dailyAssignmentsRoutes);
app.use('/api/table-categories', tableCategoryRoutes);
app.use('/api/tables', tableRoutes);

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Global error:', err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Step: Schedule the stock order status update to run every hour
cron.schedule('*/15 * * * *', () => {
  console.log('Running scheduled task to update stock order status');
  updateStockOrderStatus();
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));