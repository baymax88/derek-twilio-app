const config = require('./config');
const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const pino = require('express-pino-logger')();
const { videoToken } = require('./tokens');
const axios = require('axios');

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
let userEmail = '';

const sendRecordingEmail = (url, userEmail) => {
  const mailData = {
    from: 'sales@hy.ly',
    to: userEmail,
    subject: 'Recording of our video call',
    html: `
    <link rel="preconnect" href="https://fonts.gstatic.com">
    <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap" rel="stylesheet">
    <h2 style="font-family: 'Roboto', sans-serif;">Please find linked the recording of our call.\n<a href="${url}">Get recording of our video call</a></h2>
    `
  };

  transporter.sendMail(mailData, (error, info) => {
    if (error) {
      return console.log(error);
    }
  });
}

app.post('/api/setMeeting', (req, res) => {
  const identity = req.body.firstName + '_' + req.body.lastName;
  const room = req.body.firstName + '_' + req.body.lastName + '_room';
  userEmail = req.body.email;
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
  userEmail = req.body.userEmail;
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
    statusCallback: `${process.env.REACT_APP_BASE_URL}/api/getMeeting`,
    // statusCallback: `http://localhost:5000/api/getMeeting`,
    statusCallbackMethod: 'POST',
    format: 'mp4'
  }).then(() => {
    // sendRecordingEmail(composition.sid, userEmail);
    res.status(200).send();
  }).catch(err => {
    res.status(500).send({
      message: err.message
    });
  });
});

app.post('/api/getMeeting', (req, res) => {
  if (req.query.StatusCallbackEvent === 'composition-available') {
    const client = require('twilio')(config.twilio.apiKey, config.twilio.apiSecret, {accountSid: config.twilio.accountSid});
    const compositionSid = req.query.CompositionSid;
    const uri = "https://video.twilio.com/v1/Compositions/" + compositionSid + "/Media?Ttl=3600";

    client.request({
      method: "GET",
      uri: uri,
    }).then((response) => {
      // For example, download the media to a local file
      const requestUrl = request(response.data.redirect_to);
      sendRecordingEmail(requestUrl, userEmail);
      res.send("success");

    }).catch((error) => {
      res.send("Error fetching /Media resource " + error);
    });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname + '/client/build/index.html'));
});

app.listen(process.env.PORT || 5000, () =>
  console.log('Express server is running')
);
