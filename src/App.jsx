import { useCareerReducer } from './ui/useCareerReducer.js';
import CreationScreen from './ui/screens/CreationScreen.jsx';
import DraftScreen from './ui/screens/DraftScreen.jsx';
import TrainingScreen from './ui/screens/TrainingScreen.jsx';
import CardScreen from './ui/screens/CardScreen.jsx';
import RecapScreen from './ui/screens/RecapScreen.jsx';
import RetirementScreen from './ui/screens/RetirementScreen.jsx';

function App() {
  const { state, createNewCareer, chooseDraft, allocate, resolveCard, finishTheSeason, continueSeason, restart } =
    useCareerReducer();

  if (!state) {
    return <CreationScreen onCreate={createNewCareer} />;
  }

  switch (state.gamePhase) {
    case 'draft':
      return <DraftScreen state={state} onChoose={chooseDraft} />;
    case 'training':
      return <TrainingScreen state={state} onSubmit={allocate} />;
    case 'card':
      return <CardScreen state={state} onResolve={resolveCard} onContinue={finishTheSeason} />;
    case 'season_recap':
      return <RecapScreen state={state} onContinue={continueSeason} />;
    case 'retired':
      return <RetirementScreen state={state} onRestart={restart} />;
    default:
      return null;
  }
}

export default App;
