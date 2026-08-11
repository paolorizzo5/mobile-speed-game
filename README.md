# Reflex Rush

App mobile (Expo / React Native + TypeScript) con un gioco di riflessi e rapidità ispirato a sfide in stile Ruzzle. Ogni partita è composta da 3 round e il punteggio complessivo fa salire o scendere di livello, che a sua volta regola la difficoltà delle partite successive.

## Round di gioco

1. **Bersagli** — forme colorate compaiono in punti casuali dello schermo: vanno toccate prima che scompaiano.
2. **Trova l'uguale** — in basso a sinistra viene mostrato un modello (forma + colore); tra le opzioni sullo schermo va toccata quella identica, tra vari elementi simili ma non uguali.
3. **Scorrimento** — le forme scorrono sullo schermo su più corsie; va colpita solo quella che corrisponde al bersaglio indicato in alto, ignorando le altre.

Al termine dei 3 round, il punteggio medio determina l'avanzamento:

- punteggio ≥ 75 → livello +1
- punteggio < 40 → livello -1
- altrimenti il livello resta invariato

Il livello (insieme a partite giocate e miglior punteggio) è salvato in locale con `AsyncStorage` e regola i parametri di difficoltà (velocità di comparsa, tempo a disposizione, numero di distrattori) di ogni round.

## Sfida online (1v1)

Dalla Home, "Sfida online" permette di giocare gli stessi 3 round contro un altro giocatore, in modo asincrono in stile Ruzzle: entrambi affrontano **la stessa identica sequenza** di forme/colori/posizioni (generata da un seed condiviso), poi vince chi totalizza il punteggio complessivo più alto. Due modalità:

- **Avversario casuale**: entra in coda e viene abbinato al primo giocatore libero di livello simile.
- **Codice sfida**: crei una partita e condividi un codice a 6 caratteri con un amico, che lo inserisce per unirsi.

Il backend è [Supabase](https://supabase.com) (Postgres + Realtime + Auth anonima), gratuito nel piano free. Senza configurarlo l'app funziona comunque normalmente in solo: la sezione online mostra solo un avviso "backend non configurato".

Per attivarlo:

1. Crea un progetto su [supabase.com](https://supabase.com).
2. In **SQL Editor**, incolla ed esegui tutto il contenuto di [`supabase/schema.sql`](./supabase/schema.sql) (tabelle, RLS e funzioni di matchmaking).
3. In **Authentication → Providers**, abilita **Anonymous sign-ins** (l'app crea un utente anonimo per device, senza schermata di login).
4. In **Project Settings → API**, copia `Project URL` e `anon public key`.
5. Copia `.env.example` in `.env` e incolla i due valori in `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
6. Riavvia `npm run start`.

## Sviluppo

```bash
npm install
npm run start   # Expo dev server (scansiona il QR con Expo Go)
npm run android
npm run ios
npm run web
```

## Struttura

```
src/
  game/        # tipi, storage, difficoltà, punteggio, rng seedato, logica di livello, client sfide online
  lib/         # client Supabase
  components/  # ShapeView, RoundHud
  screens/     # Home, Online (menu/lobby), Round1/2/3, Results
  navigation/  # tipi dello stack di navigazione
supabase/
  schema.sql   # tabelle, RLS e funzioni RPC per il matchmaking online
```
