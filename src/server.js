import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/index.js';
import { userRoutes, mediaRoutes,webhookRoutes } from './routes/index.js';

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/users', userRoutes);
app.use('/media', mediaRoutes);
app.use('/webhook', webhookRoutes);


// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the server!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Something went wrong!' 
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 