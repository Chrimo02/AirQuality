import paho.mqtt.client as mqtt
from paho.mqtt.client import Client


class MQTTClient:
    def __init__(self, broker, port, topic):
        self.client = Client()
        self.broker = broker
        self.port = port
        self.topic = topic
        self.client.connect(broker, port)
    
    def publish(self, message):
        self.client.publish(self.topic, message)