# Kennzahlen-System der Leitstelle Lausitz

System der Leitstelle Lausitz zur Verwaltung und Visualisierung von Kennzahlen.

## Features

Verschiedene Nutzer haben die Möglichkeit Kennzahlen einzusehen, einzutragen, beziehungsweise auch neue Kennzahlen anzulegen. Es ist möglich Nutzern verschiedene Bereiche zum Zugriff auf verschiedenen Kennzahlen zuzuweisen. Ein Admin hat die Möglichkeit Serverstatistiken einzusehen, sowie Nutzer zu erstellen und zu verwalten.

## Installation und Start einer eigenen Instanz des Servers

Zur Ausführung des Servers wird eine aktuelle Installation von NodeJS, MySQL und npm benötigt. Die Datenbanken müssen zur Ausführung ein entsprechendes Format einhalten. Dieses ist weiter unten dargestellt und erklärt. 

Zur Installation muss zuerst das repository gecloned werden. Nach Navigation in das Verzeichnis müssen die npm benötigten packages installiert werden, danach lässt sich die Anwendung mit Hilfe von Node starten.

```sh
git clone https://github.com/franzkroll/kennzahlen.git
cd kennzahlen
npm install
node server.js
```

Ebenso ist eine lokale Installation von MySQL erforderlich, die Zugangsdaten zu dieser müssen in [routes/mysql.js](routes/mysql.js), im Feld 'connectionLogin' angepasst werden. Soll der Server andere Namen für die Datenbanken verwenden müssen diese ebenfalls angepasst werden. Ebenso wird die Verwendung von anderen Passwörtern empfohlen. Die Benutzerdatenbank muss zur Anmeldung wenigstens einen Benutzer enthalten. Weitere Hilfsdateien zur Speicherung von Kennzahlen Informationen werden automatisch erstellt. (Zur leichteren Einrichtung enthält der Ordner files eine SQL-Datenbank mit einem Benutzer admin (Passwort: Admin123!), es wird empfohlen nach dem ersten Einloggen einen neuen Benutzer zu erstellen.)

### Datenfelder die an lokale MySQL-Zugangsdaten angepasst werden müssen:

#### Zugang zu Benutzerdatenbank

```js
const connectionLogin = mysql.createConnection({
    host: 'localhost',
    user: 'dbaccess',
    password: 'passwort',
    database: 'nodelogin'
});
```

#### Zugang zu Kennzahlendatebank

```js
const connectionData = mysql.createConnection({
    host: 'localhost',
    user: 'dbaccessData',
    password: 'passwort ',
    database: 'measures'
});
```
Die Anwendung ist nun über [localhost:8080](https://localhost:8080/) erreichbar. Beim Starten über node lässt sich ebenso ein anderer Port spezifizieren:

```sh
port:4444 node server.js
```
(Beispiel mit Port 4444)

Ebenso ist ein Start über eine feste IP-Adresse möglich, dies ist wieder über die Startoptionen möglich, oder eine Anpassung der ip-Variable in [kennzahlen.js](routes/kennzahlen.js). (Standardmäßig startet der Server über localhost.)

```sh
ip:192.168.2.1 node server.js
```
(Beispiel mit IP 192.168.2.1)

Zum start wird aber die Benutzung von pm2 (https://www.npmjs.com/package/pm2). Diese sorgt für einen automatischen Neustart bei Absturz der App. Installation, Starten, bzw. stoppen erfolgt dann mit folgenden befehlen:

```sh
npm install pm2
pm2 start kennzahlen
pm2 stop kennzahlen
```

Folgende Befehle geben Statusinformation über die Anwendung:

```sh
pm2 ls
pm2 monit
```

Ein log über alle Ereignisse wird in debug.log erstellt. Dieser wird beim Neustart wieder überschrieben.


## Aufbau der Datenbanken

Zur einfacheren und sicheren Verwaltung sind die Daten der Anwendung in zwei Datenbanken aufgeteilt. Die Datenbank 'accounts' enthält alle registrierten Nutzer des Systems. Die Kennzahlendatenbank enthält die im System erfassten Kennzahlendaten. Möchte man das System lokal verwenden, muss ein erster Benutzer von Hand in der Benutzerdatenbank erstellt werden. Dieser sollte die Rolle 'admin' haben um weitere Benutzer anlegen zu können.

### Benutzerdatenbank

Die Benutzerdatenbank heißt 'nodelogin' und enthält die Tabelle 'accounts' mit allen Benutzern. Es werden Benutzername, Passwort als Hash (erstellt mit bcrypt), E-Mail, sowie die Rolle des Benutzer gespeichert. 'admin' und 'user' sind die zwei Basisrollen. Es können ebenso weitere Rollen erstellt werden und der Zugriff auf die Kennzahlen für diese Rollen festgelegt werden. Will man mehrere Rollen festlegen müssen diese durch einen Unterstrich getrennt werden. Passwörter werden gehasht mit bcrypt gespeichert und in der Datenbank hinterlegt. Bei einem Login wird das vom Benutzer eingetragene Passwort gehashed und mit dem gespeicherten Hash verglichen.
Möchten man Benutzer neu erstellen muss man auf ein sicheres Passwort achten. Es mussen zwischen 8 und 100 Zeichen lang sein, Groß- und Kleinbuchstaben enthalten, sowie mindestens eine Zahl und keine Leerzeichen. Sehr offentsichtliche Passwörter sind ebenfalls gesperrt.

#### Beispiel

| id | username | passwort | email         | role  |
| -- | -------- | -------- | ------------- | ----- |
| 1  | admin    | admin    | test@test.com | admin |


Standardmäßig hat ein Benutzer mit der Rolle 'admin' Zugriff auf alle Bereiche, 'user' und allen weiteren Rollen fehlt der Zugriff auf die Verwaltungsbereiche. Ein Benutzer mit der Rolle 'submit' darf nur Daten eintragen und keine neuen Kennzahlen anlegen. Weitere Rollen können ebenso verwendet werden um den Zugriff auf die verschiedenen Kennzahlen festzulegen. Diese müssen dann bei der Erstellung der Kennzahl spezifiziert werden. IDs werden automatisch fortlaufend vergeben und müssen nicht bei der Erstellung festgelegt werden.

### Kennzahlendatenbank

Die Kennzahlen werden jeweils in ihrer eigenen Tabelle gespeichert. Die Spalten speichern jeweils die Eigenschaften der Kennzahlen. Die Zeilen stellen verschiedene Zeitabstände dar (standardmäßig ein Monat). Die einzelnen Zellen speichern zugeordnet die Daten pro Zeitabschnitt und Kennzahl-Eigenschaft. Pro Jahr und Kennzahl wird eine neue Tabelle erstellt. Möchten für ein neues Jahr neue Kennzahlendaten eingetragen werden muss eine neue Tabelle erstellet werde.
Erstellt ein Benutzer neue Kennzahlen wird dynamische eine neue Tabelle angelegt. Werden Kennzahl erstellt werden Metainformationen im Ordner [files](files/), diese dienen zur einfacheren Zuordnung der Kennzahlen zu den Tabllen. Ebenso muss zum Füllen der GUI-Elemente in vielen Fällen nicht auf die Datenbank zugegriffen werden.
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

Punkte werden durch $-Zeichen ersetzt, Leerzeichen durch Unterstriche.

## Benutzung des Web-Interfaces

Nach der Anmeldung wird die Startseite der Anwendung angezeigt. Hier ist es möglich auf die verschiedenen Bereiche des Systems zuzugreifen. Es lassen sich neue Kennzahlen erstellen, bereits erstellte Visualisieren und Daten zu bestehenden Kennzahlen eintragen.

Zum Abrufen der Kennzahlen steht jeweils eine Tabelle zur Verfügung, ebenso können sie über verschiedene Arten von Graphen angezeigt werden. Zur Eingabe von Kennzahlen muss die Kennzahl und der entsprechende Zeitraum ausgewählt werden, danach ist die Eingabe über die erzeugten Textfelder möglich. Ebenso lassen sich Kennzahlen bearbeiten und ein Report über mehrere Kennzahlen erstellen. Alle Funktionen sind genauer unter Hilfe im Menü der Website erklärt.

Benutzer mit der Rolle 'admin' haben ebenso die Möglichkeit über die Navigationsleiste oben rechts auf den Admin Bereich zuzugreifen. Dort ist eine Anzeige von Statistiken des Servers möglich, sowie die Verwaltung der Benutzer und das Löschen von Kennzahlen.
Neu erstellte Benutzer müssen einen eindeutigen Namen sowie E-Mail Adresse haben. Das Passwort wird automatisch auf gute Sicherheit überprüft.

Schlagen entsprechende Befehle im Server fehl erhält der Nutzer Rückmeldungen über das Web-Interface. About zeigt Kontaktinformationen.

## Bisher noch fehlende Funktionen

* TODO: Update bei Projektende
* Bei nicht jährlichen Kennzahlen Vergleich über mehrere Jahre
* Täglich erfasste Kennzahlen
* Auswahlliste für Mandate/Rollen

## Kontakt

https://www.leitstelle-lausitz.de/ |
franz.kroll@b-tu.de

## Lizenz

TODO: Überprüfen ob richtige Lizenzen
  
Sourcecode lizensiert unter MIT (http://opensource.org/licenses/mit-license.php), Inhalt lizenziert unter CC BY NC SA 4.0 (http://creativecommons.org/licenses/by-nc-sa/4.0/).

## Disclaimer 

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
