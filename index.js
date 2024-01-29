const TelegramApi = require('node-telegram-bot-api')
const axios = require('axios')
require('dotenv').config()
const token = process.env.TELEGRAM_BOT_TOKEN
const secretKey = process.env.SECRET_KEY
const bot = new TelegramApi(token, { polling: true })

let tokenForData

bot.onText(/\/setToken/, (msg) => {
	const chatID = msg.chat.id
	bot.sendMessage(chatID, 'Введите секретный ключ')
	bot.once('text', (secretKeyInput) => {
		tokenForData = secretKeyInput.text
		bot.sendMessage(chatID, 'Секретный ключ сохранен.')
	})
})
bot.onText(/\/delToken/, (msg) => {
	const chatID = msg.chat.id

	tokenForData = null
	bot.sendMessage(chatID, 'ваш секретный ключ удален.')
})
bot.onText(/\/getForms/, async (msg) => {
	const chatID = msg.chat.id
	if (!tokenForData) {
		bot.sendMessage(chatID, 'Вы не ввели секретный ключ.')
		return
	}

	try {
		const response = await axios.get('http://localhost:3000/api/telegramBot', {
			params: { access_token: tokenForData },
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
