const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const bodyParser = require("body-parser");
const authConfig = require('./auth_config.json');
const { Pool, Client } = require('pg');
const app = express();

if (!authConfig.domain || !authConfig.audience) {
  throw 'Please make sure that auth_config.json is in place and populated';
}

// Create link to Angular build directory
var distDir = __dirname + "/dist/";
app.use(express.static(distDir));

app.use(morgan('dev'));
app.use(helmet());
// app.use(
//   cors({
//     origin: authConfig.appUri,
//   })
// );
app.use(bodyParser.json());


const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${authConfig.domain}/.well-known/jwks.json`,
  }),

  audience: authConfig.audience,
  issuer: `https://${authConfig.domain}/`,
  algorithms: ['RS256'],
});

const connectionString = "postgres://gstlbdljezzjmc:ebcd5e7506c4fd05a6f92b6ab968969ee791fb6f7cbdffaba1ae3147d793b196@ec2-34-204-22-76.compute-1.amazonaws.com:5432/d1dehakvatrvou";

app.get('/api/external', checkJwt, (req, res) => {
  console.log(req.user);

  res.send({
    msg: 'Your access token was successfully validated!',
  });
});

app.post("/api/nominations", checkJwt, async (req, res) => {
  console.log(req.body);
  const userId = req.user.sub;
  const { title, yearOfRelease, imdbID } = req.body;
  console.log(userId);

  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  client.connect(err => {
    if (err) {
      console.log(err);
      res.sendStatus(500);
    }
    client.query(
      "INSERT INTO nominations (title, yearOfRelease, imdbID, user_id) VALUES ($1, $2, $3, $4)",
      [title, yearOfRelease, imdbID, userId],
      (error, results) => {
        if (error) {
          console.log(err);
          res.sendStatus(500);
        }

        client.end();
        if (results) {
          res.status(201).json(results.rowCount > 0);
        }
      });
  });

});

app.get("/api/nominations/:userId", (req, res) => {
  if (req.params && req.params.userId) {
    const client = new Client({
      connectionString: connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });
    client.connect(err => {
      if (err) {
        console.log(err);
        res.sendStatus(500);
      }
      client.query('SELECT title, yearOfRelease, imdbID FROM nominations where user_id=$1;', [req.params.userId], (err, dbRes) => {
        if (err) {
          console.log(err);
          res.sendStatus(500);
        } else {
          res.status(200).json(dbRes.rows);
        }
        client.end();
      });
    });
  }
});

app.delete("/api/nominations/:imdbID", checkJwt, (req, res) => {
  const imdbID = req.params.imdbID;
  const userId = req.user.sub;
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  client.connect(err => {

    if (err) {
      console.log(err);
      res.sendStatus(500);
    }

    client.query(
      "DELETE FROM nominations where imdbID = $1 and user_id = $2",
      [imdbID, userId],
      (error, results) => {
        if (error) {
          console.log(err);
          res.sendStatus(500);
        }

        client.end();
        res.status(200).json(results.rowCount > 0);
      });
  });
});


const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Api started on port ${port}`));
