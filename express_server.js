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

const generateRandomStr = () => {
  const alphaNum = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += alphaNum.charAt(Math.floor(Math.random() * alphaNum.length));
  }
  return result;
};

// app.get("/", (req, res) => {
//   res.send("Hello!");
// });

// app.get("/urls.json", (req, res) => {
//   res.send(urlDatabase);
// });

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, username: req.cookies.username };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { username: req.cookies.username};
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  const { longURL } = req.body;
  const id = generateRandomStr();
  urlDatabase[id] = longURL;
  // console.log(urlDatabase);
  res.redirect(`/urls/${id}`);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  const { urlUpdate } = req.body;
  const idToUpdate = req.params.id;
  if (urlDatabase[idToUpdate]) {
    urlDatabase[idToUpdate] = urlUpdate;
  }
  res.redirect(`/urls/${idToUpdate}`);
});

app.post("/login", (req, res) => {
  const { username } = req.body;
  res
    .cookie("username", username)
    .redirect("/urls");
});

app.get("/urls", (req, res) => {
  const templateVars = { username: req.cookies["username"], };
  return res.render("urls_index", templateVars);
});

// app.get("/urls/:id", (req, res) => {
//   res.send(req.params);
// });

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], username:req.cookies.username };
  // console.log(templateVars.longURL);
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World<b></body></html>\n");
// });

// app.get("/set", (req, res) => {
//   const a = 1;
//   res.send(`a = ${a}`);
// });

// app.get("/fetch", (req, res) => {
//   res.send(`a = ${a}`);
// });

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
