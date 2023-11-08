const {Configuration, OpenAIApi} = require('openai');
require('dotenv').config();

let openai;

const connectWithOpenAIApi = () => {
    const  configuration = new Configuration({
        organization: process.env.OPEN_AI_ORG,
        apiKey: process.env.OPEN_AI_API_KEY
    });
    
    openai = new OpenAIApi(configuration);
}

const getOpenAi = () => {
    return openai;
}

module.exports = {
    connectWithOpenAIApi,
    getOpenAi,
};