# Kennzahlen-System der Leitstelle Lausitz

System der Leitstelle Lausitz zur Verwaltung und Visualisierung von Kennzahlen. (Gebaut mit NodeJS, HTML, javascript, express, mysql, Chart.js und jspdf.)

## Features

Verschiedene Nutzer haben die Möglichkeit, Kennzahlen einzusehen, einzutragen, beziehungsweise auch neue Kennzahlen anzulegen. Es ist möglich, Nutzern Zugriff auf verschiedene Kennzahlen und Leitstellen zuzuweisen. Ein Admin hat die Möglichkeit Serverstatistiken einzusehen, sowie Nutzer und Kennzahlen zu erstellen und zu verwalten. (Das über die Website erreichbare Hilfe-Menü gibt genauere Auskunft zu allen Funktionen.)

## Installation und Start einer eigenen Instanz des Servers

Zur Ausführung des Servers wird eine aktuelle Installation von NodeJS, MySQL und npm benötigt. Die Datenbanken müssen zur Ausführung ein entsprechendes Format einhalten. Dieses ist weiter unten dargestellt und erklärt. 

Zur Installation muss zuerst das repository gecloned werden. Nach Navigation in das Verzeichnis müssen die benötigten npm-packages installiert werden. Danach lässt sich die Anwendung mit Hilfe von Node starten.

```sh
git clone https://github.com/franzkroll/kennzahlen.git
cd kennzahlen
npm install
node server.js
```

Ebenso ist eine lokale Installation von MySQL erforderlich. Die Zugangsdaten zu dieser müssen in der Konfigurationsdatei [/.env](/.env) angepasst werden. Soll der Server andere Namen für die Datenbanken verwenden, müssen diese ebenfalls angepasst werden. Ebenso wird die Verwendung von anderen Passwörtern empfohlen. Weiterhin können in der Konfigurationsdatei IP und Port des Servers angepasst werden. Die Benutzerdatenbank muss zur Anmeldung wenigstens einen Benutzer enthalten. Weitere Hilfsdateien zur Speicherung von Kennzahleninformationen werden automatisch erstellt. (Zur leichteren Einrichtung enthält der Ordner [misc_files](misc_files/) eine SQL-Datenbank mit einem Benutzer admin (Passwort: Admin123!), es wird allerdings empfohlen nach dem ersten Einloggen einen neuen Benutzer zu erstellen oder das Passwort zu wechseln.) 

### Datenfelder in Konfigurationsdatei

```c
SERVER_IP='127.0.0.1'
SERVER_PORT=8080

DB_HOST='localhost'
DB_LOGIN_USER='user'
DB_LOGIN_PASSWORD='passwort'
DB_LOGIN_DATABASE='nodelogin'

DB_MEASURE_USER='user'
DB_MEASURE_PASSWORD='passwort'
DB_MEASURE_DATABASE='measures'
```
Die Anwendung ist nun über [localhost:8080](https://localhost:8080/) erreichbar. Beim Starten über node lässt sich ebenso ein anderer Port spezifizieren:

```sh
PORT:4444 node kennzahlen.js
```
(Beispiel mit Port 4444)

Ebenso ist ein Start über eine feste IP-Adresse möglich. Dies ist über die Startoptionen oder über eine Anpassung von SERVER_IP in [.env](/.env) möglich. (Standardmäßig startet der Server über localhost.)

```sh
IP:192.168.2.1 node kennzahlen.js
```
(Beispiel mit IP 192.168.2.1)

Zum Start wird aber die Benutzung von pm2 (https://www.npmjs.com/package/pm2) empfohlen. Diese sorgt für einen automatischen Neustart beim Absturz der App. Installation, Starten, Stoppen bzw. Neustarten erfolgt dann mit folgenden befehlen:

```sh
npm install pm2
pm2 start kennzahlen
pm2 stop kennzahlen
pm2 restart kennzahlen
```

Folgende Befehle geben Statusinformation über die Anwendung:

```sh
pm2 ls
pm2 monit
```

Ein log über alle Ereignisse wird in debug.log erstellt. Dieser wird beim Neustart wieder überschrieben. Möchte man eigene SSL-Zertifikate verwenden, können diese im Ordner [cert](cert/) hinterlegt werden.

## Aufbau der Datenbanken

Zur einfacheren und sicheren Verwaltung sind die Daten der Anwendung in zwei Datenbanken aufgeteilt. Die Datenbank 'accounts' enthält alle registrierten Nutzer des Systems. Die Kennzahlendatenbank enthält die im System erfassten Kennzahlendaten. Möchte man das System lokal verwenden, muss ein erster Benutzer von Hand in der Benutzerdatenbank erstellt werden. Dieser sollte die Rolle 'admin' haben um weitere Benutzer anlegen zu können.

### Benutzerdatenbank

Die Benutzerdatenbank heißt 'nodelogin' und enthält die Tabelle 'accounts' mit allen Benutzern. Es werden Benutzername, Passwort als Hash (erstellt mit bcrypt), E-Mail, sowie die Rolle des Benutzers gespeichert. 'admin' und 'user' sind die zwei Basisrollen. Es können ebenso weitere Rollen erstellt und der Zugriff auf die Kennzahlen für diese Rollen festgelegt werden. Will man mehrere Rollen festlegen, müssen diese durch einen Unterstrich getrennt werden. Ebenso besitzen Benutzer Mandate. Diese signalisieren die Zugehörigkeit zu einer bestimmten Rettungsstelle. Benutzer mit dem Mandat '*' besitzen Zugriff auf alle Mandate. Möchte man mehrere Rollen oder Mandate für einen Benutzer festlegen, sollten diese durch einen Unterstrich getrennt werden.
Passwörter werden gehasht mit bcrypt gespeichert und in der Datenbank hinterlegt. Bei einem Login wird das vom Benutzer eingetragene Passwort gehashed und mit dem gespeicherten Hash verglichen.
Möchte man Benutzer neu erstellen, muss man auf ein sicheres Passwort achten. Es müssen zwischen 8 und 100 Zeichen lang sein, Groß- und Kleinbuchstaben enthalten, sowie mindestens eine Zahl und keine Leerzeichen. Sehr offentsichtliche Passwörter sind ebenfalls gesperrt.

#### Beispiel

| id | username | passwort | email         | role  | mandate |
| -- | -------- | -------- | ------------- | ----- | ------- |
| 1  | admin    | admin    | test@test.com | admin | cottbus |


Standardmäßig hat ein Benutzer mit der Rolle 'admin' Zugriff auf alle Bereiche, 'user' und allen weiteren Rollen fehlt der Zugriff auf den Adminbereich. Ein Benutzer mit der Rolle 'user' darf ebenso Kennzahlen erstellen und bearbeiten. Weitere Rollen können ebenso verwendet werden um den Zugriff auf die verschiedenen Kennzahlen festzulegen. Diese müssen bei der Erstellung der Kennzahl spezifiziert werden. IDs werden automatisch fortlaufend vergeben und müssen nicht bei der Erstellung festgelegt werden.
Benutzer mit dem Mandat '*' haben Zugriff auf alle Mandate.

### Kennzahlendatenbank

Die Kennzahlen werden jeweils in ihrer eigenen Tabelle gespeichert. Die Spalten speichern jeweils die Eigenschaften der Kennzahlen. Die Zeilen stellen verschiedene Zeitabstände dar (standardmäßig ein Monat). Die einzelnen Zellen speichern zugeordnet die Daten pro Zeitabschnitt und Kennzahleigenschaft. Pro Jahr und Kennzahl wird eine neue Tabelle erstellt. Möchten für ein neues Jahr neue Kennzahlendaten eingetragen werden, muss eine neue Tabelle erstellet werde.
Erstellt ein Benutzer neue Kennzahlen, wird eine neue Tabelle in der Datenbank angelegt. Der Ordner [files](files/) enthält Metainformationen der Kennzahlen. Diese dienen zur einfacheren Zuordnung der Kennzahlen zu den Tabllen. Ebenso muss zum Füllen der GUI-Elemente in vielen Fällen nicht auf die Datenbank zugegriffen werden.
Standardmäßig werden die MySQL Tabellen nach den Namen der Kennzahlen benannt.

#### Beispiel

|                  | Eigenschaft 1.1.1 | Eigenschaft 1.1.2 | Eigenschaft 1.1.3 | 
| ---------------- | ----------------- | ----------------- | ----------------- | 
| Januar 2019      | 0                 | 4                 | 5                 | 
| Februar 2019     | 3                 | 1                 | 2                 | 
| März 2019        | 0                 | 4                 | 5                 | 
| April 2019       | 3                 | 1                 | 2                 |  

#### Beispiel für Tabellenname

Kennzahl: 1.1, Anzahl der Alarmierungen, Jahr 2018

Tabellenname in Datenbank: 1$1_Anzahl_der_Alarmierungen_2018

Punkte in der ID werden durch $-Zeichen ersetzt, Leerzeichen durch Unterstriche.

## Benutzung des Web-Interfaces

Nach der Anmeldung wird die Startseite der Anwendung angezeigt. Hier ist es möglich auf die verschiedenen Bereiche des Systems zuzugreifen. Es lassen sich neue Kennzahlen erstellen, bereits erstellte visualisieren, Kennzahlen bearbeiten und Daten zu bestehenden Kennzahlen eintragen. Weiterhin lassen sich ebenso die Beschreibungen der Kennzahlen anzeigen.

Zum Abrufen der Kennzahlen steht jeweils eine Tabelle zur Verfügung,. Ebenso können sie über verschiedene Arten von Graphen angezeigt werden. Zur Eingabe von Kennzahlen muss die Kennzahl und der entsprechende Zeitraum ausgewählt werden - danach ist die Eingabe über die erzeugten Textfelder möglich. Ebenso lassen sich Kennzahlen bearbeiten und ein Report über mehrere Kennzahlen erstellen. Alle Funktionen sind genauer unter Hilfe im Menü der Website erklärt.

Benutzer mit der Rolle 'admin' haben ebenso die Möglichkeit über die Navigationsleiste oben rechts auf den Admin Bereich zuzugreifen. Dort ist eine Anzeige von Statistiken des Servers möglich, sowie die Verwaltung der Benutzer und das Löschen von Kennzahlen.
Neu erstellte Benutzer müssen einen eindeutigen Namen sowie E-Mail Adresse haben. Das Passwort wird automatisch auf gute Sicherheit überprüft.

Schlagen entsprechende Befehle im Server fehl, erhält der Nutzer Rückmeldungen über das Web-Interface. About zeigt Kontaktinformationen.

## Screenshots

Folgende Bilder zeigen beispielhaft einige Ausschnitte der Website.

### Hauptmenü

![](misc_files/screenshots/imgMain.png?raw=true "Hauptmenü")

### Eingabeformular

![](misc_files/screenshots/imgSubmit.png?raw=true "Eingabeformular")

### Erstellungsformular

![](misc_files/screenshots/imgCreate.png?raw=true "Erstellungsformular")

### Visualisierung

![](misc_files/screenshots/imgVisual.png?raw=true "Visualisierung")

### Statusmonitor

![](misc_files/screenshots/imgStatus.png?raw=true "Statusmonitor")

## Bisher noch fehlende Funktionen

* Bei nicht jährlichen Kennzahlen Vergleich über mehrere Jahre
* Täglich erfasste Kennzahlen
* Erstellung von Reports für ein gesamtes Mandat

## Kontakt

https://www.leitstelle-lausitz.de/ |
franz.kroll@b-tu.de

## Lizenz

Sourcecode lizensiert unter MIT (http://opensource.org/licenses/mit-license.php).

## Disclaimer 

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
