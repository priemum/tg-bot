const {TelegramClient, Api} = require("telegram");
const {StringSession} = require("telegram/sessions");
const input = require("input");
const {NewMessage} = require("telegram/events"); // npm i input
require('dotenv').config()
const fs = require('fs')
const apiId = +process.env.API_ID;
const apiHash = process.env.API_HASH;
const authorId = BigInt(process.env.AUTHOR_ID)
const commandChatId = BigInt(-process.env.COMMAND_CHAT_ID)
let session
let isLogin
fs.access("session.txt", function (error) {
    if (error) {
        console.log("session file  not found");
        session = new StringSession('');
    } else {
        console.log("session file found");
        const sessionString = fs.readFileSync("session.txt").toString("utf-8")
        session = new StringSession(sessionString)
        isLogin = true
    }
    start().then(() => console.log("You should now be connected."))

})


let client;
async function start() {
    console.log("start...");
    try {
        client = new TelegramClient(session, apiId, apiHash, {
            connectionRetries: 5,
        });

        await client.start({
            phoneNumber: async () => await input.text("Please enter your number: "),
            password: async () => await input.text("Please enter your password: "),
            phoneCode: async () =>
                await input.text("Please enter the code you received: "),
            onError: (err) => console.log(err),
        });
        if (!isLogin) {
            const saveSession = client.session.save()
            fs.writeFileSync("session.txt", saveSession, {encoding: "utf-8"})
        }
        client.addEventHandler(eventPrint, new NewMessage({}));
        client.sendMessage(process.env.AUTHOR, {message: "Отъебаный Джо запущен..."})
    } catch (e) {
        console.error(e)
    }
}




async function eventPrint(event) {
    const message = event.message;
    let instruction


    // Checks if it's a private message (from user or bot)
    if (!event.isPrivate && message.senderId.value === authorId) {
        instruction = new Api.messages.SendReaction({
            msgId: message.id,
            big: true, reaction: "👍", peer: message.chatId
        })
        await client.invoke(instruction)
    }
    if (event.chatId.value === commandChatId) {
        const regexp = /(?<=t.me+\/\+).*/
        const hash = message.message.match(regexp)[0]
        if (hash) {
            instruction = new Api.messages.ImportChatInvite({hash})
            await client.invoke(instruction)
        }

    }
}

