# 🐉 DnD Academy – Web App per Imparare Dungeons & Dragons

**DnD Academy** è una piattaforma didattica progettata per insegnare *Dungeons & Dragons* in modo semplice, guidato e accessibile.

Non è un simulatore completo e non vuole sostituire un VTT.
L’obiettivo è accompagnare chi non ha mai giocato a D&D nel comprendere:

* regole base
* combattimento
* creazione personaggi
* statistiche
* tiri di dado
* logiche di gioco

in modo graduale, pratico e interattivo.

> 🎯 Obiettivo del progetto: trasformare “non capisco nulla di D&D” in “ok, posso iniziare una campagna”.

---

# 🧠 Filosofia del Progetto

Dungeons & Dragons è spesso percepito come complesso per chi inizia:

* manuali lunghi
* tante eccezioni
* terminologia tecnica
* meccaniche difficili da visualizzare

DnD Academy nasce per abbassare la barriera d’ingresso attraverso:

* lezioni guidate
* quiz interattivi
* campagne tutorial
* progressione didattica
* combattimenti semplificati
* feedback immediati

Fallire non significa perdere.

> Fallire significa imparare.

---

# 👥 Ruoli

## 🧑‍🎓 PLAYER

Può:

* seguire lezioni
* completare quiz
* monitorare i propri progressi
* ottenere badge
* aumentare il proprio livello didattico
* partecipare a campagne tutorial
* usare personaggi guidati
* simulare combattimenti base

---

## 🧙‍♂️ MASTER

Può:

* creare campagne
* creare lezioni
* creare quiz
* creare domande e risposte
* gestire contenuti didattici
* supervisionare l’esperienza di apprendimento

Il MASTER non è un semplice admin tecnico.

> È il “Dungeon Master didattico” della piattaforma.

---

# ✅ Stato Attuale del Backend

Il backend Spring Boot è attualmente completo per la prima integrazione frontend locale.

## ✔️ Implementato

### 🔐 Autenticazione & Sicurezza

* JWT Authentication
* Login/Register
* Spring Security
* Password hashate con BCrypt
* RBAC (PLAYER / MASTER)
* Ownership checks
* Protezione accessi campagne/combat

---

### 📘 Sistema Didattico

* Lezioni
* Quiz
* Domande
* Risposte multiple
* Salvataggio progresso utente
* Quiz completati
* Sblocco lezioni
* Badge automatici
* Learning Levels:

  * BEGINNER
  * INTERMEDIATE
  * ADVANCED

---

### ⚔️ Sistema Combat

* Combattimento a turni
* Iniziativa con modificatore DEX
* Gestione HP
* Attacco e danni
* Critici
* Turn order
* Combat over
* Winner detection
* Protezione anti-spoofing
* Validazione ownership personaggi

---

### 🧑‍🎓 Personaggi

* Creazione personaggi
* Razza
* Classe
* Statistiche
* Armor Class
* HP
* Associazione a campagne
* Associazione al player

---

### 🏕️ Campagne

* Creazione campagne
* Join campaign
* Party system
* Gestione player/master
* Protezione accessi cross-campaign

---

# 🧩 Feature MVP

## 📘 Impara D&D

* lezioni guidate
* quiz interattivi
* progressione
* livelli apprendimento
* badge

---

## ⚔️ Combattimento Tutorial

* simulazione turni
* gestione dadi
* CA / HP / danni
* feedback immediato

---

## 🎲 Dadi

Attualmente implementata la logica backend per:

* d20 attack roll
* modificatori statistiche
* critici

Frontend 3D dice previsto nelle prossime fasi.

---

# 🗺️ Roadmap Future

## Frontend

* Next.js App Router
* UI responsive
* Dashboard player
* Dashboard master
* Wizard creazione personaggio
* Dice animations
* Progress UI
* Combat UI

---

## Backend Improvements

* Flyway/Liquibase
* Error handling semantico (401/403/404)
* Ottimizzazione query JPA
* Transaction management avanzato
* Profili dev/prod
* Deploy production-ready

---

# 🧱 Stack Tecnologico

## 🖥️ Backend

* Java 17
* Spring Boot
* Spring Security
* JWT
* JPA / Hibernate
* PostgreSQL
* Maven

📁 `dndacademyBE/`

---

## 🌐 Frontend

* Next.js
* React
* TypeScript
* Zustand / Redux Toolkit
* TailwindCSS o Bootstrap

📁 `dndacademyFE/`

---

# 🗄️ Database

Database relazionale PostgreSQL.

Principali entità:

* users
* campaigns
* characters
* character_stats
* combats
* lessons
* quizzes
* questions
* answers
* user_lesson_progress
* user_quiz_results
* badges

---

# ☁️ Deploy

## Backend

🚀 Railway

## Frontend

🌐 Vercel

---

# 📌 Stato del Progetto

Il backend è attualmente pronto per l’integrazione frontend locale.

Il progetto è in sviluppo attivo e continuerà ad evolversi con:

* frontend completo
* UI didattica
* campagne tutorial avanzate
* sistema dadi visuale
* miglioramenti architetturali production-grade

---

# 📄 Licenza

Progetto sviluppato per portfolio personale e scopi educativi.