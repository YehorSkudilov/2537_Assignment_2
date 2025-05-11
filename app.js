import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';
import express from 'express';
import bcrypt from 'bcrypt';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import Joi from 'joi';
import expressLayouts from "express-ejs-layouts";
import fs from "fs";

dotenv.config();
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || 9000;

//Mongo DB connection
const mongoUser = process.env.MONGODB_USER;
const mongoPass = process.env.MONGODB_PASSWORD;
const mongoHost = process.env.MONGODB_HOST;
const mongoDB = process.env.MONGODB_DATABASE;

const mongoURI = `mongodb+srv://${mongoUser}:${mongoPass}@${mongoHost}/${mongoDB}?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(mongoURI);
await client.connect();

const db = client.db(mongoDB);

function ensureRole(requiredRole) {
    return async (req, res, next) => {
      if (!req.session || !req.session.email) {
        return res.status(401).send("Unauthorized");
      }
  
      try {
        const user = await db.collection("users").findOne(
          { email: req.session.email },
          { projection: { role: 1 } }
        );
  
        if (!user) {
          return res.status(401).send("User not found");
        }
  
        // Live role check
        if (user.role !== requiredRole) {
            return res.status(403).render("access_denied", {
                title: "Access Denied",
                pageCSS: "/css/access_denied.css",
                pageJS: "/js/access_denied.js",
                showNav: true,
                role: user.role,
                showFooter: true
              });
        }
  
        // Optionally refresh session.role with the latest
        req.session.role = user.role;
  
        next();
      } catch (err) {
        console.error("Role check failed:", err);
        return res.status(500).send("Internal server error");
      }
    };
  }
  

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "frontend/views"));
app.use(expressLayouts);
app.set("layout", "layouts/default"); 
app.use(express.static(path.join(__dirname, "frontend")));


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
    const publicRoutes = ["/", "/login", "/signup", "/404"];
  
    const sessionExists = req.session && req.session.email;

    if (!sessionExists && !publicRoutes.includes(req.path)) {
      return res.redirect("/");
    }
  
    next();
  });

  
  

// Routes

app.get("/login", (req, res) => {
    res.render("login", {
      title: "Login",
      pageCSS: "/css/login.css",
      pageJS: "/js/login.js",
      showNav: false,
      showFooter: false
    });
  });
  
  app.get("/signup", (req, res) => {
    res.render("signup", {
      title: "Signup",
      pageCSS: "/css/signup.css",
      pageJS: "/js/signup.js",
      showNav: false,
      showFooter: false
    });
  });

app.get("/", (req, res) => {
    const sessionExists = req.session && req.session.email;
    if(sessionExists) {

    res.redirect("/home")
    } else {
    
    res.render("login_home", {
        title: "Home",
        pageCSS: "/css/login_home.css",
        pageJS: "/js/login_home.js",
        showNav: false,
        showFooter: false
    });
    }
});

app.get("/admin", ensureRole("admin"), (req, res) => {
    res.render("admin", {
      title: "Admin",
      pageCSS: "/css/admin.css",
      pageJS: "/js/admin.js",
      showNav: true,
      showFooter: true
    });
  });
  
  


function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  const autoRouteDir = path.join(process.cwd(), "./frontend/views/autoRoute");
  
  fs.readdirSync(autoRouteDir).forEach(file => {
    const ext = path.extname(file);
    const name = path.basename(file, ext);
  
    if (ext === ".ejs") {
      const route = `/${name}`;
      // Check if the route is already defined
      const isAlreadyDefined = app._router?.stack?.some(layer =>
        layer.route?.path === route
      ) || false;
      
  
      if (!isAlreadyDefined) {
        app.get(route, (req, res) => {
          res.render(`autoRoute/${name}`, {
            layout: "layouts/default",
            title: capitalizeFirst(name),
            pageCSS: `/css/${name}.css`,
            pageJS: `/js/${name}.js`,
            showNav: true,
            showFooter: true
          });
        });
      }
    }
  }); 
  
  

app.post('/signup', async (req, res) => {

    const schema = Joi.object({
        name: Joi.string().max(50).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(1).max(50).required()
    });

    const validation = schema.validate(req.body);

    if (validation.error) {
        return res.status(400).send("Invalid input: " + validation.error.details[0].message);
    }

    const { name, email, password } = req.body;
    const role = "user"; // Default role
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
    role: role,
    password: hashedPassword,
    createdAt: new Date()
    });

    req.session.name = name;
    req.session.email = email;
    req.session.role = role;

    
    console.log("Session after signup:", req.session);

    res.redirect('/');
});

app.post('/login', async (req, res) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(1).max(50).required()
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
    req.session.role = user.role;

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

app.get("/admin/users", ensureRole("admin"), async (req, res) => {
    const users = await db.collection("users").find({}, {
      projection: { _id: 0, name: 1, role: 1, email: 1, createdAt: 1 }
    }).toArray();
  
    res.status(200).json(users);
  });
  

  app.post("/admin/users/update-role", ensureRole("admin"), async (req, res) => {
    const schema = Joi.object({
        name: Joi.string().min(1).max(50).required(),
        newRole: Joi.string().valid("admin", "user").required()
      });
      
      const validation = schema.validate(req.body);
      if (validation.error) {
        return res.status(400).json({ error: validation.error.details[0].message });
      }
      
      const { name, newRole } = req.body;
      
  
    try {
      const result = await db.collection("users").updateOne(
        { name },
        { $set: { role: newRole } }
      );
  
      if (result.modifiedCount === 0) {
        return res.status(404).json({ error: "User not found or role unchanged" });
      }
  
      res.status(200).json({ message: "Role updated successfully" });
    } catch (err) {
      console.error("Error updating role:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  

// 404 handler
app.use((req, res) => {
    res.redirect("/404");
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
