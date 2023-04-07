const {urlDatabase} = require("./databases.js");

//HELPER FUNCTIONS
const generateRandomStr = () => {
  const alphaNum = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += alphaNum.charAt(Math.floor(Math.random() * alphaNum.length));
  }
  return result;
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

const getUserByEmail = (email, database) => {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
  return false;
};

module.exports = { getUserByEmail, urlsForUser, getIdFromDB, generateRandomStr };