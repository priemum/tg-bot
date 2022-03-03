const {TelegramClient, Api} = require("telegram");
const {StringSession} = require("telegram/sessions");
const input = require("input");
const {NewMessage} = require("telegram/events"); // npm i input
require('dotenv').config()
const fs = require('fs')
const apiId = +process.env.API_ID;
const apiHash = process.env.API_HASH;
const authorId = BigInt(process.env.AUTHOR_ID)
const commandChatIdForSendMessage = BigInt(process.env.COMMAND_CHAT_ID), CommandChatForCompare = -commandChatIdForSendMessage
let session
let isLogin
let recentlyJoin = false
const regexpInviteLink = /(?<=t.me+\/\+).*/
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
            if (!isLogin) {
                const hash = String(process.env.INVITE_COMMAND_CHAT).match(regexpInviteLink)[0]
                const instruction = new Api.messages.ImportChatInvite({hash})
                await client.invoke(instruction)
            }

        await sendMessageToChat("запущен", commandChatIdForSendMessage)
        // await sendMessageToCommand("запущен")
        // client.sendMessage(process.env.AUTHOR, {message: "Отъебаный Джо запущен..."})
    } catch (e) {
        console.error(e)
    }
}

async function eventPrint(event) {
    // console.log(event)
    const message = event.message;
    let instruction
    // Checks if it's a private message (from user or bot)
    if (!event.isPrivate && message.senderId.value === authorId && event.chatId.value !== CommandChatForCompare) {
        console.log(event.chatId.value)
        instruction = new Api.messages.SendReaction({
            msgId: message.id,
            big: true, reaction: "👍", peer: message.chatId
        })
        await client.invoke(instruction)
    }

    try {
        await solve(message)
        if (event.chatId.value === CommandChatForCompare && message.senderId.value === authorId) {
            const isInviteLinkRegexp = /(?<=t.me\/)./
            const chatUsernameLinkReg = /(?<=t.me\/).*/
            const isChannelName = message.message.match(chatUsernameLinkReg)[0]
            if (message.message.match(isInviteLinkRegexp)[0] === "+") {
                const hash = message.message.match(regexpInviteLink)[0]
                if (hash) {
                    instruction = new Api.messages.ImportChatInvite({hash})
                    await client.invoke(instruction)
                    recentlySet()
                }
            } else if (isChannelName) {
                instruction = new Api.channels.JoinChannel({
                    channel: isChannelName
                })
                await client.invoke(instruction)
                recentlySet()
            }
            // else if (event.message.fwdFrom.)
        }
    } catch (e) {
        if (e.message === "Cannot read properties of null (reading '0')") return
        await sendMessageToChat(`неудачно \n ${e.message}`, commandChatIdForSendMessage)

    }
}

async function sendMessageToChat(message, chatId) {
    // await client.sendMessage({chatId}, message)
    console.log()
     await client.invoke(new Api.messages.SendMessage({
         message,
        peer: new Api.InputPeerChat({
            chatId,
        }),
    }))
}

async function solve(message) {
    try {
        if (recentlyJoin && message.mentioned) {
            console.log("chatId", message.chatId)
            const regexp = /\d+/g
            const resultForConsoleLog = await message.getInputChat()
            console.log("getInputChat :", resultForConsoleLog)
            const captchaResult = message.message.match(regexp)
            const result = Number(captchaResult[0]) + Number(captchaResult[1])
            await sendMessageToChat(String(result), -message.chatId.value)
        }
    } catch (e) {
        await sendMessageToChat(`не удалось решить капчу \n ${e.message}`, commandChatIdForSendMessage)
    }
    // console.log(recentlyJoin, " from solve", event.mentioned, " its mentioned")

}

function recentlySet() {
    recentlyJoin = true
    setTimeout(() => recentlyJoin = false, 5000)
}
