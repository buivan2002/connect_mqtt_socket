#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h> // Thêm thư viện để sử dụng StaticJsonDocument

const byte rxPin = 16; // RX2
const byte txPin = 17; // TX2
HardwareSerial dwin(1);

// Cấu hình DHT11
#define DHTPIN 5
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// Cấu hình LM393 
const int LM393_PIN = 4; // Pin đọc tín hiệu từ cảm biến LM393

/* Pin điều khiển thiết bị */
int light = 25;
int fan = 26;
int ac = 27;
int tv = 14;

/* Địa chỉ DWIN */
unsigned char Buffer[9];
#define LM393_ADD       0x61
#define HUMIDITY_ADD    0x62
#define TEMPERATURE_ADD 0x63
#define LIGHT_ADD       0x64
#define FAN_ADD         0x65
#define AC_ADD          0x66
#define TV_ADD          0x67

unsigned char LM393[8] = {0x5a, 0xa5, 0x05, 0x82, LM393_ADD, 0x00, 0x00, 0x00};
unsigned char Humidity[8] = {0x5a, 0xa5, 0x05, 0x82, HUMIDITY_ADD, 0x00, 0x00, 0x00};
unsigned char Temperature[8] = {0x5a, 0xa5, 0x05, 0x82, TEMPERATURE_ADD, 0x00, 0x00, 0x00};
// Khai báo dữ liệu DWIN cho từng thiết bị với kích thước 8 byte
unsigned char DWINlight[8] = {0x5A, 0xA5, 0x05, 0x82, LIGHT_ADD, 0x00, 0x00, 0x00};
unsigned char DWINfan[8] = {0x5A, 0xA5, 0x05, 0x82, FAN_ADD, 0x00, 0x00, 0x00};
unsigned char DWINac[8] = {0x5A, 0xA5, 0x05, 0x82, AC_ADD, 0x00, 0x00, 0x00};
unsigned char DWINtv[8] = {0x5A, 0xA5, 0x05, 0x82, TV_ADD, 0x00, 0x00, 0x00};


// WiFi và MQTT
const char* ssid = "18.c";
const char* password = "123456789@";
const char* mqttServer = "192.168.30.103";  // Địa chỉ MQTT server
const int mqttPort = 1883;  // Cổng MQTT



WiFiClient espClient;
PubSubClient client(espClient);


void setup() {
    Serial.begin(115200);
    dwin.begin(115200, SERIAL_8N1, rxPin, txPin);

    // Khởi động DHT11
    dht.begin();

    // Cấu hình LM393
    pinMode(LM393_PIN, INPUT);

    // Cấu hình relay cho các thiết bị
    pinMode(light, OUTPUT);
    pinMode(fan, OUTPUT);
    pinMode(ac, OUTPUT);
    pinMode(tv, OUTPUT);

    digitalWrite(light, LOW);
    digitalWrite(fan, LOW);
    digitalWrite(ac, LOW);
    digitalWrite(tv, LOW);

    // Kết nối WiFi và MQTT
    startWiFi();
    connectBroker();
}
uint32_t startSend = 0;
unsigned long lastMQTTCheck = 0; // Lần kiểm tra kết nối MQTT gần nhất
const unsigned long mqttInterval = 5000; // Chu kỳ kiểm tra kết nối (ms)

void loop() {
    mqtt_task(); // Xử lý MQTT mà không làm chặn các phần khác
    relay_control();
    client.setCallback(mqttCallback); // Đăng ký callback cho MQTT

    // Thực thi các tác vụ khác
    if (millis() - startSend >= 500) {
        startSend = millis();
        sensor_data();
    }
}

void mqtt_task() {
    // Kiểm tra nếu cần kiểm tra kết nối lại
    if (millis() - lastMQTTCheck >= mqttInterval) {
        lastMQTTCheck = millis();

        if (!client.connected()) {
            connectBroker(); // Kết nối lại nếu bị mất
        }
    }

    client.loop(); // Duy trì hoạt động của MQTT (non-blocking)
}

void connectBroker() {
    client.setServer(mqttServer, mqttPort);

    client.setKeepAlive(60); // Đặt giá trị keep-alive
    
    if (!client.connected()) {
        Serial.print("Attempting MQTT connection...");

        // Kết nối với MQTT Broker
        if (client.connect("ESP32Client")) {
            Serial.println("connected");

            // Đăng ký topic (nếu cần)
          client.subscribe("control/device");
        } else {
            Serial.print("failed, rc=");
            Serial.print(client.state());
            Serial.println(" retrying in next interval");
        }
    }
}


void startWiFi() {
    WiFi.begin(ssid, password);
    Serial.print("Connecting to ");
    Serial.print(ssid);
    while (WiFi.status() != WL_CONNECTED) {
        delay(1000);
        Serial.print(".");
    }
    Serial.println("\nConnection established!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
}

void sensor_data() {
    // Đọc dữ liệu từ DHT11
    int t = dht.readTemperature();
    int h = dht.readHumidity();

    // Đọc tín hiệu từ LM393
    int lm393_value = digitalRead(LM393_PIN);

    /* ------ Gửi dữ liệu lên DWIN ------ */
    // Nhiệt độ
    Temperature[6] = highByte(t);
    Temperature[7] = lowByte(t);
    dwin.write(Temperature, 8);

    // Độ ẩm
    Humidity[6] = highByte(h);
    Humidity[7] = lowByte(h);
    dwin.write(Humidity, 8);

    // Tín hiệu LM393
    LM393[6] = highByte(lm393_value);
    LM393[7] = lowByte(lm393_value);
    dwin.write(LM393, 8);

    /* ------ Gửi dữ liệu lên MQTT dưới dạng chuỗi một topic ------ */
    char sensorData[64];  // Tạo chuỗi chứa tất cả các thông số

    // Chuyển các giá trị sang chuỗi và ghép lại với nhau
    snprintf(sensorData, sizeof(sensorData), 
            "{\"temperature\":%d,\"humidity\":%d,\"lm393\":%d}", t, h, lm393_value);
    
    // Gửi chuỗi dữ liệu vào topic home/sensors
    client.publish("home/sensors", sensorData);

    /* ------ Hiển thị dữ liệu trên Serial Monitor ------ */
    Serial.print("Temperature: ");
    Serial.print(t);
    Serial.println(" °C");

    Serial.print("Humidity: ");
    Serial.print(h);
    Serial.println(" %");

    Serial.print("LM393: ");
    Serial.println(lm393_value);
    Serial.println();
}

// Hàm callback MQTT
void mqttCallback(char* topic, byte* payload, unsigned int length) {
    String message;
    for (unsigned int i = 0; i < length; i++) {
        message += (char)payload[i];
    }
    Serial.print("Message arrived [");
    Serial.print(topic);
    Serial.print("]: ");
    Serial.println(message);

    // Xử lý tin nhắn JSON
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, message);
    if (error) {
        Serial.print("MQTT payload parse failed: ");
        Serial.println(error.c_str());
        return;
    }

    const char* device = doc["device"];
    int status = doc["status"];

    // Điều khiển thiết bị theo tín hiệu
    if (strcmp(device, "Light") == 0) {
        digitalWrite(light, status ? HIGH : LOW);
        Serial.println(status ? "Light ON by MQTT" : "Light OFF by MQTT");
        
        // Cập nhật trạng thái và gửi lên DWIN
        DWINlight[6] = highByte(status);  // Cập nhật giá trị trạng thái (ON/OFF)
        DWINlight[7] = lowByte(status);
        dwin.write(DWINlight, 8);         // Gửi tín hiệu lên DWIN
    } else if (strcmp(device, "Fan") == 0) {
        digitalWrite(fan, status ? HIGH : LOW);
        Serial.println(status ? "Fan ON by MQTT" : "Fan OFF by MQTT");
        
        // Cập nhật trạng thái và gửi lên DWIN
        DWINfan[6] = highByte(status); 
        DWINfan[7] = lowByte(status);  
        dwin.write(DWINfan, 8);
    } else if (strcmp(device, "Air Conditioner") == 0) {
        digitalWrite(ac, status ? HIGH : LOW);
        Serial.println(status ? "AC ON by MQTT" : "AC OFF by MQTT");
        
        // Cập nhật trạng thái và gửi lên DWIN
        DWINac[6] = highByte(status);  
        DWINac[7] = lowByte(status);  
        dwin.write(DWINac, 8);
    } else if (strcmp(device, "TV") == 0) {
        digitalWrite(tv, status ? HIGH : LOW);
        Serial.println(status ? "TV ON by MQTT" : "TV OFF by MQTT");
        
        // Cập nhật trạng thái và gửi lên DWIN
        DWINtv[6] = highByte(status);  
        DWINtv[7] = lowByte(status);  
        dwin.write(DWINtv, 8);
    }
}


unsigned long previousMillis = 0;  // Lưu thời gian lần gửi trước
const long interval = 1000;         // Khoảng thời gian gửi, 1 giây

void relay_control() {
    // Kiểm tra nếu có dữ liệu từ dwin
    if (dwin.available()) {
        for (int i = 0; i <= 8; i++) {
            Buffer[i] = dwin.read();
        }       
   
        if (Buffer[0] == 0X5A) { // Kiểm tra ký tự đặc biệt
            switch (Buffer[4]) {
                case LIGHT_ADD:   // Điều khiển đèn
                    digitalWrite(light, Buffer[8] == 1 ? HIGH : LOW);
                    Serial.println(Buffer[8] == 1 ? "Light ON" : "Light OFF");
                    break;

                case FAN_ADD:     // Điều khiển quạt
                    digitalWrite(fan, Buffer[8] == 1 ? HIGH : LOW);
                    Serial.println(Buffer[8] == 1 ? "Fan ON" : "Fan OFF");
                    break;

                case AC_ADD:      // Điều khiển điều hòa
                    digitalWrite(ac, Buffer[8] == 1 ? HIGH : LOW);
                    Serial.println(Buffer[8] == 1 ? "AC ON" : "AC OFF");
                    break;

                case TV_ADD:      // Điều khiển TV
                    digitalWrite(tv, Buffer[8] == 1 ? HIGH : LOW);
                    Serial.println(Buffer[8] == 1 ? "TV ON" : "TV OFF");
                    break;

              
            }
        }
    }

    // Kiểm tra và gửi trạng thái thiết bị mỗi giây
    unsigned long currentMillis = millis();
    if (currentMillis - previousMillis >= interval) {
        previousMillis = currentMillis;  // Cập nhật thời gian gửi

        // Đọc trạng thái của tất cả các thiết bị
        int lightState = digitalRead(light) == HIGH ? 1 : 0;
        int fanState = digitalRead(fan) == HIGH ? 1 : 0;
        int acState = digitalRead(ac) == HIGH ? 1 : 0;
        int tvState = digitalRead(tv) == HIGH ? 1 : 0;

        // Tạo JSON chứa trạng thái của tất cả các thiết bị
        char jsonPayload[128];
        snprintf(jsonPayload, sizeof(jsonPayload),
            "{\"light\":%d,\"fan\":%d,\"ac\":%d,\"tv\":%d}",
            lightState, fanState, acState, tvState);

        // Gửi trạng thái lên MQTT
        client.publish("control/status", jsonPayload);
        Serial.println(jsonPayload);  // In ra để debug
    }
}



