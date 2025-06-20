#!/usr/bin/env python3


from PyP100 import PyP100

# Daten aus Tapo App
TP100_IP = "172.20.10.6"
TAPO_EMAIL = "airqualitythws@gmail.com"
TAPO_PASSWORD = "P20ro25g$"

def main():
    print("🔌 TP100 Controller")
    print("==================")
    
    try:
        p100 = PyP100.P100(TP100_IP, TAPO_EMAIL, TAPO_PASSWORD)
        print(f"✅ Verbunden mit {p100.getDeviceName()}")
    except Exception as e:
        print(f"❌ Verbindung fehlgeschlagen: {e}")
        return
    
    while True:
        print("\nWas möchtest du tun?")
        print("1 = EIN")
        print("2 = AUS") 
        print("3 = STATUS")
        print("q = QUIT")
        
        choice = input("\nEingabe: ").strip().lower()
        
        if choice == '1':
            try:
                p100.turnOn()
                print("💡 Steckdose ist EIN")
            except Exception as e:
                print(f"❌ Einschalten fehlgeschlagen: {e}")
                
        elif choice == '2':
            try:
                p100.turnOff()
                print("🌙 Steckdose ist AUS")
            except Exception as e:
                print(f"❌ Ausschalten fehlgeschlagen: {e}")
                
        elif choice == '3':
            try:
                info = p100.getDeviceInfo()
                state = "EIN" if info.get('device_on', False) else "AUS"
                print(f"📊 Status: {state}")
            except Exception as e:
                print(f"❌ Status abrufen fehlgeschlagen: {e}")
                
        elif choice == 'q':
            print("👋 Bye!")
            break
            
        else:
            print("❓ Ungültige Eingabe")

if __name__ == "__main__":
    main()