// server.js
import express from "express";
import fetch from "node-fetch";
import { Server } from "socket.io";
import http from "http";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" } // يسمح لأي رابط بالاتصال
});

// قراءة مفتاح API و Live Chat ID من Environment Variables
const API_KEY = process.env.API_KEY || "YOUR_API_KEY";
const LIVE_CHAT_ID = process.env.LIVE_CHAT_ID || "YOUR_LIVE_CHAT_ID";

// لتخزين آخر رسالة لتجنب التكرار
let lastMessageId = "";

// جلب التعليقات من يوتيوب
async function getMessages() {
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId=${LIVE_CHAT_ID}&part=snippet,authorDetails&key=${API_KEY}`
    );
    const data = await res.json();
    if (!data.items) return [];
    return data.items;
  } catch (err) {
    console.error("Error fetching messages:", err);
    return [];
  }
}

// كل ثانيتين نجلب التعليقات الجديدة
setInterval(async () => {
  const messages = await getMessages();
  messages.forEach(msg => {
    // نتأكد أننا لم نرسل نفس الرسالة مرتين
    if (msg.id !== lastMessageId) {
      io.emit("newMessage", {
        name: msg.authorDetails.displayName,
        avatar: msg.authorDetails.profileImageUrl,
        text: msg.snippet.displayMessage
      });
      lastMessageId = msg.id;
    }
  });
}, 2000);

// WebSocket
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
});

// تشغيل السيرفر على البورت المخصص من Render
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
