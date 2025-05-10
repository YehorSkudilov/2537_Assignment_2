import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';
import express from 'express';
import bcrypt from 'bcrypt';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import Joi from 'joi';

dotenv.config();
const app = express();

const port = process.env.PORT || 9000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//Mongo DB connection
const mongoUser = process.env.MONGODB_USER;
const mongoPass = process.env.MONGODB_PASSWORD;
const mongoHost = process.env.MONGODB_HOST;
const mongoDB = process.env.MONGODB_DATABASE;

const mongoURI = `mongodb+srv://${mongoUser}:${mongoPass}@${mongoHost}/${mongoDB}?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(mongoURI);
await client.connect();

const db = client.db(mongoDB);

app.use("/css", express.static("./frontend/css"));
app.use("/js", express.static("./frontend/js"));
app.use("/images", express.static("./frontend/assets/images"));

var mongoStore = MongoStore.create({
	mongoUrl: `${mongoURI}/sessions`,
	crypto: {
		secret: process.env.MONGODB_SESSION_SECRET
	},
    ttl: 60 * 60 // 1 hour in seconds
});

//Session
app.use(session({ 
    secret: process.env.NODE_SESSION_SECRET,
	store: mongoStore,
	saveUninitialized: false, 
	resave: true,
    cookie: {
        maxAge: 1000 * 60 * 60 // 1 hour in milliseconds
    }
}));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//Block pages for not logged in users
app.use((req, res, next) => {
    const publicRoutes = ["/", "/login", "/signup"];
  
    const sessionExists = req.session && req.session.email;

    if (!sessionExists && !publicRoutes.includes(req.path)) {
      return res.redirect("/");
    }
  
    next();
  });
  

// Routes
app.get('/', (req, res) => {
    const sessionExists = req.session && req.session.email;

    if(sessionExists) {
        res.sendFile(path.join(__dirname, 'frontend/pages/home.html'));
    } else{
        res.sendFile(path.join(__dirname, 'frontend/pages/login_home.html'));
    }
});

app.get('/signup', (req, res) => {
    const sessionExists = req.session && req.session.email;

    if(sessionExists) {
        res.redirect('/'); 
    } else{
        res.sendFile(path.join(__dirname, 'frontend/pages/signup.html'));
    }

});

app.get('/login', (req, res) => {
    const sessionExists = req.session && req.session.email;

    if(sessionExists) {
        res.redirect('/'); 
    } else{
        res.sendFile(path.join(__dirname, 'frontend/pages/login.html'));
    }

});

app.get('/members', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/pages/members.html'));
});

app.post('/signup', async (req, res) => {

    const schema = Joi.object({
        name: Joi.string().max(50).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).max(50).required()
    });

    const validation = schema.validate(req.body);

    if (validation.error) {
        return res.status(400).send("Invalid input: " + validation.error.details[0].message);
    }

    const { name, email, password } = req.body;

    const usersCollection = db.collection("users");

    // Check if email already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
    return res.status(400).send("Email already registered.");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert new user
    await usersCollection.insertOne({
    name,
    email,
    password: hashedPassword,
    createdAt: new Date()
    });

    req.session.name = name;
    req.session.email = email;
    
    console.log("Session after signup:", req.session);

    res.redirect('/');
});

app.post('/login', async (req, res) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).max(50).required()
    });

    const validation = schema.validate(req.body);

    if (validation.error) {
        return res.status(400).send("Invalid input: " + validation.error.details[0].message);
    }

    const { email, password } = req.body;

    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ email });
    if (!user) {
        return res.status(401).send("Invalid email or password.");
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        return res.status(401).send("Invalid email or password.");
    }

    req.session.email = user.email;
    req.session.name = user.name;

    res.redirect('/');
});

app.post('/logout', async (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});

app.get('/session-info', (req, res) => {
    if (req.session && req.session.email) {
        res.json({
            loggedIn: true,
            name: req.session.name,
            email: req.session.email
        });
    } else {
        res.status(401).json({
            loggedIn: false,
            message: 'Not authenticated'
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/pages/404.html'));
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
