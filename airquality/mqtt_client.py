import paho.mqtt.client as mqtt

class MQTTClient:
    def __init__(self, broker, port, topic, client_id="airquality-client"):
        self.topic = topic
        self.client = mqtt.Client(client_id)
        self.client.connect(broker, port)
    
    def publish(self, message):
        self.client.publish(self.topic, message)