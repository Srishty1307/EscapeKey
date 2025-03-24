import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = 3000;



app.use(express.static("public"));
// Resolve the directory for views
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Define routes
app.get('/', (req, res) => {
    res.render('index', { title: 'Home Page' });
});

app.get('/about', (req, res) => {
    res.render('about', { title: 'About Page' });
});

app.get('/account', (req, res) => {
    res.render('account', { title: 'Account Page' });
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

//call me
app.get('/call', (req, res) => {
    res.render('call', { callerName: 'Emergency Contact', profileImage: '/profile.jpeg' });
});


// Start the server
app.listen(port, ()=> {
    console.log(`server running on port ${port}`)
});