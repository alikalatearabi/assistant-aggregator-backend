"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ChatMessagesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatMessagesService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const chat_messages_gateway_1 = require("../gateways/chat-messages.gateway");
const axios_1 = __importDefault(require("axios"));
const nest_winston_1 = require("nest-winston");
const winston_1 = require("winston");
const logger_config_1 = require("../config/logger.config");
const message_service_1 = require("./message.service");
const chat_service_1 = require("./chat.service");
const https_1 = __importDefault(require("https"));
let ChatMessagesService = ChatMessagesService_1 = class ChatMessagesService {
    gateway;
    winstonLogger;
    messageService;
    chatService;
    logger;
    constructor(gateway, winstonLogger, messageService, chatService) {
        this.gateway = gateway;
        this.winstonLogger = winstonLogger;
        this.messageService = messageService;
        this.chatService = chatService;
        this.logger = this.winstonLogger.child({ context: ChatMessagesService_1.name });
    }
    async proxyToExternalApi(req) {
        const loginUrl = 'https://test1.nlp-lab.ir/auth/login';
        const username = 'kalate';
        const password = '12';
        const loginData = `grant_type=password&username=${(username)}&password=${(password)}&scope=&client_id=&client_secret=`;
        const loginHeaders = {
            'accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Assistant-Aggregator-Backend/1.0',
        };
        const requestInterceptor = axios_1.default.interceptors.request.use((config) => {
            logger_config_1.externalApiLogger.debug('=== AXIOS REQUEST INTERCEPTOR ===', {
                method: config.method?.toUpperCase(),
                url: config.url,
                headers: config.headers,
                data: config.data,
                timeout: config.timeout
            });
            return config;
        });
        const axiosConfig = {
            timeout: 60000,
            headers: loginHeaders,
            httpsAgent: new https_1.default.Agent({ rejectUnauthorized: false }),
            maxRedirects: 5,
            validateStatus: (status) => status < 500,
        };
        logger_config_1.externalApiLogger.info('=== EXTERNAL API LOGIN REQUEST ===', {
            url: loginUrl,
            headers: loginHeaders,
            body: loginData,
            timeout: axiosConfig.timeout
        });
        let token;
        let loginAttempts = 0;
        const maxLoginAttempts = 3;
        while (loginAttempts < maxLoginAttempts) {
            try {
                loginAttempts++;
                this.logger.info(`Login attempt ${loginAttempts}/${maxLoginAttempts}`);
                const loginResp = await axios_1.default.post(loginUrl, loginData, axiosConfig);
                token = loginResp.data.access_token;
                logger_config_1.externalApiLogger.info('=== EXTERNAL API LOGIN RESPONSE ===', {
                    status: loginResp.status,
                    statusText: loginResp.statusText,
                    responseHeaders: loginResp.headers,
                    response: loginResp.data,
                    tokenReceived: token ? 'YES' : 'NO'
                });
                break;
            }
            catch (err) {
                this.logger.error(`Login attempt ${loginAttempts} failed: ${err?.message}`);
                if (loginAttempts >= maxLoginAttempts) {
                    logger_config_1.externalApiLogger.error('=== EXTERNAL API LOGIN ERROR ===', {
                        error: err?.message,
                        errorCode: err?.code,
                        status: err?.response?.status,
                        response: err?.response?.data,
                        attempt: loginAttempts
                    });
                    let errorMessage = 'Login failed';
                    let errorCode = 'LOGIN_ERROR';
                    if (err?.code === 'ECONNRESET' || err?.code === 'ECONNREFUSED') {
                        errorMessage = 'Connection to external API failed. Please try again.';
                        errorCode = 'CONNECTION_ERROR';
                    }
                    else if (err?.code === 'ETIMEDOUT' || err?.code === 'ECONNABORTED') {
                        errorMessage = 'External API request timed out. Please try again.';
                        errorCode = 'TIMEOUT_ERROR';
                    }
                    else if (err?.response?.status === 401) {
                        errorMessage = 'Authentication failed with external API';
                        errorCode = 'AUTH_ERROR';
                    }
                    else if (err?.response?.data?.detail) {
                        errorMessage = err.response.data.detail;
                    }
                    return {
                        event: 'error',
                        error: {
                            status: err?.response?.status || 500,
                            code: errorCode,
                            message: errorMessage,
                        },
                        taskId: (0, crypto_1.randomUUID)(),
                    };
                }
                else {
                    const waitTime = Math.pow(2, loginAttempts) * 1000;
                    this.logger.info(`Waiting ${waitTime}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
            }
        }
        if (!token) {
            this.logger.error('Failed to obtain authentication token after all retry attempts');
            return {
                event: 'error',
                error: {
                    status: 500,
                    code: 'AUTH_ERROR',
                    message: 'Failed to authenticate with external API after multiple attempts',
                },
                taskId: (0, crypto_1.randomUUID)(),
            };
        }
        const chatUrl = 'https://test1.nlp-lab.ir/chat/';
        const chatPayload = {
            query: req.query,
            inputs: {
                similarity_threshold: req.inputs?.similarityThreshold ?? '0.10',
                context_count: req.inputs?.contextCount ?? 6,
            },
            think_level: req.think_level,
            conversation_id: req.conversationId || '',
            prior_messages: req.priorMessages || [],
        };
        const chatHeaders = {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Assistant-Aggregator-Backend/1.0',
        };
        const chatAxiosConfig = {
            timeout: 60000,
            headers: chatHeaders,
            maxRedirects: 5,
            validateStatus: (status) => status < 500,
        };
        logger_config_1.externalApiLogger.info('=== EXTERNAL API CHAT REQUEST ===', {
            url: chatUrl,
            headers: chatHeaders,
            payload: chatPayload,
            timeout: chatAxiosConfig.timeout
        });
        try {
            const chatResp = await axios_1.default.post(chatUrl, chatPayload, chatAxiosConfig);
            logger_config_1.externalApiLogger.info('=== EXTERNAL API CHAT RESPONSE ===', {
                status: chatResp.status,
                response: chatResp.data,
                conversationId: chatResp.data?.conversation_id || 'new'
            });
            return chatResp.data;
        }
        catch (err) {
            logger_config_1.externalApiLogger.error('=== EXTERNAL API CHAT ERROR ===', {
                error: err?.message,
                errorCode: err?.code,
                status: err?.response?.status,
                response: err?.response?.data
            });
            let errorMessage = 'Chat API failed';
            let errorCode = 'CHAT_ERROR';
            if (err?.code === 'ECONNRESET' || err?.code === 'ECONNREFUSED') {
                errorMessage = 'Connection to external chat API failed. Please try again.';
                errorCode = 'CONNECTION_ERROR';
            }
            else if (err?.code === 'ETIMEDOUT') {
                errorMessage = 'External chat API request timed out. Please try again.';
                errorCode = 'TIMEOUT_ERROR';
            }
            else if (err?.response?.status === 401) {
                errorMessage = 'Authentication failed with external chat API';
                errorCode = 'AUTH_ERROR';
            }
            else if (err?.response?.data?.detail) {
                errorMessage = err.response.data.detail;
            }
            return {
                event: 'error',
                error: {
                    status: err?.response?.status || 500,
                    code: errorCode,
                    message: errorMessage,
                },
                taskId: (0, crypto_1.randomUUID)(),
            };
        }
        axios_1.default.interceptors.request.eject(requestInterceptor);
    }
    async processBlocking(req) {
        this.logger.info('=== PROCESSING BLOCKING REQUEST ===', {
            query: req.query,
            thinkLevel: req.think_level,
            user: req.user,
            conversationId: req.conversationId || 'new'
        });
        const result = await this.proxyToExternalApi(req);
        this.logger.info('=== BLOCKING REQUEST COMPLETED ===', {
            resultType: result?.event || 'success'
        });
        return result;
    }
    async processStreaming(req) {
        const taskId = (0, crypto_1.randomUUID)();
        this.logger.info('=== PROCESSING STREAMING REQUEST ===', {
            taskId,
            query: req.query,
            thinkLevel: req.think_level,
            user: req.user,
            conversationId: req.conversationId || 'new'
        });
        const result = await this.proxyToExternalApi(req);
        if (result && typeof result === 'object' && 'event' in result && result.event === 'error') {
            const timestamp = new Date().toISOString();
            this.gateway.broadcast({
                event: 'error',
                taskId,
                conversation_id: req.conversationId || 'unknown',
                answer: '',
                history: [],
                metadata: {
                    error: {
                        status: result.error.status,
                        code: result.error.code,
                        message: result.error.message
                    }
                },
                created_at: timestamp,
            });
        }
        else {
            let chatId = req.conversationId || '';
            if (!req.conversationId) {
                try {
                    const userMessage = await this.messageService.createMessage({
                        category: 'user_input',
                        text: req.query,
                        date: new Date().toISOString(),
                        score: 0
                    });
                    const newChat = await this.chatService.createChat({
                        title: req.query.substring(0, 50) + (req.query.length > 50 ? '...' : ''),
                        user: req.user,
                        conversationHistory: [userMessage._id.toString()]
                    });
                    chatId = newChat._id.toString();
                    this.logger.info('=== NEW CHAT CREATED FOR STREAMING ===', {
                        taskId,
                        chatId,
                        userId: req.user
                    });
                }
                catch (error) {
                    this.logger.error('=== FAILED TO CREATE CHAT FOR STREAMING ===', {
                        taskId,
                        error: error?.message
                    });
                }
            }
            const answer = result.answer;
            const chunks = this.chunkText(answer, 20);
            const startTs = new Date().toISOString();
            this.gateway.broadcast({
                event: 'message_start',
                taskId,
                conversation_id: chatId,
                answer: '',
                history: result.history || [],
                metadata: result.metadata || {},
                created_at: startTs,
            });
            for (let i = 0; i < chunks.length; i++) {
                await new Promise(resolve => setTimeout(resolve, 150));
                const chunkTs = new Date().toISOString();
                this.gateway.broadcast({
                    event: 'message_chunk',
                    taskId,
                    conversation_id: chatId,
                    answer: chunks.slice(0, i + 1).join(''),
                    history: result.history || [],
                    metadata: result.metadata || {},
                    created_at: chunkTs,
                });
            }
            const endTs = new Date().toISOString();
            const retrieverResources = result.metadata?.retriever_resources || [];
            try {
                const assistantMessage = await this.messageService.createMessage({
                    category: 'assistant_response',
                    text: result.answer,
                    date: endTs,
                    score: 0,
                    retrieverResources: retrieverResources
                });
                await this.chatService.addMessageToChat(chatId, assistantMessage._id.toString());
                this.logger.info('=== STREAMING ASSISTANT MESSAGE SAVED ===', {
                    taskId,
                    messageId: assistantMessage._id.toString(),
                    conversationId: chatId,
                    retrieverResourcesCount: retrieverResources.length
                });
            }
            catch (saveError) {
                this.logger.error('=== FAILED TO SAVE STREAMING ASSISTANT MESSAGE ===', {
                    taskId,
                    error: saveError?.message,
                    conversationId: req.conversationId || 'new_chat_creation_failed'
                });
            }
            this.gateway.broadcast({
                event: 'message_end',
                taskId,
                conversation_id: chatId,
                answer: result.answer,
                history: result.history || [],
                metadata: result.metadata || {},
                created_at: endTs,
                retrieverResources: retrieverResources,
            });
        }
        this.logger.info('=== STREAMING REQUEST COMPLETED ===', {
            taskId,
            resultType: result?.event || 'success'
        });
        return { taskId };
    }
    chunkText(text, chunkSize) {
        const chunks = [];
        for (let i = 0; i < text.length; i += chunkSize) {
            chunks.push(text.slice(i, i + chunkSize));
        }
        return chunks;
    }
};
exports.ChatMessagesService = ChatMessagesService;
exports.ChatMessagesService = ChatMessagesService = ChatMessagesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => chat_messages_gateway_1.ChatMessagesGateway))),
    __param(1, (0, common_1.Inject)(nest_winston_1.WINSTON_MODULE_PROVIDER)),
    __metadata("design:paramtypes", [chat_messages_gateway_1.ChatMessagesGateway,
        winston_1.Logger,
        message_service_1.MessageService,
        chat_service_1.ChatService])
], ChatMessagesService);
//# sourceMappingURL=chat-messages.service.js.map