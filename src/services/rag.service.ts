import axios from "axios";
import https from 'https';

interface RAGData {
    raw_text: string;
    metadata: {
        user_id: string;
        document_id: string;
        page_id: string;
        title: string;
        approved_date: string;
        effective_date: string;
        owner: string;
        username: string;
        access_level: string;
    };
}

const getTokenFromExternalApi = async () => {
    const loginUrl = 'https://test1.nlp-lab.ir/auth/login';
    const username = 'kalate';
    const password = '12';
    const loginData = `grant_type=password&username=${(username)}&password=${(password)}&scope=&client_id=&client_secret=`;
    const loginHeaders = {
        'accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Assistant-Aggregator-Backend/1.0',
    };
    const axiosConfig = {
        timeout: 60000, 
        headers: loginHeaders,
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        maxRedirects: 5,
        validateStatus: (status) => status < 500,
    };
    const loginResp = await axios.post(loginUrl, loginData, axiosConfig);
    return loginResp.data.access_token;
};

export const sendRagDataToExternalApi = async (ragData: RAGData) => {
    const token = await getTokenFromExternalApi();
    const ragUrl = 'https://test1.nlp-lab.ir/ocr/';
    const ragHeaders = {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
    console.log(ragData);
    const ragResp = await axios.post(ragUrl, ragData, { headers: ragHeaders });
    console.log(ragResp.data);
}