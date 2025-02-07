export * as Telegram from "./telegram";
import {Telegram} from "puregram"
import { Resource } from "sst";
const telegram = Telegram.fromToken(Resource.TELEGRAM_BOT_TOKEN.value)

export const sendMessage = async ({chatId,text}:{chatId: string | number , text: string}) => {
    await telegram.api.sendMessage({
        chat_id: chatId,
        text,

    })
}