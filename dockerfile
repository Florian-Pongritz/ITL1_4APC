FROM node:22

WORKDIR /app

RUN npm install -g @ionic/cli cordova native-run cordova-res

EXPOSE 8200

# Erstellt ein neues Ionic-Projekt falls keines vorhanden ist, dann startet den Dev Server
CMD ["/bin/bash", "-c", "if [ ! -f ionic.config.json ]; then rm -rf ITL1 && ionic start ITL1 tabs --type=angular --no-git && cp -r ITL1/. . && rm -rf ITL1; fi && npm install && ionic serve --host=0.0.0.0 --port=8200"]