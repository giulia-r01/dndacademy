# 🐉 DnD Academy – Web App per Imparare Dungeons & Dragons

**DnD Academy** è una web app didattica progettata per insegnare _Dungeons & Dragons_ in modo semplice, guidato e accessibile.  
Non è un simulatore, non è un VTT, non è un gioco completo.  
È un **companion interattivo** che accompagna l’utente passo dopo passo nel capire le regole, creare un personaggio e fare pratica in sicurezza.

> 🎯 Obiettivo: trasformare “non capisco nulla di D&D” in “ok, posso sedermi a un tavolo”.

---

# 🧠 Visione del Progetto

D&D è un gioco meraviglioso, ma spesso intimidisce chi inizia: manuali enormi, regole complesse, mille eccezioni.  
DnD Academy nasce per **abbassare la barriera d’ingresso**.

La filosofia è chiara:

### ✔️ Accompagnare l’utente

- spiegazioni semplici
- esempi pratici
- personaggi base
- tiri di dado guidati
- campagne tutorial

È una **learning app**, non un gioco completo.

---

# 👥 Ruoli

### 🧑‍🎓 USER (Player)

- segue lezioni
- completa quiz
- usa personaggi base
- tira dadi
- vede il proprio progresso
- sbaglia senza conseguenze

### 🧙‍♂️ ADMIN (Master)

- crea lezioni
- crea quiz
- prepara campagne tutorial
- definisce difficoltà e obiettivi
- gestisce contenuti didattici

L’admin non “gioca”: **insegna**.

---

# 🧩 Feature MVP (prima versione)

## 📘 Modulo “Impara”

- lezioni brevi e chiare
- esempi pratici
- quiz vero/falso e scelta multipla
- salvataggio del progresso

## 🗺️ Campagne Tutorial

Struttura guidata:
Campagna → Scenario → Step → Azione → Spiegazione

Ogni campagna insegna UNA meccanica:

- prove di abilità
- combattimento base
- incantesimi
- CA, tiri per colpire, danni

Fallire ≠ game over  
Fallire = spiegazione.

## 🎲 Dadi Animati

- d4, d6, d8, d10, d12, d20
- animazione visuale
- logica separata dalla UI

## 🧑‍🎓 Personaggi Base

- classe
- statistiche
- bonus calcolati
- equipaggiamento minimo

Solo ciò che serve per imparare.

---

# 🗺️ Roadmap

### Stack

**Frontend**

- Next.js (App Router)
- React + TypeScript
- Redux Toolkit o Zustand
- Bootstrap o Tailwind

**Backend**

- Spring Boot
- Spring Security + JWT
- PostgreSQL
- REST API

**Ruoli**

- USER
- ADMIN

---

## **Fase 1 – Fondamenta**

Backend:

- User
- Role
- Auth (login/register)
- Lezione
- Capitolo
- Progresso utente

Frontend:

- routing base
- login/register
- layout
- dashboard

---

## **Fase 2 – Imparare D&D**

Backend:

- lezioni
- quiz
- risposte
- progresso

Frontend:

- UI pulita
- quiz interattivi
- percentuali di completamento

---

## **Fase 3 – Crea il Personaggio**

Wizard guidato:

- razza
- classe
- caratteristiche
- background
- equipaggiamento

Backend:

- modello Personaggio
- statistiche
- calcoli

Frontend:

- wizard step-by-step
- anteprima scheda

---

## **Fase 4 – Fai Pratica**

Modulo “Prova”:

- tiri guidati
- spiegazioni
- simulazioni didattiche

---

## **Fase 5 – Backoffice**

Admin:

- CRUD lezioni
- CRUD quiz
- gestione contenuti

---

# 🗄️ Database – Struttura Principale

users
roles
lessons
quizzes
quiz_answers
user_progress
campaigns
scenarios
scenario_steps
characters_base
dice_rolls

DB relazionale, niente NoSQL.

---

# 🧱 Stack Tecnologico

## 🖥️ Backend – Spring Boot

- Java 17+
- Spring Boot
- Spring Security + JWT
- JPA / Hibernate
- PostgreSQL
- Maven

📁 Cartella: `dndacademyBE/`

---

## 🌐 Frontend – Next.js

- Next.js 14+
- React + TypeScript
- Redux Toolkit o Zustand
- TailwindCSS o Bootstrap
- Animazioni CSS / libreria dadi 3D

📁 Cartella: `dndacademyFE/`

---

# 🗂 Struttura del Repository

dndacademy/
│
├── dndacademyBE/ # Backend Spring Boot
│ ├── src/
│ ├── pom.xml
│ └── README.md
│
└── dndacademyFE/ # Frontend Next.js
├── src/
├── package.json
└── README.md

☁️ Deploy
🚀 Backend → Railway

🌐 Frontend → Vercel

📌 Stato del Progetto
Il progetto è in sviluppo attivo.
L’obiettivo è creare la migliore app didattica per imparare D&D in modo semplice, guidato e divertente.

📄 Licenza
Progetto sviluppato per portfolio e scopi educativi.
