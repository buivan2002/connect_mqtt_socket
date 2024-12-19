#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>
#include <WiFi.h>
#include <PubSubClient.h>

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

unsigned char   LM393[8] = {0x5a, 0xa5, 0x05, 0x82, LM393_ADD, 0x00, 0x00, 0x00};
unsigned char Humidity[8] = {0x5a, 0xa5, 0x05, 0x82, HUMIDITY_ADD, 0x00, 0x00, 0x00};
unsigned char Temperature[8] = {0x5a, 0xa5, 0x05, 0x82, TEMPERATURE_ADD, 0x00, 0x00, 0x00};

// WiFi và MQTT
const char* ssid = "18.c";
const char* password = "123456789@";
const char* mqttServer = "broker.hivemq.com";
const int mqttPort = 1883;

WiFiClient espClient;
PubSubClient client(espClient);

unsigned long previousMillis = 0;
const long interval = 5000;

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

void loop() {
    if (!client.connected()) {
        connectBroker();
    }
    client.loop();

    unsigned long currentMillis = millis();
    if (currentMillis - previousMillis >= interval) {
        previousMillis = currentMillis;
        sensor_data();
    }

    relay_control();
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

void connectBroker() {
    client.setServer(mqttServer, mqttPort);
    client.setKeepAlive(60); // Đặt giá trị keepalive là 60 giây

    while (!client.connected()) {
        Serial.print("Connecting to MQTT...");
        if (client.connect("ESP32Client")) {
            Serial.println("\nMQTT connected");
        } else {
            Serial.println("\nMQTT failed with state ");
            Serial.println(client.state());
            delay(2000);
        }
    }
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

    /* ------ Gửi dữ liệu lên MQTT ------ */
    char tempStr[8], humStr[8], lmStr[8];
    snprintf(tempStr, 8, "%d", t);
    snprintf(humStr, 8, "%d", h);
    snprintf(lmStr, 8, "%d", lm393_value);
   
    client.publish("sensor/nhietdo", tempStr);
    client.publish("sensor/doam", humStr);
    client.publish("sensor/lm393", lmStr);

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

void relay_control() {
    if (dwin.available()) {
        for (int i = 0; i <= 8; i++) {
            Buffer[i] = dwin.read();
        }

        if (Buffer[0] == 0X5A) {
            switch (Buffer[4]) {
                case LIGHT_ADD:
                    digitalWrite(light, Buffer[8] == 1 ? HIGH : LOW);
                    Serial.println(Buffer[8] == 1 ? "Light ON" : "Light OFF");
                    break;

                case FAN_ADD:
                    digitalWrite(fan, Buffer[8] == 1 ? HIGH : LOW);
                    Serial.println(Buffer[8] == 1 ? "Fan ON" : "Fan OFF");
                    break;

                case AC_ADD:
                    digitalWrite(ac, Buffer[8] == 1 ? HIGH : LOW);
                    Serial.println(Buffer[8] == 1 ? "AC ON" : "AC OFF");
                    break;

                case TV_ADD:
                    digitalWrite(tv, Buffer[8] == 1 ? HIGH : LOW);
                    Serial.println(Buffer[8] == 1 ? "TV ON" : "TV OFF");
                    break;

                default:
                    Serial.println("No valid command received");
            }
        }
    }
}
