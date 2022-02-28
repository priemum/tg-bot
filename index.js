const {TelegramClient, Api} = require("telegram");
const {StringSession} = require("telegram/sessions");
const input = require("input");
const {NewMessage} = require("telegram/events"); // npm i input
require('dotenv').config()
const fs = require('fs')
const path = require("path");
const apiId = +process.env.API_ID;
const apiHash = process.env.API_HASH;





// const stringSession = new StringSession(process.env.SESSION_KEY); // fill this later with the value from session.save()
let client;

(async () => {
    console.log("start...");

    await login()
    console.log("You should now be connected.");



    client.addEventHandler(eventPrint, new NewMessage({}));


})();

async function eventPrint(event) {
    const message = event.message;
    let instruction
    const authorId = BigInt(process.env.AUTHOR_ID)

    // Checks if it's a private message (from user or bot)
    if (!event.isPrivate && message.senderId.value === authorId) {

            console.log(message)
                    instruction = new Api.messages.SendReaction({
                        msgId: message.id,
                        big: true, reaction: "👍", peer: message.chatId

            })
        await client.invoke(instruction)
    }


}


async function login() {
    try {
        // const isFile = path.existsSync("session.txt")
        fs.stat("session.txt", (isFile) => {
            console.log(isFile)
            return
        })

            if (1) {
                const stringSession = fs.readFileSync("session.txt").toString("utf-8")
                client = new TelegramClient(stringSession, apiId, apiHash, {
                    connectionRetries: 5,
                });
            } else {
                const newStringSession = new StringSession("");
                client = new TelegramClient(newStringSession, apiId, apiHash, {
                    connectionRetries: 5,
                });
                console.log("its work?")
                await client.start({
                    phoneNumber: async () => await input.text("Please enter your number: "),
                    password: async () => await input.text("Please enter your password: "),
                    phoneCode: async () =>
                        await input.text("Please enter the code you received: "),
                    onError: (err) => console.log(err),
                });

                const stringSession = client.session.save()

                fs.writeFileSync("session.txt", stringSession, {encoding: "utf-8"})

            }
            await client.sendMessage("mellonges", {message: "Отъебаный Джо запущен..."});

    } catch (e) {

        console.error(e)
    }

}