const express = require("express");
const cookieParser = require("cookie-parser");

const PORT = 8080;

const app = express();
app.set("view engine", "ejs");

//middleware
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

const generateRandomStr = () => {
  const alphaNum = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += alphaNum.charAt(Math.floor(Math.random() * alphaNum.length));
  }
  return result;
};

app.get("/urls", (req, res) => {
  const userId = req.cookies.userId;
  const user = users[userId];
  const templateVars = { urls: urlDatabase, userId, user };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const { longURL } = req.body;
  const id = generateRandomStr();
  urlDatabase[id] = longURL;
  // console.log(urlDatabase);
  res.redirect(`/urls/${id}`);
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies.userId;
  const user = users[userId];
  const templateVars = { userId, user};
  res.render("urls_new", templateVars);
});

app.post("/urls/:id", (req, res) => {
  const { urlUpdate } = req.body;
  const idToUpdate = req.params.id;
  if (urlDatabase[idToUpdate]) {
    urlDatabase[idToUpdate] = urlUpdate;
  }
  res.redirect(`/urls/${idToUpdate}`);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.get("/urls/:id", (req, res) => {
  const userId = req.cookies.userId;
  const user = users[userId];
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], userId, user };
  // console.log(templateVars.longURL);
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  const userId = req.cookies.userId;
  const user = users[userId];
  const templateVars = { userId, user };
  return res.render("urls_register", templateVars);
});

const getUserByEmail = (email) => {
  for (const user in users) {
    if (users[user].email === email) {
      return true;
    }
  }
  return false;
};

app.post("/register", (req, res) => {
  const { registration } = req.body;
  const userId = generateRandomStr(registration);
  const email = req.body.email.trim();
  const password = req.body.password.trim();
  if (!email || !password) {
    res.status(400).send("Invalid Credentials");
  } else if (getUserByEmail(email)) {
    res.status(400).send("Try again with another email");
  } else {
    users[`${userId}`] = { id: `${userId}`, email, password};
    res.cookie("userId", userId);
    res.redirect("/urls");
  }
});

app.get("/login", (req, res) => {
  const userId = req.cookies.userId;
  const user = users[userId];
  const templateVars = {userId, user};
  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {
  const { userId } = req.body;
  res
    .cookie("userId", userId)
    .redirect("/urls");
});

app.post("/logout", (req, res) => {
  res
    .clearCookie("userId")
    .redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
