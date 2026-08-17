import { useReducer, useRef, useCallback } from 'react';
import { rngFromState } from '../engine/rng.js';
import {
  createCareer,
  chooseDraftClub,
  allocateTraining,
  resolveCurrentCard,
  finishSeason,
  continueToNextSeason,
} from '../engine/career.js';

// Thin bridge between React and the pure engine. No game rules live here —
// every case is a direct call into src/engine/career.js. The one piece of
// state that can't live in the reducer itself is the RNG: it's a mutable
// generator that must stay the SAME instance for the whole career so the
// random sequence continues correctly across renders, so it's held in a
// ref and threaded into the calls that need it.
function reducer(state, action) {
  switch (action.type) {
    case 'CREATE_CAREER':
      return action.newState;
    case 'CHOOSE_DRAFT_CLUB':
      return chooseDraftClub(state, action.index);
    case 'ALLOCATE_TRAINING':
      return allocateTraining(state, action.allocation, action.rng);
    case 'RESOLVE_CARD':
      return resolveCurrentCard(state, action.optionIndex, action.rng);
    case 'FINISH_SEASON':
      return finishSeason(state, action.rng);
    case 'CONTINUE_SEASON':
      return continueToNextSeason(state, action.offer, action.acceptRetirement);
    case 'RESTART':
      return null;
    default:
      return state;
  }
}

export function useCareerReducer() {
  const [state, dispatch] = useReducer(reducer, null);
  const rngRef = useRef(null);

  const createNewCareer = useCallback((seed, { name, position }) => {
    const newState = createCareer(seed, { name, position });
    rngRef.current = rngFromState(newState.rngState);
    dispatch({ type: 'CREATE_CAREER', newState });
  }, []);

  const chooseDraft = useCallback((index) => dispatch({ type: 'CHOOSE_DRAFT_CLUB', index }), []);

  const allocate = useCallback(
    (allocation) => dispatch({ type: 'ALLOCATE_TRAINING', allocation, rng: rngRef.current }),
    []
  );

  const resolveCard = useCallback(
    (optionIndex) => dispatch({ type: 'RESOLVE_CARD', optionIndex, rng: rngRef.current }),
    []
  );

  const finishTheSeason = useCallback(() => dispatch({ type: 'FINISH_SEASON', rng: rngRef.current }), []);

  const continueSeason = useCallback(
    (offer, acceptRetirement) => dispatch({ type: 'CONTINUE_SEASON', offer, acceptRetirement }),
    []
  );

  const restart = useCallback(() => dispatch({ type: 'RESTART' }), []);

  return { state, createNewCareer, chooseDraft, allocate, resolveCard, finishTheSeason, continueSeason, restart };
}
