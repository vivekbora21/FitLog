export interface UserProfile {
  id: string;
  date_of_birth?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  fitness_goal: string;
  unit_preference: string;
  bio: string;
}

export interface GymMembership {
  id: string;
  user?: User;
  gym?: string;
  gym_id?: string;
  gym_name?: string;
  gym_slug?: string;
  role: 'OWNER' | 'TRAINER' | 'MEMBER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  share_workouts_with_trainers: boolean;
  share_progress_with_trainers: boolean;
  share_nutrition_with_trainers?: boolean;
  share_body_measurements?: boolean;
  created_at?: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar_url?: string | null;
  profile?: UserProfile;
  memberships: GymMembership[];
}

export interface MuscleGroup {
  id: string;
  name: string;
  slug: string;
}

export interface EquipmentType {
  id: string;
  name: string;
  slug: string;
}

export interface Exercise {
  id: string;
  name: string;
  slug: string;
  gym?: string | null;
  gym_name?: string | null;
  primary_muscle: string;
  primary_muscle_name: string;
  secondary_muscles: string[];
  equipment: string;
  equipment_name: string;
  instructions: string;
  video_url?: string | null;
  is_global: boolean;
}

export interface RoutineExercise {
  id: string;
  exercise: string;
  exercise_name: string;
  primary_muscle: string;
  order: number;
  target_sets: number;
  target_reps: string;
  rest_seconds: number;
  notes: string;
}

export interface Routine {
  id: string;
  name: string;
  description: string;
  gym?: string | null;
  user?: string | null;
  created_by?: string | null;
  created_by_name?: string | null;
  is_gym_template: boolean;
  exercises: RoutineExercise[];
  created_at: string;
  updated_at: string;
}

export interface WorkoutSet {
  id?: string;
  set_number: number;
  set_type: 'WARMUP' | 'NORMAL' | 'DROP' | 'FAILURE';
  weight_kg: number;
  reps: number;
  rpe?: number | null;
  completed: boolean;
}

export interface WorkoutExercise {
  id?: string;
  exercise: string;
  exercise_name: string;
  primary_muscle: string;
  order: number;
  rest_seconds: number;
  notes: string;
  sets: WorkoutSet[];
}

export interface WorkoutSession {
  id: string;
  user: string;
  user_email: string;
  user_name: string;
  gym?: string | null;
  gym_name?: string | null;
  assigned_workout?: string | null;
  routine?: string | null;
  title: string;
  started_at: string;
  completed_at?: string | null;
  duration_seconds: number;
  overall_rpe?: number | null;
  notes: string;
  exercises: WorkoutExercise[];
  total_volume_kg: number;
  created_at: string;
}

export interface AssignedWorkout {
  id: string;
  gym: string;
  gym_name: string;
  trainer: string;
  trainer_name: string;
  client: string;
  client_name: string;
  routine: string;
  routine_name: string;
  routine_details?: Routine;
  scheduled_date: string;
  status: 'PENDING' | 'COMPLETED' | 'SKIPPED';
  trainer_feedback: string;
  feedback_date?: string | null;
  created_at: string;
}

export interface MealEntry {
  id: string;
  meal_type: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  time_logged: string;
}

export interface NutritionDay {
  id: string;
  user: string;
  date: string;
  water_consumed_ml: number;
  notes: string;
  meals: MealEntry[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
}

export interface MacroTarget {
  id: string;
  daily_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  water_ml: number;
}

export interface WeightEntry {
  id: string;
  date: string;
  weight_kg: number;
  body_fat_pct?: number | null;
  notes: string;
  created_at: string;
}

export interface BodyMeasurement {
  id: string;
  date: string;
  // Torso & Core
  neck_cm?: number | null;
  shoulders_cm?: number | null;
  chest_cm?: number | null;
  waist_cm?: number | null;
  hips_cm?: number | null;
  // Arms
  arms_cm?: number | null;
  biceps_left_cm?: number | null;
  biceps_right_cm?: number | null;
  forearms_cm?: number | null;
  // Legs
  thighs_cm?: number | null;
  thigh_left_cm?: number | null;
  thigh_right_cm?: number | null;
  calves_cm?: number | null;
  calf_left_cm?: number | null;
  calf_right_cm?: number | null;
  notes: string;
  created_at: string;
}

export interface PersonalRecord {
  id: string;
  exercise: string;
  exercise_name: string;
  primary_muscle: string;
  max_weight_kg: number;
  reps: number;
  estimated_one_rep_max: number;
  achieved_at: string;
}

export interface Gym {
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  logo_url?: string | null;
  branches: { id: string; name: string; address: string; phone: string }[];
  equipment: { id: string; name: string; category: string; quantity: number }[];
  members_count: number;
  created_at: string;
}

export interface GymInvitation {
  id: string;
  gym: string;
  gym_name: string;
  email: string;
  role: 'TRAINER' | 'MEMBER';
  token: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  expires_at: string;
  invited_by_name: string;
  created_at: string;
}

export interface TrainerClientAssignment {
  id: string;
  trainer_membership: string;
  client_membership: string;
  trainer_name: string;
  client_name: string;
  client_email: string;
  client_id: string;
  is_active: boolean;
  start_date: string;
  notes: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  actor_name: string;
  gym?: string | null;
  gym_name?: string | null;
  action: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, any>;
  created_at: string;
}

export interface Notification {
  id: string;
  actor?: string | null;
  actor_name: string;
  gym?: string | null;
  gym_name?: string | null;
  verb: string;
  message: string;
  target_type: string;
  target_id: string;
  is_read: boolean;
  created_at: string;
}

export interface DashboardStats {
  streak_days: number;
  workouts_this_week: number;
  workouts_this_month: number;
  total_volume_kg_week: number;
  nutrition: {
    calories_consumed: number;
    calories_target: number;
    protein_consumed: number;
    protein_target: number;
    carbs_consumed: number;
    carbs_target: number;
    fat_consumed: number;
    fat_target: number;
    water_consumed_ml: number;
    water_target_ml: number;
  };
  activity_heatmap: Record<string, number>;
  pending_assigned_workout?: {
    id: string;
    routine_name: string;
    routine_id: string;
    trainer_name: string;
    scheduled_date: string;
  } | null;
  recent_prs: {
    exercise: string;
    max_weight_kg: number;
    reps: number;
    estimated_1rm: number;
    achieved_at: string;
  }[];
}
