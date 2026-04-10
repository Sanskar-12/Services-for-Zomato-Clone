import { getChannel } from "./rabbitmq.js";
export const startOrderReadyConsumer = async () => {
    const channel = getChannel();
    console.log("Starting to consume from: ", process.env.ORDER_READY_QUEUE);
    channel.consume(process.env.ORDER_READY_QUEUE, async (msg) => {
        if (!msg)
            return;
        try {
            console.log("Received Message ", msg?.content.toString());
            const event = JSON.parse(msg?.content.toString());
            console.log("Event type ", event.type);
        }
        catch (error) { }
    });
};
