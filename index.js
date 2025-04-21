import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { startChatSession, sendChatMessage } from './services/geminiService.js';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = 3000;
const activeChatSessions = {};

app.use(express.static("public"));
app.use(express.json()); // To parse JSON request bodies

// Resolve the directory for views
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Define routes
app.get('/', (req, res) => {
    res.render('register', { title: 'Home Page' });
});

app.get('/about', (req, res) => {
    res.render('about', { title: 'About Page' });
});

app.get('/chat', (req, res) => {
    res.render('chat', { title: 'Chat Support' });
});

app.get('/register', (req, res) => {
    res.render('register', { title: 'Register Page' });
});

app.get('/emergency', (req, res) => {
    res.render('emergency', { title: 'Emergency Page' });
});

app.get('/resources', (req, res) => {
    res.render('resources', { title: 'Resources Page' });
});

app.get('/search', (req, res) => {
    res.render('search', { title: 'Search Page' });
});

app.get('/login', (req, res) => {
    res.render('login', { title: 'Login Page' });
});

app.get('/index', (req, res) => {
    res.render('index', { title: 'Dashboard Page' });
});

// New route for Gmail contacts
app.get('/gmail-contacts', (req, res) => {
    res.render('gmail_contacts', { title: 'Gmail Contacts' });
});

//call me
app.get('/call', (req, res) => {
    res.render('call', { callerName: 'Emergency Contact', profileImage: '/profile.jpeg' });
});

// API endpoint to send SOS emails
app.post('/api/send-sos', async (req, res) => {
    try {
        const { userId, latitude, longitude } = req.body;
        
        if (!userId || !latitude || !longitude) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Create Google Maps link
        const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        
        // Set up nodemailer with your email service credentials
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'your-email@gmail.com', // Replace with your email or use environment variable
                pass: process.env.EMAIL_PASSWORD || 'your-app-password'  // Replace with your app password or use environment variable
            }
        });
        
        // Fetch user's Gmail contacts from Supabase
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
            'https://ymxigsibffkloakqualr.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlteGlnc2liZmZrbG9ha3F1YWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzNTEyNTgsImV4cCI6MjA1ODkyNzI1OH0.E_Y4CqmWN12peYFdn6qyXTKw6ja1e9AfT-b3kDg9_6M'
        );
        
        const { data: contacts, error } = await supabase
            .from('gmail_contacts')
            .select('gmail')
            .eq('user_id', userId);
            
        if (error) {
            console.error('Error fetching contacts:', error);
            return res.status(500).json({ error: 'Failed to fetch contacts' });
        }
        
        if (!contacts || contacts.length === 0) {
            return res.status(404).json({ error: 'No contacts found for this user' });
        }
        
        // Get the user profile to include name in the email
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', userId)
            .single();
            
        const userName = profile?.full_name || 'A user';
        
        // Send emails to all contacts
        const emailPromises = contacts.map(contact => {
            const mailOptions = {
                from: process.env.EMAIL_USER || 'your-email@gmail.com',
                to: contact.gmail,
                subject: 'EMERGENCY: SOS Alert',
                html: `
                    <h1 style="color: #E63946;">EMERGENCY SOS ALERT</h1>
                    <p><strong>${userName}</strong> has triggered an SOS alert!</p>
                    <p>Their current location is:</p>
                    <p><a href="${googleMapsUrl}" style="background-color: #457B9D; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">View Location on Google Maps</a></p>
                    <p>Please respond immediately or contact emergency services if appropriate.</p>
                    <p>This is an automated message from Escape Key.</p>
                `
            };
            
            return transporter.sendMail(mailOptions);
        });
        
        await Promise.all(emailPromises);
        
        res.status(200).json({ success: true, message: 'SOS alerts sent successfully' });
    } catch (err) {
        console.error('Error sending SOS emails:', err);
        res.status(500).json({ error: 'Failed to send SOS emails' });
    }
});
//ai
app.post('/api/chat/start', async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      const chatSession = await startChatSession();
      activeChatSessions[userId] = chatSession;
      
      res.status(200).json({ success: true, message: 'Chat session started' });
    } catch (error) {
      console.error('Error starting chat session:', error);
      res.status(500).json({ error: 'Failed to start chat session' });
    }
  });
  
  app.post('/api/chat/message', async (req, res) => {
    try {
      const { userId, message } = req.body;
      
      if (!userId || !message) {
        return res.status(400).json({ error: 'User ID and message are required' });
      }
      
      const chatSession = activeChatSessions[userId];
      
      if (!chatSession) {
        // Start a new session if one doesn't exist
        activeChatSessions[userId] = await startChatSession();
      }
      
      const response = await sendChatMessage(activeChatSessions[userId], message);
      
      res.status(200).json({ success: true, response });
    } catch (error) {
      console.error('Error sending chat message:', error);
      res.status(500).json({ error: 'Failed to send chat message' });
    }
  });

// Start the server
app.listen(port, ()=> {
    console.log(`server running on port ${port}`)
});