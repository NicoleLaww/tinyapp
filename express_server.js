//REQUIREMENTS
const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const {getUserByEmail, urlsForUser, getIdFromDB, generateRandomStr} = require("./helpers.js");
const {urlDatabase, users} = require("./databases.js");

const app = express();
const PORT = 8080;

//MIDDLEWARE
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: "user-session",
  keys: ["tiny", "app"],
  maxAge: 5 * 60 * 60 * 1000
}));

//ROUTES
//Load url homepage
app.get("/urls", (req, res) => {
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
  const userId = req.session.userId;
  const user = users[userId];
  const id = req.params.id;
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
  const usersDb = users;
  if (!email || !password) {//empty fields
    return res.status(400).send("Empty Field");
  }
  if (getUserByEmail(email, usersDb)) {//already registered in system
    return res.status(400).send("Try another email");
  } else {//create new user
    users[`${userId}`] = { id: `${userId}`, email, password: hashedPassword};
    req.session.userId = userId;
    return res.redirect("/urls");
  }
});

//Load login page
app.get("/login", (req, res) => {
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
  const usersDb = users;
  const user = getUserByEmail(email, usersDb);
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
    }
  }
});

//Log out
app.post("/logout", (req, res) => {
  req.session = null;
  return res.redirect("/login");
});

//LISTENER
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
