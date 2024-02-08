const {Server} = require('socket.io');
const {v4:uuid} = require('uuid');
const {getOpenAi} = require('../src/ai');

let sessions = {};
let results = {};

const getResults = (req, res) => {

    const params = req.body;

    if (Object.entries(params).length <= 0) {
        results = `Eres una inteligencia artificial creada por 
        Cuba y Colombia OTT, tu nombre es chatbotForBgps,
        limitate a contestar solo preguntas relacionadas 
        con recursos humanos, contesta de manera siempre formal,
        tu respuesta debe tener el formato Markdown`
    }else {
        results = `Eres una inteligencia artificial creada por 
        Cuba y Colombia OTT, tu nombre es chatbotForBgps,
        limitate a contestar solo preguntas relacionadas 
        con recursos humanos, contesta de manera siempre formal,
        tu respuesta debe tener el formato Markdown, y vas contestar 
        preguntas en base a estos resultados: `;
    }

    console.log(results);

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
            model: 'ft:gpt-3.5-turbo-0613:ofrece-tu-talento::8ojNu86Z',
            messages: [
                {role: 'system', 
                    content: 
                        `Eres una inteligencia artificial creada por 
                        Cuba y Colombia OTT, tu nombre es chatbotForBgps,
                        limitate a contestar solo preguntas relacionadas 
                        con recursos humanos, contesta de manera siempre formal,
                        tu respuesta debe tener el formato Markdown`
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
