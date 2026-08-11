import { RoundResult } from '../game/types';

export interface OnlineMatchParams {
  matchId: string;
  seed: string;
  level: number;
  opponentId: string;
  opponentName: string;
}

export type RootStackParamList = {
  Home: undefined;
  Online: undefined;
  OnlineLobby: { mode: 'random' | 'host' | 'join'; code?: string };
  Round1: { level: number; online?: OnlineMatchParams };
  Round2: { level: number; result1: RoundResult; online?: OnlineMatchParams };
  Round3: { level: number; result1: RoundResult; result2: RoundResult; online?: OnlineMatchParams };
  Results: {
    level: number;
    result1: RoundResult;
    result2: RoundResult;
    result3: RoundResult;
    online?: OnlineMatchParams;
  };
};
