load("api_config.js");
load("api_timer.js");
load("api_net.js");
load("api_sys.js");
load("api_mqtt.js");
load("api_bme680.js");

let bmeAddress = 0x77;
let bme = BME680.createI2C(bmeAddress);
let bmeData = BME680Data.create();

let deviceName = Cfg.get("device.id");
let topic = "/devices/" + deviceName + "/events";
let connected = false;

MQTT.setEventHandler(function(conn, ev) {
  if (ev === MQTT.EV_CONNACK) {
    print("CONNECTED");
    connected = true;
  }
  if (ev === MQTT.EV_MQTT_DISCONNECT) {
    print("DISCONNECTED");
    connected = false;
  }
}, null);

Timer.set(10000, Timer.REPEAT, function() {
  if (!connected) {
    print("Waiting for connection...");
    return;
  }

  bme.readAll(bmeData);
  let data = JSON.stringify({
    temperature: bmeData.temp()/100,
    pressure: bmeData.press()/100,
    humidity: bmeData.humid()/1024,
    gas: bmeData.gas(),
    timestamp: Timer.now(),
    uptime: Sys.uptime()
  });

  print(data);

  let request = MQTT.pub(topic, data);
  if (request) {
    print("Submitted");
  } else {
    print("Failed - `${JSON.stringify(request)}`")
  }
}, null);
