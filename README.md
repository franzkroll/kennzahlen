# Kennzahlen-System der Leitstelle Lausitz

System der Leitstelle Lausitz zur Verwaltung und Visualisierung von Kennzahlen.

## Features

Verschiedene Nutzer haben die Möglichkeit Kennzahlen einzusehen, einzutragen, beziehungsweise auch neue Kennzahlen anzulegen. Es ist möglich Nutzern verschiedene Bereiche zum Zugriff auf verschiedenen Kennzahlen zuzuweisen. Ein Admin hat die Möglichkeit Serverstatistiken einzusehen, sowie Nutzer zu erstellen und zu verwalten.

## Installation einer eigenen Instanz des Servers

Zur Ausführung des Servers wird eine aktuelle Installation von NodeJS, MySQL und npm benötigt. Die Datenbanken müssen zur Ausführung ein entsprechendes Format einhalten. Dieses ist weiter unten dargestellt und erklärt.

```sh
git clone https://github.com/franzkroll/kennzahlen.git
cd kennzahlen
npm install
node server.js
```
Zur Installation muss zuerst das repository gecloned werden. Nach Navigation in das Verzeichnis müssen die npm packages installiert werden, danach lässt sich die Anwendung mit Hilfe von Node starten.

Die Anwendung ist nun über [localhost:4000](http://localhost:4000/) erreichbar. (Beim Starten über NodeJS lässt sich ebenso ein anderer Port spezifizieren.)

Ein log über alle Ereignisse wird in debug.log erstellt. Dieser wird beim Neustart wieder überschrieben.


## Aufbau der Datenbanken

Zur einfacheren und sicheren Verwaltung sind die Daten der Anwendung in zwei Datenbanken aufgeteilt. Die Datenbank 'accounts' enthält alle registrierten Nutzer des Systems. Die Kennzahlendatenbank enthält im System erfassten Kennzahlendaten. Möchte man das System lokal verwenden muss ein Benutzer von Hand in der Benutzerdatenbank erstellt werden.

### Benutzerdatenbank

Die Benutzerdatenbank heißt 'nodelogin' und enthält die Tabelle 'accounts' mit allen Benutzern. Es werden Benutzername, Passwort als Hash (erstellt mit bcrypt), E-Mail, sowie die Rolle des Benutzer gespeichert. 'admin' und 'user' sind die zwei Basisrollen. Es können ebenso weitere Rollen erstellt werden und der Zugriff auf die Kennzahlen für diese Rollen festgelegt werden.

| id | username | passwort | email         | role  |
| -- | -------- | -------- | ------------- | ----- |
| 1  | admin    | admin    | test@test.com | admin |


Standardmäßig hat ein Benutzer mit der Rolle 'admin' Zugriff auf alle Bereiche. IDs werden automatisch fortlaufend vergeben und müssen nicht bei der Erstellung festgelegt werden.

### Kennzahlendatenbank

TODO: Beispiel für Kennzahlentabelle einfügen

Die Tabellen für die Kennzahlen werden jeweils unter dem Namen des Themas abgespeichert. Das heißt alle Kennzahlen müssen einem Thema zugeordnet sein. Es ist möglich, dass Themen mit nur einer Kennzahl existieren. Die erste Spalte speichert dabei den Erfassungszeitraum. 

| First Header  | Second Header |
| ------------- | ------------- |
| Content Cell  | Content Cell  |
| Content Cell  | Content Cell  |

## Benutzung des Web-Interfaces

Nach der Anmeldung wird die Startseite der Anwendung angezeigt. Hier ist es möglich auf die verschiedenen Bereiche des Systems zuzugreifen. Benutzer mit der Rolle 'admin' haben ebenso die Möglichkeit über die Navigationsleiste oben rechts auf den Admin Bereich zuzugreifen.

## Kontakt

https://www.leitstelle-lausitz.de/ |
franz.kroll@b-tu.de

## Lizenz

Sourcecode lizensiert unter MIT (http://opensource.org/licenses/mit-license.php), Inhalt lizenziert unter CC BY NC SA 4.0 (http://creativecommons.org/licenses/by-nc-sa/4.0/).

## Disclaimer 

TODO: Legal-Disclaimer einfügen