import { io } from 'socket.io-client'; // Import socket.io-client

const SOCKET_URL = 'http://192.168.30.103:3000'; // Địa chỉ URL của server Socket.IO

class WSService {
    constructor() {
        this.socket = null; // Khởi tạo socket
        this.emitCount = 0; // Biến để đếm số lần gửi thông tin tới server
    }

    initializeSocket = async () => {
        try {
            // Khởi tạo kết nối với Socket.IO
            this.socket = io(SOCKET_URL, {
                transports: ['websocket'], // Chỉ sử dụng websocket
                perMessageDeflate: {
                    threshold: 1024, // Chỉ nén khi dữ liệu lớn hơn 1 KB
                },
                timeout: 10000, // Thời gian chờ kết nối
                reconnectionAttempts: 5, // Số lần thử kết nối lại
                reconnectionDelay: 1000, // Thời gian trễ giữa các lần thử kết nối lại
            });

            // Lắng nghe sự kiện kết nối
            this.socket.on('connect', () => {
                console.log("=== socket connected ====");
            });

            // Lắng nghe sự kiện ngắt kết nối
            this.socket.on('disconnect', (reason) => {
                console.log("=== socket disconnected ====", reason);
            });

            // Lắng nghe sự kiện lỗi
            this.socket.on('error', (data) => {
                console.log("socket error", data);
            });

        } catch (error) {
            console.error("Socket is not initialized", error);
        }
    }

    emit(event, data = {}) {
        if (this.socket) { // Kiểm tra xem socket đã được khởi tạo chưa
            this.socket.emit(event, data);
            this.emitCount++; // Tăng số lần gửi thông tin tới server
            console.log(`Emit count: ${this.emitCount}`); // Ghi log số lần gửi
        } else {
            console.error("Socket is not initialized. Unable to emit event.");
        }
    }
    
    on(event, cb) {
        if (this.socket) { // Kiểm tra xem socket đã được khởi tạo chưa
            this.socket.on(event, cb);
        } else {
            console.error("Socket is not initialized. Unable to listen to event.");
        }
    }

    removeListener(listenerName) {
        if (this.socket) { // Kiểm tra xem socket đã được khởi tạo chưa
            this.socket.removeListener(listenerName);
        } else {
            console.error("Socket is not initialized. Unable to remove listener.");
        }
    }
}

const socketService = new WSService(); // Khởi tạo instance của WSService

// Xuất dịch vụ socket
export default socketService;
