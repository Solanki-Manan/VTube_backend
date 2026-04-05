import {Queue} from "bullmq";
import redis from "./redis.connection.js";

const videoProcessingQueue = new Queue("video-processing", {
    connection: redis
});

export default videoProcessingQueue;
