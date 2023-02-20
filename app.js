const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");

let db = null;

const DBServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

DBServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const selectQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(selectQuery);
  if (dbUser === undefined) {
    const createQuery = `
      INSERT INTO
      user (username, name, password, gender, location)
      VALUES(
          '${username}',
          '${name}',
          '${hashedPassword}',
          '${gender}',
          '${location}'
          );`;
    const dbResponse = await db.run(createQuery);
    const newUserId = dbResponse.lastID;
    if (password.length < 5) {
      response.send("Password is too short");
    } else {
      response.send("User created successfully");
    }
  } else {
    response.status = 400;
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(selectQuery);
  if (dbUser === undefined) {
    response.status = 400;
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.status = 200;
      response.send("Login success!");
    } else {
      response.send = 400;
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const oldHashedPassword = await bcrypt.hash(request.body.oldPassword, 10);
  const newHashedPassword = await bcrypt.hash(request.body.newPassword, 10);
  const selectQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(selectQuery);
  if (dbUser === undefined) {
    response.status = 400;
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      dbUser.password
    );
    if (isPasswordMatched == true) {
      if (newHashedPassword.length < 5) {
        response.send = 400;
        response.send("Password is too short");
      } else {
        response.status = 200;
        const createUserQuery = `
            UPDATE user
            SET
             username = '${username}', 
             password = '${newHashedPassword}'
        `;
        response.send("Password updated");
      }
    } else {
      response.send = 400;
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
