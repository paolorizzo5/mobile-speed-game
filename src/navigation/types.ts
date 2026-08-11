import { RoundResult } from '../game/types';

export type RootStackParamList = {
  Home: undefined;
  Round1: { level: number };
  Round2: { level: number; result1: RoundResult };
  Round3: { level: number; result1: RoundResult; result2: RoundResult };
  Results: {
    level: number;
    result1: RoundResult;
    result2: RoundResult;
    result3: RoundResult;
  };
};
