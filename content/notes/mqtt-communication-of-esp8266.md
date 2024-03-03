---
date: 2023-08-28T14:07
update: 2024-03-03T13:27
tags:
  - note/2023/08
  - note/arduino
id: note20230828140740
dg-publish: true
maturity: tree
title: Wechat mini-program control the ESP8266 robot via MQTT communication
description: Control ESP8266-developed robot by wechat mini program via mqtt
---
# Overview
Over the course of approximately a month, I have crafted a quadruped robot driven by an `ESP8266` module. The robot's movements control and on-screen displays drawing are primarily from other open-source programs. However, these programs frequently rely on the `ESP8266` itself to establish web services for control, posing challenges for users with limited technical backgrounds. To address this issue, I have made a WeChat mini-program that introduce `MQTT` communication protocols to control the robot, significantly enhancing user accessibility.

# Communication Route
![invert](https://cdn.freezing.cool/images/202403031327416.svg)

# Features
The core of this robot project is developed around the `ESP8266 (NodeMCU)` module, utilizing the `PCA9685 `servo expansion board to control eight `SG90` servos through the `PWM` library.

Power is supplied by two parallel `18650` lithium-ion batteries, with the voltage boosted from 3.7V to approximately 4.8V using a step-up transformer board before being connected to the servo expansion board.

The display features an`I2C` protocol 64x128 OLED screen (`SSD1306`), managed for screen output control through the `U8G2` library.

For movement control functions, the `ESP8266` integrates with the network using the `WiFiMulti` library, establishing `MQTT` communication through the `PubSubClient` library.

Using `MQTX` allows for the convenient establishment of `MQTT` services on a server. `Nginx` is employed to act as a reverse proxy for `MQTT` services, with added `SSL` support. To enable the formal release of the mini-program to access the `MQTT` server, domain registration is required, along with the inclusion of the domain in the list of approved domains.

The mini-program facilitates `MQTT` support through the straightforward inclusion of the `mqtt.min.js` file.

# Arduino codes

```ino
#include <ESP8266WiFiMulti.h>
#include <ESP8266httpUpdate.h>
#include <U8g2lib.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Adafruit_PWMServoDriver.h>

// ### The serial data line (SDA) and serial clock line (SCL) for the I2C connection are linked to specific pins on the ESP8266. For the exact numerical values corresponding to the pin connections, please refer to the ESP8266 pinout diagram.
#define SCL 2
#define SDA 0
U8G2_SSD1306_128X64_NONAME_F_SW_I2C u8g2(U8G2_R0, /*clock=*/SCL, /*data=*/SDA, /*reset=*/U8X8_PIN_NONE);

Adafruit_PWMServoDriver pwm = Adafruit_PWMServoDriver();
ESP8266WiFiMulti WiFiMulti;

//Initialization of the JSON data transmission.
const size_t capacity = JSON_OBJECT_SIZE(2) + 30;
DynamicJsonDocument mydata(capacity);
char jsondata[capacity];

// ### MQTT Broker
const char *mqtt_broker = ""; //Server address
const char *topic = ""; //Subscription of commands passed from the mini-program to the local device.
const char *t_topic = ""; //Subscription of commands passed from the local device to the mini-program.
const char *mqtt_username = ""; //mqtt user name
const char *mqtt_password = ""; //mqtt password
const int mqtt_port = 1883; //mqtt service port
WiFiClient espClient;
PubSubClient client(espClient);

// ### bemfa OTA
//I use bemfa Cloud for OTA service
String upUrl = "";

//Configure of oled screen
int c_x = -15;
int c_y = 20;
int r_x = 128;
int r_y = 40;

// ### The data arrays of pictures used for emotion
// ### You should convert pictures format from png/jpg... into arrays for use
PROGMEM const uint8_t normale[] { DATA_SET_HERE };
PROGMEM const uint8_t goe[] { DATA_SET_HERE };
PROGMEM const uint8_t sleepe[] { DATA_SET_HERE };
PROGMEM const uint8_t helloe[] { DATA_SET_HERE };
PROGMEM const uint8_t laiyae[] { DATA_SET_HERE };
PROGMEM const uint8_t sajiaoe[] { DATA_SET_HERE };
PROGMEM const uint8_t maimenge[] { DATA_SET_HERE };
PROGMEM const uint8_t sade[] { DATA_SET_HERE };
PROGMEM const uint8_t yaobaie[] { DATA_SET_HERE };

uint8_t command =  0;

//Wireless Configure
void startWiFiConnect(){
  digitalWrite(16, LOW);
  Serial.println();
  Serial.println("Wait for WiFi...");
  while(WiFiMulti.run() != WL_CONNECTED){
    Serial.print(".");
    delay(50);
  }
  Serial.print("Connected to: ");
  Serial.println(WiFi.SSID());
  digitalWrite(16, HIGH);
}

//MQTT Connection
void startMqttConnect(){
  while (!client.connected()){
    String client_id = "Esp8266-client-";
    client_id += String(WiFi.macAddress());
    Serial.printf("%s is waiting for MQTT broker\n", client_id.c_str());
    if(client.connect(client_id.c_str(), mqtt_username, mqtt_password)) {
      Serial.println("MQTT broker connected");
    }
    else{
      Serial.print("failed with state ");
      Serial.println(client.state());
      delay(2000);
    }
  }
  //subscribe and publish
  client.subscribe(topic);
  client.publish(t_topic, jsondata);
}


//Send message while updating
void update_started() {
  mydata["update"] = 1;
  serializeJson(mydata,jsondata);
  client.publish(t_topic, jsondata);
}

//Senf message when updating is failed
void update_error(int err) {
  mydata["update"] = -1;
  serializeJson(mydata,jsondata);
  client.publish(t_topic, jsondata);
  mydata["update"] = 0;
  serializeJson(mydata,jsondata);
}

/**
 * Firmware upgrade.
 */
void updateBin(){
  WiFiClient UpdateClient;
  ESPhttpUpdate.onStart(update_started);
  ESPhttpUpdate.onError(update_error);
  t_httpUpdate_return ret = ESPhttpUpdate.update(UpdateClient, upUrl);
}

void setup() {
  Serial.begin(115200);
  u8g2.setBusClock(9000000);
  u8g2.begin();
  u8g2.enableUTF8Print()

  //Initialization the communication message.
  mydata["status"] = 1;
  mydata["update"] = 0;
  serializeJson(mydata, jsondata);

  // ### Add Wifi info
  WiFiMulti.addAP("", "");

  pinMode(16, OUTPUT);
  pwm.begin();
  pwm.setPWMFreq(60);
  delay(1000);


  zc();
  normal();
  startWiFiConnect();

  //开始MQTT连接
  client.setServer(mqtt_broker, mqtt_port);
  client.setCallback(callback);
  startMqttConnect();
}

//MQTT message callback.
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived: ");
  Serial.println(topic);
  Serial.print("Message:");
  for (int i = 0; i < length; i++) {
      Serial.print((char) payload[i]);
  }
  Serial.println();
  Serial.println("-----------------------");
  DynamicJsonDocument doc(1024);
  deserializeJson(doc, payload);
  JsonObject jsonObj = doc.as<JsonObject>();
  JsonObject params =jsonObj["params"];
  if (params["hello"] == 1){
    client.publish(t_topic, jsondata);
    normal();
    nh();
    hello();
    zc();
  }
  else if (params["normal"] == 1){
    client.publish(t_topic, jsondata);
    normal();
    zc();
  }
  else if (params["maimeng"] == 1){
    client.publish(t_topic, jsondata);
    normal();
    mm();
    middle();
  }
  else if (params["sajiao"] == 1){
    client.publish(t_topic, jsondata);
    sleep();
    gp();
    dog();
    dog();
    dog();
    dog();
    zc();
  }
  else if (params["sad"] == 1){
    client.publish(t_topic, jsondata);
    sleep();
    tx();
    surrender();
  }
  else if (params["laia"] == 1){
    client.publish(t_topic, jsondata);
    normal();
    la();
    come();
    zc();
  }
  else if (params["yaobai"] == 1){
    client.publish(t_topic, jsondata);
    normal();
    yb();
    swing();
    zc();
    normal();
  }
  else if (params["forward"] == 1){
    client.publish(t_topic, jsondata);
    yd();
    normal();
    forward();
    forward();
    forward();
    forward();
    zc();
  }
  else if (params["backward"] == 1){
    client.publish(t_topic, jsondata);
    yd();
    normal();
    backward();
    backward();
    backward();
    backward();
    zc();
  }
  else if (params["left"] == 1){
    client.publish(t_topic, jsondata);
    yd();
    normal();
    left();
    left();
    left();
    zc();
  }
  else if (params["right"] == 1){
    client.publish(t_topic, jsondata);
    yd();
    normal();
    right();
    right();
    right();
    right();
    zc();
  }
  else if (params["shuijiao"] == 1){
    client.publish(t_topic, jsondata);
    sleep();
    sj();
  }
  else if (params["update"] == 1){
    sleep();
    updating();
    updateBin();
  }
}

void loop() {
  //接收mqtt
  client.loop();
  //如果WiFi断开则重连WiFi和MQTT
  if(WiFi.status() != WL_CONNECTED){
    startWiFiConnect();
    startMqttConnect();
  }
}


/*----------Movement functions----------*/

// |   7  |             |   6  |
//  ----- -----   ----- -----
//       |  3   | |  2   |
//        -----   -----
//       |   1  | |  0   |
//  ----- -----   ----- -----
// |  5   |             |  4   |
void sleep() 
{
  pwm.setPWM(4, 0, 340);
  delay(100);
  pwm.setPWM(5, 0, 370);
  delay(100);
  pwm.setPWM(6, 0, 360);
  delay(100);
  pwm.setPWM(7, 0, 410);
  delay(100);
  pwm.setPWM(0, 0, 390);
  delay(100);
  pwm.setPWM(1, 0, 190);
  delay(100);
  pwm.setPWM(2, 0, 185);
  delay(100);
  pwm.setPWM(3, 0, 365);
}

void normal()
{
  pwm.setPWM(0, 0, 280);
  delay(100);
  pwm.setPWM(1, 0, 280);
  delay(100);
  pwm.setPWM(2, 0, 280);
  delay(100);
  pwm.setPWM(3, 0, 270);
  delay(100);
  pwm.setPWM(4, 0, 580);
  delay(100);
  pwm.setPWM(5, 0, 120);
  delay(100);
  pwm.setPWM(6, 0, 595);
  delay(100);
  pwm.setPWM(7, 0, 135);
}

void left()
{
  pwm.setPWM(4, 0, 450);
  pwm.setPWM(7, 0, 260);
  delay(100);
  pwm.setPWM(0, 0, 390);
  pwm.setPWM(3, 0, 365);
  delay(100);
  pwm.setPWM(4, 0, 580);
  pwm.setPWM(7, 0, 135);
  delay(100);
  pwm.setPWM(6, 0, 460);
  pwm.setPWM(5, 0, 280);
  delay(100);
  pwm.setPWM(2, 0, 450);
  pwm.setPWM(1, 0, 460);
  delay(100);
  pwm.setPWM(6, 0, 595);
  pwm.setPWM(5, 0, 120);
  delay(100);
  pwm.setPWM(0, 0, 280);
  pwm.setPWM(1, 0, 280);
  pwm.setPWM(2, 0, 280);
  pwm.setPWM(3, 0, 270);
  delay(100);
}

void right()
{
  pwm.setPWM(5, 0, 280);
  pwm.setPWM(6, 0, 490);
  delay(100);
  pwm.setPWM(1, 0, 190);
  pwm.setPWM(2, 0, 185);
  delay(100);
  pwm.setPWM(5, 0, 120);
  pwm.setPWM(6, 0, 595);
  delay(100);
  pwm.setPWM(7, 0, 260);
  pwm.setPWM(4, 0, 450);
  delay(100);
  pwm.setPWM(3, 0, 210);
  pwm.setPWM(0, 0, 190);
  delay(100);
  pwm.setPWM(7, 0, 135);
  pwm.setPWM(4, 0, 580);
  delay(100);
  pwm.setPWM(0, 0, 280);
  pwm.setPWM(1, 0, 280);
  pwm.setPWM(2, 0, 280);
  pwm.setPWM(3, 0, 270);
  delay(100);
}

void forward()
{
  pwm.setPWM(7, 0, 260);
  pwm.setPWM(4, 0, 450);
  delay(50);
  pwm.setPWM(3, 0, 365);
  pwm.setPWM(0, 0, 120);
  delay(100);
  pwm.setPWM(7, 0, 135);
  pwm.setPWM(4, 0, 580);
  delay(100);
  pwm.setPWM(0, 0, 280);
  pwm.setPWM(3, 0, 270);
  pwm.setPWM(6, 0, 490);
  pwm.setPWM(5, 0, 280);
  delay(50);
  pwm.setPWM(2, 0, 185);
  pwm.setPWM(1, 0, 460);
  delay(100);
  pwm.setPWM(6, 0, 595);
  pwm.setPWM(5, 0, 120);
  delay(100);
  pwm.setPWM(1, 0, 280);
  pwm.setPWM(2, 0, 280);
}

void backward()
{
  pwm.setPWM(5, 0, 280);
  pwm.setPWM(6, 0, 490);
  delay(50);
  pwm.setPWM(1, 0, 190);
  pwm.setPWM(2, 0, 450);
  delay(100);
  pwm.setPWM(5, 0, 120);
  pwm.setPWM(6, 0, 595);
  delay(100);
  pwm.setPWM(1, 0, 280);
  pwm.setPWM(2, 0, 280);
  pwm.setPWM(4, 0, 450);
  pwm.setPWM(7, 0, 260);
  delay(50);
  pwm.setPWM(0, 0, 390);
  pwm.setPWM(3, 0, 140);
  delay(100);
  pwm.setPWM(4, 0, 580);
  pwm.setPWM(7, 0, 135);
  delay(100);
  pwm.setPWM(0, 0, 280);
  pwm.setPWM(3, 0, 270);
}

void hello()
{
  pwm.setPWM(7, 0, 300);
  delay(100);
  pwm.setPWM(0, 0, 390);
  delay(200);
  pwm.setPWM(4, 0, 110);
  delay(300);
  pwm.setPWM(4, 0, 340);
  delay(300);
  pwm.setPWM(4, 0, 110);
  delay(300);
  pwm.setPWM(4, 0, 340);
  delay(300);
  pwm.setPWM(4, 0, 110);
  delay(300);
  pwm.setPWM(4, 0, 340);
  delay(500);
  pwm.setPWM(0, 0, 280);
  pwm.setPWM(4, 0, 580);
  pwm.setPWM(7, 0, 135);
}

void come()
{
  pwm.setPWM(7, 0, 300);
  delay(100);
  pwm.setPWM(0, 0, 120);
  pwm.setPWM(4, 0, 280);
  delay(500);
  pwm.setPWM(4, 0, 110);
  delay(200);
  pwm.setPWM(4, 0, 340);
  delay(400);
  pwm.setPWM(4, 0, 110);
  delay(200);
  pwm.setPWM(4, 0, 340);
  delay(400);
  pwm.setPWM(0, 0, 280);
  pwm.setPWM(4, 0, 580);
  pwm.setPWM(7, 0, 135);
}

void dog()
{
  delay(300);
  pwm.setPWM(0, 0, 120);
  pwm.setPWM(1, 0, 460);
  pwm.setPWM(2, 0, 450);
  pwm.setPWM(3, 0, 140);
  delay(300);
  pwm.setPWM(0, 0, 390);
  pwm.setPWM(1, 0, 190);
  pwm.setPWM(2, 0, 185);
  pwm.setPWM(3, 0, 365);
}

void middle()
{
  pwm.setPWM(7, 0, 300);
  delay(100);
  pwm.setPWM(0, 0, 120);
  delay(100);
  pwm.setPWM(4, 0, 110);
}

void surrender()
{
  delay(100);
  pwm.setPWM(4, 0, 90);
  pwm.setPWM(5, 0, 620);
  pwm.setPWM(6, 0, 110);
  pwm.setPWM(7, 0, 640);
}

void swing()
{
  delay(50);
  pwm.setPWM(4, 0, 450);
  pwm.setPWM(7, 0, 260);
  delay(50);
  pwm.setPWM(0, 0, 390);
  pwm.setPWM(3, 0, 365);
  delay(50);
  pwm.setPWM(4, 0, 580);
  pwm.setPWM(7, 0, 135);
  delay(50);
  pwm.setPWM(5, 0, 280);
  pwm.setPWM(6, 0, 490);
  delay(50);
  pwm.setPWM(1, 0, 190);
  pwm.setPWM(2, 0, 185);
  delay(50);
  pwm.setPWM(5, 0, 120);
  pwm.setPWM(6, 0, 595);
  delay(500);
  pwm.setPWM(4, 0, 450);
  pwm.setPWM(5, 0, 120);
  pwm.setPWM(6, 0, 470);
  pwm.setPWM(7, 0, 135);
  delay(400);
  pwm.setPWM(4, 0, 580);
  pwm.setPWM(5, 0, 270);
  pwm.setPWM(6, 0, 595);
  pwm.setPWM(7, 0, 310);
  delay(400);
  pwm.setPWM(4, 0, 450);
  pwm.setPWM(5, 0, 120);
  pwm.setPWM(6, 0, 470);
  pwm.setPWM(7, 0, 135);
  delay(400);
  pwm.setPWM(4, 0, 580);
  pwm.setPWM(5, 0, 270);
  pwm.setPWM(6, 0, 595);
  pwm.setPWM(7, 0, 310);
  delay(400);
  pwm.setPWM(4, 0, 450);
  pwm.setPWM(5, 0, 120);
  pwm.setPWM(6, 0, 470);
  pwm.setPWM(7, 0, 135);
  delay(400);
  pwm.setPWM(4, 0, 580);
  pwm.setPWM(5, 0, 270);
  pwm.setPWM(6, 0, 595);
  pwm.setPWM(7, 0, 310);
  delay(400);
  pwm.setPWM(4, 0, 450);
  pwm.setPWM(5, 0, 120);
  pwm.setPWM(6, 0, 470);
  pwm.setPWM(7, 0, 135);
  delay(400);
  pwm.setPWM(4, 0, 580);
  pwm.setPWM(5, 0, 270);
  pwm.setPWM(6, 0, 595);
  pwm.setPWM(7, 0, 310);
  delay(400);
  pwm.setPWM(4, 0, 450);
  pwm.setPWM(5, 0, 120);
  pwm.setPWM(6, 0, 470);
  pwm.setPWM(7, 0, 135);
  delay(400);
  pwm.setPWM(4, 0, 580);
  pwm.setPWM(5, 0, 270);
  pwm.setPWM(6, 0, 595);
  pwm.setPWM(7, 0, 310);
  delay(400);
  pwm.setPWM(4, 0, 450);
  pwm.setPWM(5, 0, 120);
  pwm.setPWM(6, 0, 470);
  pwm.setPWM(7, 0, 135);
  delay(400);
  pwm.setPWM(4, 0, 580);
  pwm.setPWM(5, 0, 270);
  pwm.setPWM(6, 0, 595);
  pwm.setPWM(7, 0, 310);
  delay(400);
}

//u8g2 control the screen
void mm()
{
  u8g2.clearBuffer();
  u8g2.drawXBMP(0, 0, 128, 64, maimenge);
  u8g2.sendBuffer();

  delay(20);
}

void zc()
{
  u8g2.clearBuffer();
  u8g2.drawXBMP(0, 0, 128, 64, normale);
  u8g2.sendBuffer();

  delay(20);
}

void sj()
{
  u8g2.clearBuffer();
  u8g2.drawXBMP(0, 0, 128, 64, sleepe);
  u8g2.sendBuffer();

  delay(20);
}

void nh()
{
  u8g2.clearBuffer();
  u8g2.drawXBMP(0, 0, 128, 64, helloe);
  u8g2.sendBuffer();

  delay(20);
}

void la()
{
  u8g2.clearBuffer();
  u8g2.drawXBMP(0, 0, 128, 64, laiyae);
  u8g2.sendBuffer();

  delay(20);
}

void gp()
{
  u8g2.clearBuffer();
  u8g2.drawXBMP(0, 0, 128, 64, sajiaoe);
  u8g2.sendBuffer();

  delay(20);
}

void tx()
{
  u8g2.clearBuffer();
  u8g2.drawXBMP(0, 0, 128, 64, sade);
  u8g2.sendBuffer();

  delay(20);
}

void yb()
{
  u8g2.clearBuffer();
  u8g2.drawXBMP(0, 0, 128, 64, yaobaie);
  u8g2.sendBuffer();

  delay(20);
}

void yd()
{
  u8g2.clearBuffer();
  u8g2.drawXBMP(0, 0, 128, 64, goe);
  u8g2.sendBuffer();

  delay(20);
}
void updating()
{
  u8g2.clearBuffer();
  u8g2.setFont(u8g2_font_wqy12_t_chinese1);
  u8g2.drawStr(32, 32, "Updating...");
  u8g2.sendBuffer();

  delay(20);
}
```

# Showcase
## Robot

![robot1|300](https://cdn.freezing.cool/images/202308281529331.jpg)

![robot2|300](https://cdn.freezing.cool/images/202308281529333.jpg)

## Wechat Mini Program
![mini program|300](https://cdn.freezing.cool/images/202308281534048.jpg)
