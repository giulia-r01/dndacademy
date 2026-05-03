# 🐉 DnDAcademy – Backend

Backend REST per una web app didattica ispirata a **Dungeons & Dragons**, progettata per gestire campagne, personaggi e combattimenti a turni.

L’obiettivo del progetto è simulare in modo semplice ma coerente le principali dinamiche di D&D, offrendo una base solida per lo sviluppo del frontend e per l’interazione tra più utenti.

---

## 🚀 Tecnologie utilizzate

- Java 17
- Spring Boot
- Spring Security (JWT)
- Spring Data JPA
- PostgreSQL
- Maven

---

## 🧠 Funzionalità principali

### 🔐 Autenticazione

- Registrazione utente
- Login con JWT
- Ruoli: `PLAYER`, `MASTER`

---

### 🏰 Campaign System

- Creazione campagne
- Join alle campagne
- Gestione party (master + players)

---

### 🧝 Character System

- Creazione personaggi associati a una campagna
- Statistiche (STR, DEX, CON, INT, WIS, CHA)
- Sistema HP (max/current)
- Armor Class (AC)
- Stato alive/dead

---

### ⚔️ Combat System

#### ✔️ Start Combat

- Iniziativa basata su:

  ```
  d20 + modificatore Destrezza
  ```

- Generazione ordine turni

#### ✔️ Turn Management

- Turno corrente
- Cambio turno automatico
- Skip automatico personaggi morti

#### ✔️ Attack System

- Tiro d20
- Bonus forza
- Controllo AC
- Critico (20 naturale)
- Calcolo danno
- Aggiornamento HP
- Gestione morte

#### ✔️ Combat Status

Endpoint per ottenere lo stato completo del combattimento:

- ordine turni
- chi è vivo
- HP attuali
- turno corrente
- iniziativa
- fine combattimento
- vincitore

---

### ❌ Validazioni implementate

- Attacco solo nel proprio turno
- Impossibile attaccare se morto
- Impossibile attaccare target già morto
- Impossibile attaccare fuori dalla campagna
- Blocco azioni a combattimento terminato

---

### 🧯 Error Handling

- Gestione globale errori tramite `@RestControllerAdvice`
- Risposte pulite e leggibili (no stacktrace)

---

## 🔗 Endpoints principali

### Auth

```
POST /auth/register
POST /auth/login
```

---

### Campaign

```
POST /api/campaigns
GET  /api/campaigns
POST /api/campaigns/{id}/join
```

---

### Characters

```
POST   /api/characters
GET    /api/characters/me
GET    /api/characters/campaign/{id}
PATCH  /api/characters/{id}/damage
PATCH  /api/characters/{id}/heal
POST   /api/characters/attack
```

---

### Combat

```
POST /api/combat/start/{campaignId}
GET  /api/combat/{combatId}/current
POST /api/combat/{combatId}/next
GET  /api/combat/{combatId}/status
```

---

## 🔄 Flusso base del combattimento

```
1. Login
2. Creazione campagna
3. Creazione personaggi
4. Start combat
5. Verifica turno corrente
6. Attack
7. Next turn
8. Ripeti fino a fine combattimento
9. Verifica vincitore
```

---

## 📦 Struttura progetto

```
controllers/
service/
repository/
model/
dto/
security/
exceptions/
```

---

## 🎯 Obiettivo del progetto

Questo backend è stato progettato per:

- simulare un sistema di combattimento a turni stile D&D
- gestire stato condiviso tra più utenti
- fornire API pulite per un frontend React
- essere estendibile (magie, condizioni, dadi avanzati)

---

## 📌 Stato attuale

✅ Backend completo per MVP
✅ Combat system funzionante
✅ Pronto per integrazione frontend

---

## 🔮 Possibili sviluppi futuri

- Sistema magie
- Status effects (stunned, poison, ecc.)
- Log combattimento
- Gestione campagne avanzata
- Dashboard frontend interattiva

---

## 👩‍💻 Autore

Giulia – progetto personale a scopo didattico e portfolio
