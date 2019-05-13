# Kennzahlen-System der Leitstelle Lausitz

System der Leitstelle Lausitz zur Verwaltung und Visualisierung von Kennzahlen.

## Features

Verschiedene Nutzer haben die Möglichkeit Kennzahlen einzusehen, einzutragen, beziehungsweise auch neue Kennzahlen anzulegen. Es ist möglich Nutzern verschiedene Bereiche zum Zugriff auf verschiedenen Kennzahlen zuzuweisen. Ein Admin hat die Möglichkeit Serverstatistiken einzusehen, sowie Nutzer zu erstellen und zu verwalten.

## Installation einer eigenen Instanz des Servers

Zur Ausführung des Servers wird eine aktuelle Installation von NodeJS, MySQL und npm benötigt. Die Datenbanken müssen zur Ausführung ein entsprechendes Format einhalten. Dieses ist weiter unten dargestellt und erklärt. 

Ebenso ist eine lokale Installation von MySQL erforderlich, die Zugangsdaten zu dieser müssen in /routes/index.js, im Feld 'connectionLogin' anpassen. Soll der Server andere Namen für die Datenbanken verwenden müssen diese ebenfalls angepasst werden.

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

Die Kennzahlen werden jeweils in ihrer eigenen Tabelle gespeichert. Die Zeilen speichern jeweils die Eigenschaften der Kennzahlen. Die Spalten stellen verschiedene Zeitabstände dar (standardmäßig ein Monat). Die einzelnen Zellen speichern zugeordnet die Daten pro Monat und Kennzahl-Eigenschaft. 
Erstellt ein Benutzer neue Kennzahlen werden dynamisch neue Tabellen angelegt.

Beispiel

|                  | Januar 2019   | Februar 2019  | März 2019     | April 2019 |
| ---------------- | ------------- | ------------- | ------------- | ---------- |
| Eigenschaft 1.1  | 0             | 4             | 5             | 4          |
| Eigenschaft 1.2  | 3             | 1             | 2             | 8          |

## Benutzung des Web-Interfaces

Nach der Anmeldung wird die Startseite der Anwendung angezeigt. Hier ist es möglich auf die verschiedenen Bereiche des Systems zuzugreifen. Es lassen sich neue Kennzahlen erstellen, bereits erstellte Visualisieren und Daten zu bestehenden Kennzahlen eintragen.

Benutzer mit der Rolle 'admin' haben ebenso die Möglichkeit über die Navigationsleiste oben rechts auf den Admin Bereich zuzugreifen. Dort ist eine Anzeige von Statistiken des Servers möglich, sowie die Verwaltung der Benutzer.

## Kontakt

https://www.leitstelle-lausitz.de/ |
franz.kroll@b-tu.de

## Lizenz

TODO: Überprüfen ob richtige Lizenzen

Sourcecode lizensiert unter MIT (http://opensource.org/licenses/mit-license.php), Inhalt lizenziert unter CC BY NC SA 4.0 (http://creativecommons.org/licenses/by-nc-sa/4.0/).

## Disclaimer 

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.