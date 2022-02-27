const {TelegramClient, Api} = require("telegram");
const {StringSession} = require("telegram/sessions");
const input = require("input");
const {NewMessage} = require("telegram/events"); // npm i input
require('dotenv').config()
const apiId = +process.env.API_ID;
const apiHash = process.env.API_HASH;
const stringSession = new StringSession(process.env.SESSION_KEY); // fill this later with the value from session.save()
let client


(async () => {
    console.log("start...");
    client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
    });
    await client.start({
        phoneNumber: async () => await input.text("Please enter your number: "),
        password: async () => await input.text("Please enter your password: "),
        phoneCode: async () =>
            await input.text("Please enter the code you received: "),
        onError: (err) => console.log(err),
    });
    console.log("You should now be connected.");
    // console.log(client.session.save()); // Save this string to avoid logging in again
    await client.sendMessage("mellonges", {message: "Отъебаный Джо запущен..."});



// adds an event handler for new messages
    client.addEventHandler(eventPrint, new NewMessage({}));


})();

async function eventPrint(event) {
    const message = event.message;
    let instruction
    const authorId = BigInt(process.env.AUTHOR_ID)

    // Checks if it's a private message (from user or bot)
    if (!event.isPrivate && message.senderId.value === authorId) {

            console.log(message)
            if (message.peerId.channelId) {
                return
                instruction = new Api.messages.SendReaction({
                    msgId: message.id,
                    big: false, reaction: "👍", peer: new Api.InputPeerChannel({channelId: message.peerId.channelId.value, accessHash: message.peerId.channelId.value })})
            } else if (message.peerId.chatId) {
                    instruction = new Api.messages.SendReaction({
                        msgId: message.id,
                        big: true, reaction: "👍", peer: new Api.InputPeerChat({chatId: message.peerId.chatId.value})

            })} else console.log("no script")


            const result = await client.invoke(instruction)
            // console.log(result)
            // const sender = await message.getSender();
            // console.log("sender is",sender);
    }
}