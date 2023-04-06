//REQUIREMENTS

const express = require("express");
// const cookieParser = require("cookie-parser");
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080;

//MIDDLEWARE

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());
app.use(cookieSession({
  name: "user-session",
  keys: ["tiny", "app"],
  maxAge: 5 * 60 * 60 * 1000
}));

//DATABASES

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userId: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userId: "aJ48lW",
  },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  }
};

//HELPER FUNCTIONS

const generateRandomStr = () => {
  const alphaNum = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += alphaNum.charAt(Math.floor(Math.random() * alphaNum.length));
  }
  return result;
};

const getUserByEmail = (email) => {
  for (const user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return false;
};

const getIdFromDB = (shorturl) => {
  for (const id in urlDatabase) {
    if (shorturl === id) {
      return true;
    }
  }
  return false;
};

const urlsForUser = (id) => {
  let customUrls = {};
  for (const shortUrl in urlDatabase) {
    const identifier = urlDatabase[shortUrl];
    if (identifier.userId === id) {
      customUrls[shortUrl] = urlDatabase[shortUrl];
    }
  }
  return customUrls;
};

//ROUTES

//Load url homepage
app.get("/urls", (req, res) => {
  // const userId = req.cookies.userId;
  const userId = req.session.userId;
  const user = users[userId];
  if (!user) {
    return res.status(401).send("Please log in");
  }
  const userSpecificUrls = urlsForUser(userId);
  const templateVars = { urls: userSpecificUrls, userId, user };
  if (user) {
    res.render("urls_index", templateVars);
  }
});

//Load create new url page, different for logged in versus not logged in
app.get("/urls/new", (req, res) => {
  // const userId = req.cookies.userId;
  const userId = req.session.userId;
  const user = users[userId];
  const templateVars = { userId, user};
  if (!user) {//if the user is not logged in or exists
    return res.redirect("/login");
  }
  return res.render("urls_new", templateVars);
});

//Load edit page for existing urls
app.get("/urls/:id", (req, res) => {
  // const userId = req.cookies.userId;
  const userId = req.session.userId;
  const user = users[userId];
  const id = req.params.id;
  // const longURL = urlDatabase[req.params.id].longURL;
  if (!user) {//if not a user
    return res.status(401).send("Please log in");
  }
  if (!getIdFromDB(id)) {//short url does not exist in system
    return res.status(404).send("Not Found");
  }
  const userSpecificUrls = urlsForUser(userId);
  const templateVars = { id, urls: userSpecificUrls, userId, user };
  if (user) {
    if (!userSpecificUrls[id]) {//if urls don't belong to user
      return res.status(401).send("Do not have proper permissions");
    } else {
      return res.render("urls_show", templateVars);
    }
  }
});

//Register Page
app.get("/register", (req, res) => {
  // const userId = req.cookies.userId;
  const userId = req.session.userId;
  const user = users[userId];
  const templateVars = { userId, user };
  if (user) {//if user already exists
    return res.redirect("/urls");
  }
  return res.render("urls_register", templateVars);
});


//Create new url
app.post("/urls", (req, res) => {
  // const userId = req.cookies.userId;
  const userId = req.session.userId;
  const user = users[userId];
  const { longURL } = req.body;
  if (!longURL) {//cannot update new url with empty string
    return res.send("Cannot be empty");
  }
  const id = generateRandomStr();
  urlDatabase[id] = {longURL, userId };
  const templateVars = { urlDatabase, userId, user, longURL, id};
  if (!user) {//if not a user or not logged in
    return res.render("urls_show.ejs", templateVars);
  }
  return res.redirect(`/urls/${id}`);
});

//Load existing url sites
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  if (!getIdFromDB(req.params.id)) {//url does not exist
    res.status(404).send("Not Found");
    return;
  }
  return res.redirect(longURL);
});

//Edit long url
app.post("/urls/:id", (req, res) => {
  const { urlUpdate } = req.body;
  const idToUpdate = req.params.id;
  if (!urlDatabase[idToUpdate]) {//id doesn't exist
    return res.status(404).send("Not Found");
  }
  // const userId = req.cookies.userId;
  const userId = req.session.userId;
  const user = users[userId];
  if (!user) {//not a user or not logged in
    return res.status(401).send("Unauthorized");
  }
  const userSpecificUrls = urlsForUser(userId);//urls don't belong to user
  if (!userSpecificUrls[idToUpdate]) {
    return res.status(401).send("Do not have proper permission.");
  }
  if (urlDatabase[idToUpdate]) {//if the short id exists in users' database
    urlDatabase[idToUpdate].longURL = urlUpdate;
  }
  return res.redirect(`/urls/${idToUpdate}`);
});

//Delete url
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  if (!getIdFromDB(id)) {//if id doesn't exist
    return res.status(404).send("Not Found");
  }
  // const userId = req.cookies.userId;
  const userId = req.session.userId;
  const user = users[userId];
  if (!user) {//if user is not logged in or registered
    return res.status(401).send("Unauthorized");
  }
  const userSpecificUrls = urlsForUser(userId);
  if (!userSpecificUrls[id]) {//if user does not own url
    return res.status(401).send("Do not have proper permissions");
  }
  delete urlDatabase[id];
  return res.redirect("/urls");
});

//Register new user
app.post("/register", (req, res) => {
  const userId = generateRandomStr();
  const email = req.body.email.trim();
  const password = req.body.password.trim();
  const hashedPassword = bcrypt.hashSync(password, 10);
  if (!email || !password) {//empty fields
    return res.status(400).send("Empty Field");
  }
  if (getUserByEmail(email)) {//already registered in system
    return res.status(400).send("Try another email");
  } else {//create new user
    users[`${userId}`] = { id: `${userId}`, email, password: hashedPassword};
    req.session.userId = userId;
    return res.redirect("/urls");
    // res.cookie("userId", userId)
     
  }
});

//Load login page
app.get("/login", (req, res) => {
  // const userId = req.cookies.userId;
  const userId = req.session.userId;
  const user = users[userId];
  const templateVars = {userId, user};
  if (!user) {//if the user is not logged in
    return res.render("urls_login", templateVars);
  }
  res.redirect("/urls");
});

//Log in
app.post("/login", (req, res) => {
  const email = req.body.email.trim();
  const password = req.body.password.trim();
  const user = getUserByEmail(email);
  const userId = user.id;
  if (!email || !password) {//check if fields are empty
    res.status(400).send("Empty Field");
  }
  if (!user) {//check if user with email exists
    res.status(401).send("Unauthorized. You do not have an account!");
  }
  if (user) {
    if (!bcrypt.compareSync(password, user.password)) {//check if password matches, if doesn't
      return res.status(403).send("Invalid Credentials");
    } else {//if everything is good
      req.session.userId = userId;
      return res.redirect("/urls");
      // .cookie("userId", userId)
    }
  }
});

//Log out
app.post("/logout", (req, res) => {
  req.session = null;
  return res.redirect("/login");
  // .clearCookie("userId")
    
});

//LISTENER

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
