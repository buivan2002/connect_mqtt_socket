const mqtt = require('mqtt');
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const cors = require('cors');

// Kết nối tới HiveMQ broker
const client = mqtt.connect('mqtt://broker.hivemq.com');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIO(server);

// Khi kết nối MQTT thành công
client.on('connect', () => {
    console.log('Connected to HiveMQ broker');
    
    // Đăng ký vào chủ đề (topic)
    client.subscribe('test/topic', (err) => {
        if (!err) {
            console.log('Subscribed to topic: test/topic');
        }
    });
});

// Khi nhận được tin nhắn từ MQTT broker
client.on('message', (topic, message) => {
    const msg = message.toString();
    console.log(`Received message on topic ${topic}: ${msg}`);
    
    // Gửi tin nhắn từ MQTT tới tất cả các client qua Socket.IO
    io.emit('mqtt_message', { topic, message: msg });
});

// Xử lý kết nối từ client React Native qua Socket.IO
io.on('connect', (socket) => {
    console.log(`Client đã kết nối: ${socket.id}`);


    // Xử lý khi client ngắt kết nối
    socket.on('disconnect', () => {
        console.log(`Client đã ngắt kết nối: ${socket.id}`);
    });
});

// Endpoint để kiểm tra server đang chạy
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Khởi động server
server.listen(3000, () => {
    console.log('Server đang lắng nghe ở cổng 3000');
});
