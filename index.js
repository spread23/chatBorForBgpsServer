//DB connection

const express = require('express');
const cors = require('cors');
const http = require('http');

const socketServer = require('./src/socketServer');

const { connectWithOpenAIApi } = require('./src/ai');

connectWithOpenAIApi();

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app); 
socketServer.registerSocketServer(server);

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cors());

app.get('/', (req, res) => {
    return  res.status(200).json({
        status: 'success',
        message: 'Probando endpoints',
    });
});

server.listen(PORT, () => {
    console.log('El servidor esta escuchando en el puerto ', PORT);
});