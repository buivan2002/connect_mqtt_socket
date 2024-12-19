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
    
    client.subscribe({
        'sensor/nhietdo': { qos: 0 },
        'sensor/doam': { qos: 0 },
        'sensor/lm393': { qos: 0 }
    }, (err, granted) => {
        if (err) {
            console.error('Failed to subscribe to topics:', err);
        } else {
            console.log('Subscribed to topics:', granted.map(g => g.topic));
        }
    });
    
    
});

client.on('message', (topic, message) => {
    const msg = message.toString();
    
    switch (topic) {
        case 'sensor/nhietdo':
            console.log(`Temperature: ${msg} °C`);
            io.emit('mqtt_message_nhiet', { topic, message: msg });

            break;
        case 'sensor/doam':
            console.log(`Humidity: ${msg} %`);
             io.emit('mqtt_message_doam', { topic, message: msg });

            break;
        case 'sensor/lm393':
            console.log(`LM393 value: ${msg}`);
            io.emit('mqtt_message_as', { topic, message: msg });

            break;
        default:
            console.warn(`Unhandled topic: ${topic}`);
    }
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
