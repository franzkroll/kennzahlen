-- MySQL dump 10.13  Distrib 5.7.26, for Linux (x86_64)
--
-- Host: localhost    Database: measures
-- ------------------------------------------------------
-- Server version	5.7.26-0ubuntu0.19.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `measures`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `measures` /*!40100 DEFAULT CHARACTER SET latin1 */;

USE `measures`;

--
-- Table structure for table `1$2_Anzahl_der_Anrufe_2018`
--

DROP TABLE IF EXISTS `1$2_Anzahl_der_Anrufe_2018`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `1$2_Anzahl_der_Anrufe_2018` (
  `Monat` int(11) NOT NULL,
  `Gesamtzahl_aller_Anrufe` float DEFAULT NULL,
  `Gesamtzahl_aller_Notrufe` float DEFAULT NULL,
  `Gesamtzahl_aller_Sprechwünsche_Status_5` float DEFAULT NULL,
  PRIMARY KEY (`Monat`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `1$2_Anzahl_der_Anrufe_2018`
--

LOCK TABLES `1$2_Anzahl_der_Anrufe_2018` WRITE;
/*!40000 ALTER TABLE `1$2_Anzahl_der_Anrufe_2018` DISABLE KEYS */;
INSERT INTO `1$2_Anzahl_der_Anrufe_2018` VALUES (2018,296220,134631,52800),(12018,23137,10738,4569),(22018,22022,10028,4283),(32018,27145,12283,5099),(42018,23757,10847,4764),(52018,25672,11669,5638),(62018,24923,11455,5800),(72018,27316,12220,6639),(82018,28272,12822,6475),(92018,25962,11955,5120),(102018,23107,10148,4413),(112018,21835,9745,0),(122018,23052,10721,0);
/*!40000 ALTER TABLE `1$2_Anzahl_der_Anrufe_2018` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `2$5_Anzahl_der_Alarmierungen_2018`
--

DROP TABLE IF EXISTS `2$5_Anzahl_der_Alarmierungen_2018`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `2$5_Anzahl_der_Alarmierungen_2018` (
  `Monat` int(11) NOT NULL,
  `Gesamtzahl_aller_Alarmierungen` float DEFAULT NULL,
  `Feuerwehr` float DEFAULT NULL,
  `Katastrophenschutz` float DEFAULT NULL,
  `RTW` float DEFAULT NULL,
  `KTW` float DEFAULT NULL,
  `NEF` float DEFAULT NULL,
  `NAW` float DEFAULT NULL,
  `RTH` float DEFAULT NULL,
  `ITH` float DEFAULT NULL,
  `Sonstige` float DEFAULT NULL,
  PRIMARY KEY (`Monat`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `2$5_Anzahl_der_Alarmierungen_2018`
--

LOCK TABLES `2$5_Anzahl_der_Alarmierungen_2018` WRITE;
/*!40000 ALTER TABLE `2$5_Anzahl_der_Alarmierungen_2018` DISABLE KEYS */;
INSERT INTO `2$5_Anzahl_der_Alarmierungen_2018` VALUES (2018,165669,35508,272,89744,3672,27576,0,2144,2894,3860),(12018,13492,2657,6,7386,315,2337,0,111,198,482),(22018,12427,1880,15,7284,316,2242,0,149,237,305),(32018,15107,2530,10,8728,328,2674,0,193,272,372),(42018,12856,2331,45,7290,289,2189,0,214,258,240),(52018,14262,3089,24,7737,308,2308,0,221,284,282),(62018,13842,3451,26,7148,316,2133,0,224,265,279),(72018,15935,5050,39,7413,312,2276,0,218,255,372),(82018,16215,4978,45,7760,352,2182,0,228,272,398);
/*!40000 ALTER TABLE `2$5_Anzahl_der_Alarmierungen_2018` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2019-05-27 16:20:29
