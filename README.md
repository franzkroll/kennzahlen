# Kennzahlen-System der Leitstelle Lausitz

System der Leitstelle Lausitz zur Verwaltung und Visualisierung von Kennzahlen.

## Features

Verschiedene Nutzer haben die Möglichkeit Kennzahlen einzusehen, einzutragen, beziehungsweise auch neue Kennzahlen anzulegen.

## Installation einer eigenen Instanz des Servers

Zur Ausführung des Servers wird eine aktuelle Installation von NodeJS, MySQL und npm benötigt. Die Datenbanken müssen zur Ausführung ein entsprechendes Format einhalten. Dieses ist weiter unten dargestellt und erklärt.

```sh
git clone https://github.com/franzkroll/kennzahlen.git
cd kennzahlen
npm install
node server.js
```

Die Anwendung ist nun über [localhost:4000](http://localhost:4000/) erreichbar. (Beim Starten über NodeJS lässt sich ebenso ein anderer Port spezifizieren.)

Ein log über alle Ereignisse wird in debug.log erstellt.


## Aufbau der Datenbanken

### Benutzerdatenbank

+----+----------+----------+----------------------+-------+
| id | username | password | email                | role  |
+----+----------+----------+----------------------+-------+
|  1 | test     | test     | test@test.com        | user  |
+----+----------+----------+----------------------+-------+

Every user has an id, username, password, email and a role. Current roles are user and admin. The E-Mail has to be a working and correct e-mail address.

### Kennzahlendatenbank

## Benutzung des Web-Interfaces

## Kontakt

franz.kroll@b-tu.de

## Lizenz