#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// defines pins numbers
const int trigPin = 2;
const int echoPin = 5;

// defines variables
unsigned long duration;
unsigned long distance;

// id устройства
const String id = "0";
// id парковки
const String parking_id = "0";
// Занята ли парковка
int busy = 0;
// Расстояние для занятой парковки
const long busy_distance = 15.0;

// Замените на свой идентификатор и пароль
const char* ssid = "ASUS";
const char* password = "110699As";

// ip приёмника
const String http_ip = "http://3.19.242.4:8080/";

// Номер порта для сервера
WiFiServer server(80);

// HTTP-запрос
String header;

#define SCREEN_WIDTH 128 // OLED display width, in pixels
#define SCREEN_HEIGHT 32 // OLED display height, in pixels

// Declaration for an SSD1306 display connected to I2C (SDA, SCL pins)
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

void setup() {
  Serial.begin(9600); // Starts the serial communication
  pinMode(trigPin, OUTPUT); // Sets the trigPin as an Output
  pinMode(echoPin, INPUT); // Sets the echoPin as an Input

  // Подключаемся к Wi-Fi
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  // Выводим локальный IP-адрес и запускаем сервер
  Serial.println("");
  Serial.println("WiFi connected.");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
  server.begin();

  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) { // Address 0x3D for 128x64
    Serial.println(F("SSD1306 allocation failed"));
    for(;;);
  }
  delay(2000);
}

void loop() {
  // Clears the trigPin
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  // Sets the trigPin on HIGH state for 10 micro seconds
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  // Reads the echoPin, returns the sound wave travel time in microseconds
  duration = pulseIn(echoPin, HIGH);
  // Calculating the distance
  distance = duration * 0.034 / 2;
  if (distance <= busy_distance) {
    busy = 1;
  } else {
    busy = 0;
  }
  String s_distance = String(distance);
  String s_busy = String(busy);
  
  // Display static text
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);
  display.setCursor(0, 10);
  display.println("Distance = " + s_distance);
  display.display(); 
  
  if ((WiFi.status() == WL_CONNECTED)) {
     // создаем объект для работы с HTTP
     HTTPClient http;
     // подключаемся к веб-странице
     http.begin(http_ip);
     http.addHeader("Content-Type", "application/json");
     int httpResponseCode = http.POST("{\"id\": " + id + ", \"parking_id\": " + parking_id + ", \"distance\": " + s_distance + ", \"busy\": " + s_busy + "}");
   
     if(httpResponseCode == 200){
        String response = http.getString();
        Serial.println(httpResponseCode);
     } else {
        Serial.println(httpResponseCode);
      }
      // освобождаем ресурсы микроконтроллера
      http.end();
    }
    delay(500);
}
