const TelegramApi = require('node-telegram-bot-api')
const axios = require('axios')
require('dotenv').config()
const token = process.env.TELEGRAM_BOT_TOKEN
const secretKey = process.env.SECRET_KEY
const bot = new TelegramApi(token, { polling: true })

let tokenForData = {
	key: '',
	timestamp: null,
}

const TOKEN_EXPIRATION_DURATION = 24 * 60 * 60 * 1000

bot.onText(/\/setToken/, (msg) => {
	const chatID = msg.chat.id
	bot.sendMessage(chatID, 'Введите секретный ключ')
	bot.once('text', (secretKeyInput) => {
		tokenForData.key = secretKeyInput.text
		tokenForData.timestamp = new Date()
		bot.sendMessage(chatID, 'Секретный ключ сохранен.')
	})
})

bot.onText(/\/getForms/, async (msg) => {
	const chatID = msg.chat.id
	if (!isTokenValid()) {
		bot.sendMessage(
			chatID,
			'Вы не ввели секретный ключ или срок его действия истек.'
		)
		return
	}

	try {
		const response = await axios.get('http://localhost:3000/api/telegramBot', {
			params: { access_token: tokenForData.key },
		})

		const forms = response.data
		const formattedForms = forms
			.map((form) => `Имя: ${form.name}, Номер: ${form.phone}\n`)
			.join('\n')

		bot.sendMessage(
			chatID,
			`Анкеты:\n\n ${
				formattedForms === '' ? 'Не кто не отправлял заявку ' : formattedForms
			}`
		)
	} catch (error) {
		console.error('Ошибка при получении контактов:', error.message)
		bot.sendMessage(
			chatID,
			'Ошибка при получении контактов. Повторите по позже.'
		)
	}
})

function isTokenValid() {
	if (!tokenForData.key || !tokenForData.timestamp) {
		return false
	}

	const currentTime = new Date()
	const elapsedTime = currentTime - tokenForData.timestamp

	return elapsedTime <= TOKEN_EXPIRATION_DURATION
}
