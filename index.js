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

const sendTokenResponse = (token, res) => {
  res.set('Content-Type', 'application/json');
  res.send(
    JSON.stringify({
      token: token.toJwt()
    })
  );
};

const download = async (compositionSid, pathName) => {
  const response = await axios.get(`https://video.twilio.com/v1/Compositions/${compositionSid}/Media`, {
    responseType: 'stream',
    auth: {
      username: config.twilio.accountSid,
      password: config.twilio.authToken
    }
  });

  response.data.pipe(fs.createWriteStream(pathName))

  return new Promise((resolve, reject) => {
    response.data.on('end', () => {
      resolve();
    });

    response.data.on('error', err => {
      reject(err);
    })
  })
}

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
  const userEmail = req.body.userEmail;
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
    format: 'mp4'
  }).then(composition =>{
    // send email that includes endpoint link that will return composition video file
    const mailData = {
      from: 'sales@hy.ly',
      to: userEmail,
      subject: 'Recording of our video call',
      html: `
      <link rel="preconnect" href="https://fonts.gstatic.com">
      <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap" rel="stylesheet">
      <h2 style="font-family: 'Roboto', sans-serif;">Please find linked the recording of our call.\n\n<a href="${process.env.REACT_APP_BASE_URL}/api/getMeeting?compositionsid=${composition.sid}">Get recording of our video call</a></h2>
      `
    };
  
    transporter.sendMail(mailData, (error, info) => {
      if (error) {
        return console.log(error);
      }
      res.status(200).send({
        message: "Created Composition :" + composition.links.media,
        info
      });
    });

  }).catch(err => {
    res.status(500).send({
      message: err.message
    });
  });
});

app.get('/api/getMeeting', (req, res) => {
  const compositionSid = req.query.compositionsid;
  const pathName = path.resolve(__dirname, 'files', 'recording.mp4');

  download(compositionSid, pathName).then(() => {
    res.status(200).send({
      message: `${process.env.REACT_APP_BASE_URL}/files/recording.mp4`
    });
  });
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
