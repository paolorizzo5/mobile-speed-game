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
  game/        # tipi, storage, difficoltà, punteggio, logica di livello
  components/  # ShapeView, RoundHud
  screens/     # Home, Round1/2/3, Results
  navigation/  # tipi dello stack di navigazione
```
