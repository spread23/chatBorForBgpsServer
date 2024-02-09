const {Server} = require('socket.io');
const {v4:uuid} = require('uuid');
const {getOpenAi} = require('../src/ai');

let sessions = {};
let results = `Eres una inteligencia artificial creada por 
Cuba y Colombia OTT, tu nombre es chatbotForBgps,
limitate a contestar solo preguntas relacionadas 
con recursos humanos, contesta de manera siempre formal,
tu respuesta debe tener el formato Markdown`;

const getResults = (req, res) => {

    results = `Eres un mentor de recursos humanos, creado por 
                   Cuba y Colombia OTT, tu nombre es chatbotForBgps,
                   limitate a contestar solo preguntas relacionadas 
                   con recursos humanos, contesta de manera siempre formal,
                   tu respuesta debe tener el formato Markdown`;

    const params = req.body;

    if (Object.entries(params).length >= 1) {
        results = `Eres un mentor de recursos humanos, creado por 
        Cuba y Colombia OTT, tu nombre es chatbotForBgps,
        limitate a contestar solo preguntas relacionadas 
        con recursos humanos, contesta de manera siempre formal,
        tu respuesta debe tener el formato Markdown, y vas a responder 
        preguntas sobre la persona ${params.name} con valores en el DISC 
        D= ${params.D}% I= ${params.I}% S=${params.S}% C= ${params.C}%,
        en el test de BGPS tambien obtuvo Accion= ${params.accion}% Entusiasmo= ${params.entusiasmo}%
        Colaboracion= ${params.colaboracion}% Apoyo= ${params.apoyo}% Equilibrio= ${params.equilibrio}%
        Precision= ${params.precision}% Desafio= ${params.desafio}% Resultados= ${params.resultados}% `;
    }

    return res.status(200).json({
        status: 'success',
        message: 'getting data',
        params,
    });
}

const registerSocketServer = (server) => {
    const io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        }
    });
    io.on('connection', (socket) => {
        console.log(`Socket connected with ${socket.id}`);

        socket.on('session-history', (data) => {
            sessionHistoryHandler(socket, data);
        });

        socket.on('conversation-message', (data) => {
            conversationMessageHandler(socket, data);
        });

        socket.on('conversation-delete', (data) => {
            conversationDeleteHandler(socket, data);
        });
    });
}

const sessionHistoryHandler = (socket, data) => {
    const {sessionId} = data;

    if(sessions[sessionId]){
        socket.emit('session-details', {
            sessionId,
            conversations: sessions[sessionId],
        })
    }else{
        const newSessionId = uuid();

        sessions[newSessionId] = [];

        const sessionDetails = {
            sessionId: newSessionId,
            conversations: [],
        };

        socket.emit('session-details', sessionDetails);
    }
};

const conversationMessageHandler = async (socket, data) => {
    const {sessionId, message, conversationId} = data;

    const openai = getOpenAi();

    const previousConversationMessages = [];

    if(sessions[sessionId]){

        const existingConversation = sessions[sessionId].find((c) => c.id === conversationId);

        if(existingConversation) {  
            previousConversationMessages.push(
                ...existingConversation.messages.map((m) => ({
                    content: m.content,
                    role: m.aiMessage ? 'assistant' : 'user',
                })),
            );
        }

        const response = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: [
                {role: 'system', 
                    content: results
                    },
                ...previousConversationMessages,
                {role: 'user', content: message.content}
            ],
        });

        const aiMessageContent = response?.data?.choices[0]?.message?.content;

        const aiMessage = {
            content: aiMessageContent ? aiMessageContent : 'An error ocurred when trying to get message from AI',
            id: uuid(),
            aiMessage: true,
        };

        const conversation = sessions[sessionId].find((c) => c.id === conversationId);

        if(!conversation){
            sessions[sessionId].push({
                id: conversationId,
                messages: [message, aiMessage],
            });
        }

        if(conversation){
            conversation.messages.push(message, aiMessage);
        }

        const updatedConversation = sessions[sessionId].find((c) => c.id === conversationId);

        socket.emit('conversation-details', updatedConversation);
    }
}

const conversationDeleteHandler = (_, data) => {
    const {sessionId} = data;

    if(sessions[sessionId]){
        sessions[sessionId] = [];
    }
};

module.exports = {
    registerSocketServer,
    getResults,
};
