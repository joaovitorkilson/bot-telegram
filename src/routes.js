import express from 'express'
import axios from 'axios'

// Configurações da API
const AUTH_URL = 'https://oauth.livepix.gg/oauth2/auth'
const GET_TOKEN = 'https://oauth.livepix.gg/oauth2/token'
const PAYMENT_URL = 'https://api.livepix.gg/v2/payments'
const CLIENT_ID = process.env.client_id
const CLIENT_SECRET = process.env.client_secret

const app = express();
const PORT = process.env.port || 3000;

app.use(express.json());

// rota que pega o token
export async function getAuthToken() {
  try {
    //configuração dos parametros de autenticação
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials')
    params.append('client_id', CLIENT_ID)
    params.append('client_secret', CLIENT_SECRET)
    params.append('scope', 'offline payments:write payments:read')

    const response = await axios.post(GET_TOKEN, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    })
    return response
  } catch (err) {
    console.log(`Erro ao obter o token: ${err}`)
  }
}

// rota para criar o pagamento com o valor selecionado

export async function createPayment(type, access) {
  let paymentData;
  if (type === 1) {
    paymentData = {
      "amount": 1000,
      "currency": "BRL",
      "redirectUrl": "https://betalux.com.br"
    }
  } else if (type === 2) {
    paymentData = {
      "amount": 1500,
      "currency": "BRL",
      "redirectUrl": "https://betalux.com.br"
    }
  }

  try {
    const response = await axios.post(PAYMENT_URL, paymentData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access.toString()}`,
      }
    })
    return response.data
  } catch (error) {
    console.error('Erro ao criar pagamento:', error.response.data || error.message);
    throw new Error('Não foi possível criar o pagamento');
  }
}

export async function confirmPayment(access) {
  try {
    const response = await axios.get(PAYMENT_URL, {
      headers: {
        'Authorization': `Bearer ${access.toString()}`,
  }
});
return response.data;
} catch (error) {
  console.error('Erro ao confirmar pagamento:', error.response.data || error.message);
}}
