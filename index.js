const {TelegramClient, Api} = require("telegram");
const {StringSession} = require("telegram/sessions");
const input = require("input");
const {NewMessage} = require("telegram/events");
require('dotenv').config()
const fs = require('fs')

const apiId = +process.env.API_ID;
const apiHash = process.env.API_HASH;
const authorId = BigInt(process.env.AUTHOR_ID)
const CommandChatForCompare = -BigInt(process.env.COMMAND_CHAT_ID)

let session
let isLogin
let recentlyJoin = false
const regexpInviteLink = /(?<=t.me+\/\+).*/

const reactions = ["👍", "❤", "🔥"]
const randomInteger = (min, max) => Math.floor(min + Math.random() * (max + 1 - min))
const reactionsArrayBegin = 0, reactionsArrayEnd = reactions.length - 1

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
        await sendMessageToChat("запущен")
    } catch (e) {
        console.error(e)
    }
}
let isSendMessage = true
async function eventPrint(event) {
    const message = event.message;
    const command = message.message.split(" ")
    if (command[0] === "!stop" && isSendMessage) {
        isSendMessage = false
        setTimeout(() => isSendMessage = true, command[1])
        await sendMessageToChat(`лайки отключены на ${command[1]} мс`)
    } else if (!isSendMessage) return;
    let instruction
    // Checks if it's a private message (from user or bot)
    if (!event.isPrivate && message.senderId.value === authorId && event.chatId.value !== CommandChatForCompare) {
        instruction = new Api.messages.SendReaction({
            msgId: message.id,
            big: true, reaction: reactions[randomInteger(reactionsArrayBegin, reactionsArrayEnd)], peer: message.chatId
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
        await sendMessageToChat(`неудачно \n ${e.message}`)
    }
}

async function sendMessageToChat(message, chatId =  -CommandChatForCompare) {
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
            message.click(0);
            const regexp = /\d+/g
            const getChat = await message.getInputChat()
            const captchaResult = message.message.match(regexp)
            const result = Number(captchaResult[0]) + Number(captchaResult[1])
            if (result >= 60) return
            await client.sendMessage(getChat, {message: String(result)});
        }
    } catch (e) {
        // await sendMessageToChat(`не удалось решить капчу \n`)
        console.log("captcha error")
    }
}

function recentlySet() {
    recentlyJoin = true
    setTimeout(() => recentlyJoin = false, 5000)
}
