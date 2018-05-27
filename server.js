const express = require('express')
const http = require('http')
const socketIO = require('socket.io')
const request = require('request');
const bodyParser = require('body-parser')
const app = express()
const server = http.createServer(app)
const port = 4001
const io = socketIO(server)
const path = require('path');
const globalManagedMemory = [];
const APP_SECRET_KEY = "shady+password@06";
const compression = require('compression');

const SIZE_OF_CHANNEL = 10000;
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());
app.use(compression());
app.use(express.static(path.join(__dirname, 'frontend')));

const jwt = require('jsonwebtoken');

app.post('/auth', (req, res) => {
  if(req.body.user == 'bonnie' && req.body.password == '7170') {
    let JWTToken = jwt.sign({
      user: req.body.user
    },
    APP_SECRET_KEY, {
      expiresIn: '4d'
    });
    
    return res.send({
      error: false,
      token: JWTToken
    });
  }
  if(req.body.user == 'clyde' && req.body.password == '7770'){
    let JWTToken = jwt.sign({
      user: req.body.user
    },
    APP_SECRET_KEY, {
      expiresIn: '4d'
    });

    return res.send({
      error: false,
      token: JWTToken
    });
  }
  res.send({
    error: true,
    mssg: 'invalid password'
  })
});

app.post('/verify', (req, res) => {
  if(!req.body.token) return res.send({
    error: true,
    mssg: 'no token provided'
  });
  jwt.verify(req.body.token, APP_SECRET_KEY, function(err, decoded) {
    if(err){ 
      return res.send({
        error: true,
        mssg: 'no token provided'
      })
    } else {
      let JWTToken = jwt.sign({
        user: decoded.user
      },
      APP_SECRET_KEY, {
        expiresIn: '4d'
      });
      return res.send({
        error: false,
        token: JWTToken
      });
    }
  });
})

app.get('*', function(req, res) {
  res.sendFile(path.resolve(__dirname,'frontend/build/index.html'));
});

// This is what the socket.io syntax is like, we will work this later
io.on('connection', socket => {  
  socket.on('connection request', (auth) => {
    let user_request = JSON.parse(auth);
    if(user_request.token) {
      jwt.verify(user_request.token+'', APP_SECRET_KEY, function(err, decoded) {
        socket.authorizedPrivate = true;
        socket.userProfile = decoded.user;
        if(err) return io.to(socket.id).emit('am i connected', JSON.stringify({ error: true}) );
        socket.join('private');
        io.to(socket.id).emit('am i connected', JSON.stringify({ error: false, data: globalManagedMemory}) );
      });
    }
  });

  socket.on('send message', (message) => {
    if(socket.authorizedPrivate = true) {
      if(globalManagedMemory.length >= SIZE_OF_CHANNEL ){
        globalManagedMemory.shift();
        globalManagedMemory.push({ user: socket.userProfile, message: JSON.parse(message).message });
      } else {
        globalManagedMemory.push({ user: socket.userProfile, message: JSON.parse(message).message });
      }
      io.to('private').emit('got message', globalManagedMemory);
    } else {
    }
  });
  
  socket.on('play sound', (message) => {
    if(socket.authorizedPrivate = true) {
      io.to('private').emit('play sound');
    } else {
    }
  });
  
  socket.on('send toast', (userRequest) => {
  
  });

  socket.on('am i connected', () => {
    if(socket.userEmail != undefined) {
      io.to(socket.id).emit('am i connected', JSON.stringify({ error: false}) );
    } else {
      io.to(socket.id).emit('am i connected', JSON.stringify({ error: true, mssg: 'token was probably invalid' }) );
    }
  });

  socket.on('disconnect', () => {
    socket.authorizedPrivate = false;
  })


  socket.on('temp Message', (message) => {
    if(socket.authorizedPrivate = true) {
      message = JSON.parse(message);
      console.log(message);
      io.to('private').emit('temp Message', message);
    } else {
      
    }
  });


  
})

server.listen(process.env.PORT || 4001, () => console.log(`Listening on port ${port}`))