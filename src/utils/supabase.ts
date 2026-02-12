import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Credentials automatically loaded from .env by Expo (EXPO_PUBLIC_ prefix)
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const fetchRandomCategories = async (categoryLimit: number = 6, questionsLimit: number = 5) => {
  try {
    console.log(`[DEBUG] supabase.ts: Fetching random categories with categoryLimit: ${categoryLimit}, questionsLimit: ${questionsLimit}`);
    const CATEGORY_COUNT = categoryLimit;

    // First get total count to pick random offset, or check if enough exist
    const { count, error: countError } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    let categories: any[] = [];
    let useFallback = false;

    if (!count || count < CATEGORY_COUNT) {
      console.log('Not enough categories, fetching all available');
      useFallback = true;
    } else {
      // Get random rows via RPC
      const { data, error } = await supabase
        .rpc('get_random_categories', { limit_count: CATEGORY_COUNT })
        .select('*, questions(*)');

      if (error) {
        console.warn('[WARN] RPC get_random_categories failed, falling back to simple select. Error:', error);
        useFallback = true;
      } else {
        categories = data || [];
        // Add check for questions content
        if (categories.length > 0 && !categories[0].questions) {
          console.warn('[WARN] RPC returned categories but NO questions. Falling back.');
          useFallback = true;
        }
      }
    }

    if (useFallback) {
      // Fetch MORE categories than needed to allow for filtering and shuffling
      const { data, error } = await supabase
        .from('categories')
        .select(`
                    id,
                    name,
                    questions (
                        id,
                        question,
                        answer,
                        points,
                        options,
                        reference,
                        question_en,
                        question_pt,
                        answer_en,
                        answer_pt,
                        options_en,
                        options_pt,
                        reference_en,
                        reference_pt
                    )
                `)
        .limit(20); // Fetch pool of 20

      if (error) throw error;

      let allCats = data || [];

      // 1. Filter: Ensure they have enough questions
      const validCats = allCats.filter(c => c.questions && c.questions.length >= questionsLimit);

      // 2. Shuffle (Fisher-Yates)
      for (let i = validCats.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [validCats[i], validCats[j]] = [validCats[j], validCats[i]];
      }

      // 3. Slice to desired count
      categories = validCats.slice(0, CATEGORY_COUNT);

      if (categories.length < CATEGORY_COUNT) {
        console.warn(`[WARN] Only found ${categories.length} valid categories (needed ${CATEGORY_COUNT}).`);
      }
    }

    // Post-process: Slice questions for each category
    const processedCategories = categories.map(cat => {
      // Sort by points to ensure we get easy->hard or just consistent set
      // Assuming questions are passed as array.
      const sortedQuestions = (cat.questions || []).sort((a: any, b: any) => a.points - b.points);
      const limitedQuestions = sortedQuestions.slice(0, questionsLimit);
      return {
        ...cat,
        questions: limitedQuestions
      };
    });

    return processedCategories;
  } catch (error) {
    console.error('Error fetching random categories:', error);
    return [];
  }
};

export const createGameSession = async (categories: any[]) => {
  try {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const { data, error } = await supabase
      .from('game_sessions')
      .insert({
        pin_code: pin,
        is_active: true,
        game_state: {
          questions: categories, // Storing full categories structure or flattening?
          // Usually we might want to structure this properly
          currentTeam: 1,
          team1Score: 0,
          team2Score: 0,
          answeredQuestions: []
        }
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating game session:', error);
    return null;
  }
};
