const config = require('./config');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const pino = require('express-pino-logger')();
const { videoToken } = require('./tokens');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: process.env.SMTP_AUTH_USER,
    pass: process.env.SMTP_AUTH_PASS
  }
});

const app = express();
app.use(express.static(path.join(__dirname, 'client/build')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(pino);

const sendTokenResponse = (token, res) => {
  res.set('Content-Type', 'application/json');
  res.send(
    JSON.stringify({
      token: token.toJwt()
    })
  );
};

app.post('/api/setMeeting', (req, res) => {
  const identity = req.body.firstName + '_' + req.body.lastName;
  const room = req.body.firstName + '_' + req.body.lastName + '_room';
  const token = videoToken(identity, room, config);
  const salesToken = videoToken('sales', room, config);

  const mailData = {
    from: 'sales@hy.ly',
    to: req.body.email,
    subject: 'Video call scheduled',
    html: `
    <link rel="preconnect" href="https://fonts.gstatic.com">
    <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap" rel="stylesheet">
    <h2 style="font-family: 'Roboto', sans-serif;">You are invited to join a video call on ${req.body.dateTime.split('T')[0]} ${req.body.dateTime.split('T')[1].substring(0, 5)}.\nPlease click on <a href="${process.env.REACT_APP_BASE_URL}/meeting/${room}/${token.toJwt()}">here</a> to join.</h2>
    `
  };

  const mailData2Sales = {
    from: 'sales@hy.ly',
    to: process.env.SMTP_AUTH_USER,
    subject: 'Video call scheduled',
    html: `
    <link rel="preconnect" href="https://fonts.gstatic.com">
    <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap" rel="stylesheet">
    <h2 style="font-family: 'Roboto', sans-serif;">You are invited to join a video call on ${req.body.dateTime.split('T')[0]} ${req.body.dateTime.split('T')[1].substring(0, 5)}.\nPlease click on <a href="${process.env.REACT_APP_BASE_URL}/meeting/${room}/${salesToken.toJwt()}">here</a> to join.</h2>
    `
  };

  transporter.sendMail(mailData, (error, info) => {
    if (error) {
      return console.log(error);
    }
    res.status(200).send({
      message: "Mail is sent",
      info
    });
  });

  transporter.sendMail(mailData2Sales, (error, info) => {
    if (error) {
      return console.log(error);
    }
    res.status(200).send({
      message: "Mail is sent",
      info
    });
  });
});

app.post('/api/endMeeting', (req, res) => {
  const roomSid = req.body.roomSid;
  const client = require('twilio')(config.twilio.apiKey, config.twilio.apiSecret, {accountSid: config.twilio.accountSid});
  client.video.rooms(roomSid).update({ status: 'completed' });
  client.video.compositions.create({
    roomSid: roomSid,
    audioSources: '*',
    videoLayout: {
      grid : {
        video_sources: ['*']
      }
    },
    statusCallback: `${process.env.REACT_APP_BASE_URL}/api/composition`,
    // statusCallback: `http://localhost:5000/api/composition`,
    format: 'mp4'
  }).then(composition =>{
    res.status(200).send({
      message: "Created Composition" + composition.links.media
    });
  }).catch(err => {
    res.status(500).send({
      message: err.message
    });
  });
});

app.post('/api/composition', (req, res) => {
  res.send({
    data: req.body
  })
});

app.post('/api/greeting', (req, res) => {
  const name = req.body.name || 'World';
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({ greeting: `Hello ${name}!` }));
})

app.get('/api/greeting', (req, res) => {
  const name = req.query.name || 'World';
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({ greeting: `Hello ${name}!` }));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname + '/client/build/index.html'));
});

app.listen(process.env.PORT || 5000, () =>
  console.log('Express server is running')
);
