import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';
import { fetchRandomCategories, createGameSession } from '../utils/supabase';

export interface Question {
    id: number;
    category: string;
    question: string;
    options: string[];
    answer: string;
    points: number;
    reference?: string; // Cita bíblica (ej: Juan 3:16)

    // Multi-language support (Optional)
    question_en?: string;
    question_pt?: string;
    answer_en?: string;
    answer_pt?: string;
    options_en?: string[];
    options_pt?: string[];
    reference_en?: string;
    reference_pt?: string;
}

// Define BuzzerPress interface
export interface BuzzerPress {
    teamId: number;
    playerName: string;
    timestamp: number;
}

interface GameState {
    questions: Question[];
    currentTeam: 1 | 2;
    team1Score: number;
    team2Score: number;
    team1Streak: number;
    team2Streak: number;
    answeredQuestions: Set<number>;
    isGameOver: boolean;
    team1Name: string;
    team2Name: string;
    isLoading: boolean;
    // Roster Logic
    team1Roster: string[];
    team2Roster: string[];
    team1TurnIndex: number;
    team2TurnIndex: number;
}

type GameAction =
    | { type: 'SET_QUESTIONS'; payload: Question[] }
    | { type: 'SET_TEAM_NAMES'; payload: { team1Name: string; team2Name: string } }
    | { type: 'SET_ROSTERS'; payload: { team1Roster: string[]; team2Roster: string[] } } // New Action
    | { type: 'ANSWER_CORRECT'; payload: { questionId: number; points: number } }
    | { type: 'ANSWER_WRONG'; payload: { questionId: number } }
    | { type: 'ADD_BONUS'; payload: { team: 1 | 2; bonus: number } }
    | { type: 'SWITCH_TEAM' }
    | { type: 'END_GAME' }
    | { type: 'RESET_GAME' }
    | { type: 'LOAD_GAME'; payload: any } // JSON object from DB
    | { type: 'SET_LOADING'; payload: boolean };

const initialState: GameState = {
    questions: [],
    currentTeam: 1,
    team1Score: 0,
    team2Score: 0,
    team1Streak: 0,
    team2Streak: 0,
    answeredQuestions: new Set(),
    isGameOver: false,
    team1Name: 'Equipo 1',
    team2Name: 'Equipo 2',
    isLoading: true,
    // Initial Roster State
    team1Roster: [],
    team2Roster: [],
    team1TurnIndex: 0,
    team2TurnIndex: 0,
};

function gameReducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
        case 'SET_QUESTIONS':
            return { ...state, questions: action.payload, isLoading: false };

        case 'SET_TEAM_NAMES':
            return {
                ...state,
                team1Name: action.payload.team1Name,
                team2Name: action.payload.team2Name
            };

        case 'SET_ROSTERS':
            return {
                ...state,
                team1Roster: action.payload.team1Roster,
                team2Roster: action.payload.team2Roster,
                team1TurnIndex: 0,
                team2TurnIndex: 0,
            };

        case 'ANSWER_CORRECT': {
            const newAnswered = new Set(state.answeredQuestions);
            newAnswered.add(action.payload.questionId);

            if (state.currentTeam === 1) {
                return {
                    ...state,
                    team1Score: state.team1Score + action.payload.points,
                    team1Streak: state.team1Streak + 1,
                    answeredQuestions: newAnswered,
                };
            } else {
                return {
                    ...state,
                    team2Score: state.team2Score + action.payload.points,
                    team2Streak: state.team2Streak + 1,
                    answeredQuestions: newAnswered,
                };
            }
        }

        case 'ANSWER_WRONG': {
            const newAnswered = new Set(state.answeredQuestions);
            newAnswered.add(action.payload.questionId);

            if (state.currentTeam === 1) {
                return { ...state, team1Streak: 0, answeredQuestions: newAnswered };
            } else {
                return { ...state, team2Streak: 0, answeredQuestions: newAnswered };
            }
        }

        case 'ADD_BONUS':
            if (action.payload.team === 1) {
                return { ...state, team1Score: state.team1Score + action.payload.bonus };
            } else {
                return { ...state, team2Score: state.team2Score + action.payload.bonus };
            }

        case 'SWITCH_TEAM': {
            // Rotate the turn index for the team that JUST finished properly? 
            // Actually usually we rotate after they are done. 
            // If currentTeam is 1, and we switch to 2, we should probably rotate team 1's index for NEXT time, OR rotate team 2's index?
            // Let's rotate the team that just finished their turn so next time it's someone else.

            let nextTeam1Index = state.team1TurnIndex;
            let nextTeam2Index = state.team2TurnIndex;

            if (state.currentTeam === 1) {
                nextTeam1Index = (state.team1TurnIndex + 1) % (state.team1Roster.length || 1);
            } else {
                nextTeam2Index = (state.team2TurnIndex + 1) % (state.team2Roster.length || 1);
            }

            return {
                ...state,
                currentTeam: state.currentTeam === 1 ? 2 : 1,
                team1TurnIndex: nextTeam1Index,
                team2TurnIndex: nextTeam2Index
            };
        }

        case 'END_GAME':
            return { ...state, isGameOver: true };

        case 'RESET_GAME':
            return {
                ...initialState,
                questions: state.questions,
                team1Name: state.team1Name,
                team2Name: state.team2Name,
                team1Roster: state.team1Roster,
                team2Roster: state.team2Roster,
                isLoading: false,
            };

        case 'LOAD_GAME':
            // Hydrate state from saved JSON
            // handled in payload preparation or here? Payload should be partial GameState but with array for answeredQuestions
            const loadedState = action.payload;
            return {
                ...state,
                ...loadedState,
                // Ensure Set conversion
                answeredQuestions: new Set(loadedState.answeredQuestions || []),
                isLoading: false,
            };

        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };

        default:
            return state;
    }
}

interface GameContextType {
    state: GameState;
    dispatch: React.Dispatch<GameAction>;
    handleCorrectAnswer: (questionId: number, points: number) => { showBonus: boolean };
    handleWrongAnswer: (questionId: number) => void;
    createSession: (categoryLimit?: number, questionsLimit?: number) => Promise<{ id: string; questions: any[] } | null>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
};

interface GameProviderProps {
    children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(gameReducer, initialState);

    const handleCorrectAnswer = useCallback((questionId: number, points: number) => {
        dispatch({ type: 'ANSWER_CORRECT', payload: { questionId, points } });

        // Check for streak bonus (every 3 correct answers)
        const currentStreak = state.currentTeam === 1 ? state.team1Streak + 1 : state.team2Streak + 1;
        const showBonus = currentStreak > 0 && currentStreak % 3 === 0;

        if (showBonus) {
            dispatch({ type: 'ADD_BONUS', payload: { team: state.currentTeam, bonus: 50 } });
        }

        dispatch({ type: 'SWITCH_TEAM' });

        // Check if game is over
        if (state.answeredQuestions.size + 1 >= state.questions.length) {
            dispatch({ type: 'END_GAME' });
        }

        return { showBonus };
    }, [state.currentTeam, state.team1Streak, state.team2Streak, state.answeredQuestions.size, state.questions.length]);

    const handleWrongAnswer = useCallback((questionId: number) => {
        dispatch({ type: 'ANSWER_WRONG', payload: { questionId } });
        dispatch({ type: 'SWITCH_TEAM' });

        // Check if game is over
        if (state.answeredQuestions.size + 1 >= state.questions.length) {
            dispatch({ type: 'END_GAME' });
        }
    }, [state.answeredQuestions.size, state.questions.length]);

    const createSession = useCallback(async (categoryLimit: number = 6, questionsLimit: number = 5) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });

            // 1. Fetch random categories based on limits
            console.log('[DEBUG] GameContext: createSession called with categoryLimit:', categoryLimit, 'questionsLimit:', questionsLimit);
            const categories = await fetchRandomCategories(categoryLimit, questionsLimit);

            if (!categories || categories.length === 0) {
                console.error("No categories fetched");
                dispatch({ type: 'SET_LOADING', payload: false });
                return null;
            }

            // 2. Create session in Supabase
            const session = await createGameSession(categories);

            if (session) {
                // update local state?
                dispatch({ type: 'SET_LOADING', payload: false });
                return { id: session.id, questions: categories };
            }

            dispatch({ type: 'SET_LOADING', payload: false });
            return null;
        } catch (error) {
            console.error("Error in createSession:", error);
            dispatch({ type: 'SET_LOADING', payload: false });
            return null;
        }
    }, []);

    return (
        <GameContext.Provider value={{ state, dispatch, handleCorrectAnswer, handleWrongAnswer, createSession }}>
            {children}
        </GameContext.Provider>
    );
};
