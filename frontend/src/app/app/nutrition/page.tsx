'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Droplets, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { NutritionDay, MacroTarget, MealEntry, JourneyPacingData, JourneyMode } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { MacroRing } from '@/components/MacroRing';
import styles from './nutrition.module.css';

// Sourced from the user's "New start.xlsx" Diet Plan sheet — content kept verbatim.
const optionA = [
  ['Meal 1: Pre-Workout', 'Black Coffee + Soaked Almonds + Banana', '1 mug coffee + 6 almonds + 1 banana', 150, 3, 28, 4],
  ['Meal 2: Breakfast', 'Rolled Oats with Toned Milk & Cinnamon', '65g oats + 200ml toned milk', 340, 14, 54, 6],
  ['Meal 2: Breakfast', 'Whole Boiled Eggs + Steamed Egg Whites', '2 whole eggs + 3 egg whites', 230, 23, 2, 11],
  ['Meal 3: Mid-Morning', 'Green Tea & Roasted Chana (Phutana)', '1 cup tea + 35g roasted chana', 125, 8, 19, 2],
  ['Meal 4: Lunch', 'Soya Chunks Bhurji / Chicken Curry + Dal + Rotis', '50g soya (or 120g chicken) + dal + 2 rotis + salad', 630, 50, 82, 8],
  ['Meal 5: Evening Snack', 'Homemade Low-Fat Curd (Dahi) + Roasted Chana', '200g dahi + 35g roasted chana', 240, 17, 27, 6],
  ['Meal 6: Dinner', 'Pan-Seared Chicken Breast / Paneer + Rice + Sabzi', '150g chicken (or 130g paneer) + 160g rice + sabzi', 445, 50, 52, 6],
] as const;
const optionATotal = { calories: 2160, protein: 165, carbs: 264, fat: 43 };

const optionB = [
  ['Meal 1: Pre-Workout', 'Black Coffee + 5 Soaked Almonds', '1 mug coffee + 5 almonds', 40, 1, 1, 3],
  ['Meal 2: Breakfast', 'Rolled Oats with Toned Milk & Boiled Eggs', '55g oats + 180ml milk + 2 whole eggs', 450, 26, 49, 16],
  ['Meal 3: Mid-Morning', 'Fresh Ripe Banana + Green Tea', '1 medium banana + 1 cup green tea', 100, 1, 25, 0],
  ['Meal 4: Lunch', 'Spiced Chicken Breast Curry / Soya + Dal + Rotis', '65g chicken (or 45g soya) + dal + 2 rotis + salad', 515, 40, 77, 6],
  ['Meal 5: Evening Snack', 'Dry Roasted Chana + Low-Fat Dahi', '45g roasted chana + 180g homemade curd', 280, 19, 33, 6],
  ['Meal 6: Dinner', 'Chicken & Egg / Soya Bhurji + Rice + Sabzi', '65g chicken + egg white (or soya + paneer) + 200g rice + sabzi', 535, 44, 70, 10],
] as const;
const optionBTotal = { calories: 1920, protein: 131, carbs: 255, fat: 41 };

const staples = [
  ['Soya Chunks (Dry)', '40g dry weighed', '21g', 138, 'Tier 1: 52% protein (soak & squeeze)'],
  ['Whole Farm Eggs', '3 large eggs', '19g', 210, 'Tier 1: bioavailable complete protein'],
  ['Skinless Chicken Breast', '100g raw weighed', '31g', 120, 'Tier 1: high leucine lean muscle anchor'],
  ['Yellow Moong / Masoor Dal', '60g raw (1 cup cooked)', '14g', 205, 'Tier 2: essential daily amino pulse'],
  ['Homemade Low-Fat Dahi', '200g set curd', '9g', 120, 'Tier 2: slow-release casein & gut probiotic'],
  ['Roasted Chana (Bengal Gram)', '50g dry weighed', '11g', 180, 'Tier 2: low-GI high-fiber portable snack'],
  ['Rolled Oats (Plain)', '60g dry weighed', '8g', 230, 'Tier 3: beta-glucan heart & sustained energy'],
] as const;

function getAdjustmentProtocol(mode: JourneyMode) {
  if (mode === 'BULK') {
    return [
      ['Week 1–2 Baseline Check', 'Surplus adjustment & glycogen shift', 'Mild initial scale jump as glycogen & water increase with carbohydrates.', 'Hold calories steady. Verify gym energy and recovery before adjusting food.'],
      ['Week 3: Too Slow (<0.15 kg/wk)', 'Gaining less than 0.15 kg/week', 'High NEAT, fast metabolism, or calorie expenditure higher than estimated.', 'Add +150–200 kcal/day (extra 40g oats + 1 banana or 1 extra roti + ghee).'],
      ['Week 3: On Target (0.20–0.35 kg/wk)', 'Optimal clean surplus corridor', 'Maximizes myofibrillar hypertrophy with minimal adipose accumulation.', 'Maintain current intake — perfect balance of muscle accrual and leanness.'],
      ['Week 3: Too Fast (>0.50 kg/wk)', 'Weight climbing faster than 0.50 kg/week', 'Surplus exceeds maximum physiological rate of muscle protein synthesis.', 'Reduce daily intake by 100–150 kcal to preserve lean body composition.'],
    ] as const;
  }
  if (mode === 'FOCUS' || mode === 'HABIT') {
    return [
      ['Week 1–2 Baseline Check', 'Weigh-in consistency check', 'Establishing habitual morning weigh-ins and routine meal timing.', 'Focus on logging adherence and consistent meal windows rather than calorie tweaks.'],
      ['Week 3: Drifting Low', 'Weight dropping >0.25 kg/week', 'Calorie deficit unintentionally creeping in; can compromise workout energy.', 'Add +100–150 kcal/day to maintain energy and stable baseline weight.'],
      ['Week 3: On Target', 'Weight stable within ±0.20 kg/week', 'Optimal energy and hormonal baseline for habit building and compound strength.', 'Maintain steady daily nutrition and consistent hydration.'],
      ['Week 3: Drifting High', 'Weight climbing >0.25 kg/week', 'Snacking or liquid calories pushing energy balance above maintenance.', 'Trim 100–150 kcal/day (cut sugary beverages or reduce cooking oil).'],
    ] as const;
  }
  return [
    ['Week 1–2 Baseline Check', 'Drop of 1.0–2.0 kg in first 10 days', 'Expected initial glycogen, sodium, and water depletion — not all fat loss.', 'Hold calories steady. Do NOT increase food yet; allow water balance to normalize.'],
    ['Week 3: Too Slow (<0.30 kg/wk)', 'Weight loss stalled < 0.30 kg/week for 2 weeks', 'Metabolic adaptation, hidden cooking oils, or decreased daily steps.', 'Drop 100–150 kcal/day (cut 1 roti or 40g rice), or add 20 min cardio/week.'],
    ['Week 3: On Target (0.40–0.60 kg/wk)', 'Weight loss 0.40–0.60 kg/week', 'Optimal sweet spot: maximal fat oxidation with zero muscle wasting.', 'Change nothing — maintain identical nutrition, lifting intensity and cardio.'],
    ['Week 3: Too Fast (>0.80 kg/wk)', 'Weight loss > 0.80 kg/week for 2 weeks', 'Excessive deficit risking muscle loss, strength decline, and metabolic crash.', 'Increase daily intake by +150 kcal (add 35g oats or 1 banana + 100g curd).'],
  ] as const;
}

export default function NutritionPage() {
  const [data, setData] = useState<{ day: NutritionDay; targets: MacroTarget } | null>(null);
  const [pacing, setPacing] = useState<JourneyPacingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [addMealModal, setAddMealModal] = useState(false);

  // Add meal form state
  const [mealType, setMealType] = useState<'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'>('BREAKFAST');
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState<number>(450);
  const [protein, setProtein] = useState<number>(35);
  const [carbs, setCarbs] = useState<number>(50);
  const [fat, setFat] = useState<number>(10);
  const [saving, setSaving] = useState(false);

  const loadNutrition = async () => {
    try {
      const [res, pacingRes] = await Promise.all([
        api.getNutrition('today'),
        api.getJourneyPacingStatus().catch(() => null),
      ]);
      setData(res);
      setPacing(pacingRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNutrition();
  }, []);

  const handleAddMeal = async () => {
    if (!foodName.trim()) {
      alert('Please enter food name');
      return;
    }
    setSaving(true);
    try {
      await api.addMeal({
        name: foodName,
        meal_type: mealType,
        calories: Number(calories) || 0,
        protein_g: Number(protein) || 0,
        carbs_g: Number(carbs) || 0,
        fat_g: Number(fat) || 0,
      });
      setAddMealModal(false);
      setFoodName('');
      loadNutrition();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddWater = async (amount: number) => {
    if (!data) return;
    const current = data.day.water_consumed_ml || 0;
    const updated = current + amount;
    try {
      await api.updateWater('today', updated);
      loadNutrition();
    } catch (err) {
      console.error(err);
    }
  };

  const mealCategories: ('BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK')[] = [
    'BREAKFAST',
    'LUNCH',
    'DINNER',
    'SNACK',
  ];

  const categoryTitles = {
    BREAKFAST: 'Breakfast',
    LUNCH: 'Lunch',
    DINNER: 'Dinner',
    SNACK: 'Snacks & Fuel',
  };

  const duration = pacing?.duration_days || 60;
  const mode = (pacing?.mode || 'CUT') as JourneyMode;
  const modeLabel = pacing?.mode_label || 'Nutrition';
  const targetKcal = data?.targets?.daily_calories || 2160;
  const targetProtein = data?.targets?.protein_g || 150;
  const adjustmentRows = getAdjustmentProtocol(mode);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Nutrition & Macro Tracking</h1>
          <p className={styles.subtitle}>
            Maintain optimal caloric and macronutrient fuel for muscle recovery and performance.
          </p>
        </div>

        <Button variant="primary" onClick={() => setAddMealModal(true)}>
          <Plus size={16} />
          <span>Log Food</span>
        </Button>
      </div>

      {/* Macro Rings Summary Card */}
      <Card elevated className={styles.macroCard}>
        <div className={styles.macroRow}>
          <MacroRing
            label="Calories"
            current={data?.day.total_calories || 0}
            target={targetKcal}
            unit=" kcal"
            color="#10B981"
            size={135}
            strokeWidth={11}
          />
          <MacroRing
            label="Protein"
            current={data?.day.total_protein || 0}
            target={targetProtein}
            unit="g"
            color="#06B6D4"
            size={120}
            strokeWidth={10}
          />
          <MacroRing
            label="Carbs"
            current={data?.day.total_carbs || 0}
            target={data?.targets.carbs_g || 280}
            unit="g"
            color="#F59E0B"
            size={120}
            strokeWidth={10}
          />
          <MacroRing
            label="Fat"
            current={data?.day.total_fat || 0}
            target={data?.targets.fat_g || 75}
            unit="g"
            color="#8B5CF6"
            size={120}
            strokeWidth={10}
          />
        </div>
      </Card>

      {/* Water Hydration Tracker */}
      <Card className={styles.hydrationCard}>
        <div className={styles.hydrationLeft}>
          <div className={styles.hydrationIconWrap}>
            <Droplets size={26} color="var(--color-blue)" />
          </div>
          <div>
            <h3 className={styles.hydrationTitle}>Daily Hydration</h3>
            <div className={styles.hydrationTarget}>
              Target: {(data?.targets.water_ml || 3200) / 1000}L per day
            </div>
          </div>
        </div>

        <div className={styles.hydrationRight}>
          <div className={styles.hydrationValueWrap}>
            <div className={styles.hydrationValue}>
              {((data?.day.water_consumed_ml || 0) / 1000).toFixed(2)} L
            </div>
            <div className={styles.hydrationLabel}>Logged Today</div>
          </div>

          <div className={styles.hydrationButtons}>
            <Button size="sm" variant="secondary" onClick={() => handleAddWater(250)}>
              +250ml (Cup)
            </Button>
            <Button size="sm" variant="secondary" onClick={() => handleAddWater(500)}>
              +500ml (Bottle)
            </Button>
          </div>
        </div>
      </Card>

      {/* Daily Meals Breakdown */}
      <div className={styles.mealsList}>
        {mealCategories.map((cat) => {
          const categoryMeals = data?.day.meals.filter((m) => m.meal_type === cat) || [];
          const catCalories = categoryMeals.reduce((acc, m) => acc + m.calories, 0);

          return (
            <Card key={cat}>
              <div className={styles.mealCardHeader}>
                <div className={styles.mealCardHeaderLeft}>
                  <h3 className={styles.mealCardTitle}>{categoryTitles[cat]}</h3>
                  <Badge variant="emerald">{catCalories} kcal</Badge>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setMealType(cat);
                    setAddMealModal(true);
                  }}
                >
                  <Plus size={14} /> Add Item
                </Button>
              </div>

              {categoryMeals.length === 0 ? (
                <p className={styles.mealEmpty}>No food items logged for this meal yet.</p>
              ) : (
                <div className={styles.mealItemsList}>
                  {categoryMeals.map((meal) => (
                    <div key={meal.id} className={styles.mealItem}>
                      <div>
                        <div className={styles.mealItemName}>{meal.name}</div>
                        <div className={styles.mealItemMacros}>
                          <span>P: <strong className={styles.mealItemMacroProtein}>{meal.protein_g}g</strong></span>
                          <span>C: <strong className={styles.mealItemMacroCarbs}>{meal.carbs_g}g</strong></span>
                          <span>F: <strong className={styles.mealItemMacroFat}>{meal.fat_g}g</strong></span>
                        </div>
                      </div>

                      <div className={styles.mealItemCalories}>
                        {meal.calories} <span className={styles.mealItemCaloriesUnit}>kcal</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Diet Blueprint — reference plan from the user's own nutrition workbook */}
      <div>
        <div className={styles.blueprintHeader}>
          <Sparkles size={20} color="var(--color-primary)" />
          <h2 className={styles.blueprintTitle}>{duration}-Day {modeLabel} Blueprint</h2>
        </div>
        <p className={styles.blueprintIntro}>
          Two fixed reference meal frameworks from your nutrition plan. Your live computed target today is ~{targetKcal.toLocaleString()} kcal, {targetProtein}g protein — use these as fueling templates and scale carbohydrate portions (rotis, rice, oats) up or down to bridge any gap to that target.
        </p>

        <Card className={styles.blueprintCard}>
          <div className={styles.blueprintCardHeader}>
            <h3 className={styles.blueprintCardTitle}>Option A: High-Volume Training Day Fueling</h3>
            <Badge variant="emerald">{optionATotal.calories.toLocaleString()} kcal &middot; {optionATotal.protein}g protein</Badge>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th className={styles.th}>Meal Window</th><th className={styles.th}>Food &amp; Recipe</th><th className={styles.th}>Portion</th><th className={styles.th}>Kcal</th><th className={styles.th}>P</th><th className={styles.th}>C</th><th className={styles.th}>F</th></tr></thead>
              <tbody>
                {optionA.map((row, i) => (
                  <tr key={i}>
                    <td className={`${styles.td} ${styles.tdStrong}`}>{row[0]}</td>
                    <td className={styles.td}>{row[1]}</td>
                    <td className={`${styles.td} ${styles.tdMuted}`}>{row[2]}</td>
                    <td className={styles.td}>{row[3]}</td>
                    <td className={styles.td}>{row[4]}g</td>
                    <td className={styles.td}>{row[5]}g</td>
                    <td className={styles.td}>{row[6]}g</td>
                  </tr>
                ))}
                <tr>
                  <td className={`${styles.td} ${styles.tdTotal}`}>Reference Total</td>
                  <td className={styles.td} colSpan={2} />
                  <td className={`${styles.td} ${styles.tdTotal} ${styles.tdTotalPrimary}`}>{optionATotal.calories.toLocaleString()}</td>
                  <td className={`${styles.td} ${styles.tdTotal}`}>{optionATotal.protein}g</td>
                  <td className={`${styles.td} ${styles.tdTotal}`}>{optionATotal.carbs}g</td>
                  <td className={`${styles.td} ${styles.tdTotal}`}>{optionATotal.fat}g</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <div className={styles.blueprintCardHeader}>
            <h3 className={styles.blueprintCardTitle}>Option B: Lower-Activity &amp; Budget Fueling</h3>
            <Badge variant="cyan">{optionBTotal.calories.toLocaleString()} kcal &middot; {optionBTotal.protein}g protein</Badge>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th className={styles.th}>Meal Window</th><th className={styles.th}>Food &amp; Recipe</th><th className={styles.th}>Portion</th><th className={styles.th}>Kcal</th><th className={styles.th}>P</th><th className={styles.th}>C</th><th className={styles.th}>F</th></tr></thead>
              <tbody>
                {optionB.map((row, i) => (
                  <tr key={i}>
                    <td className={`${styles.td} ${styles.tdStrong}`}>{row[0]}</td>
                    <td className={styles.td}>{row[1]}</td>
                    <td className={`${styles.td} ${styles.tdMuted}`}>{row[2]}</td>
                    <td className={styles.td}>{row[3]}</td>
                    <td className={styles.td}>{row[4]}g</td>
                    <td className={styles.td}>{row[5]}g</td>
                    <td className={styles.td}>{row[6]}g</td>
                  </tr>
                ))}
                <tr>
                  <td className={`${styles.td} ${styles.tdTotal}`}>Reference Total</td>
                  <td className={styles.td} colSpan={2} />
                  <td className={`${styles.td} ${styles.tdTotal} ${styles.tdTotalCyan}`}>{optionBTotal.calories.toLocaleString()}</td>
                  <td className={`${styles.td} ${styles.tdTotal}`}>{optionBTotal.protein}g</td>
                  <td className={`${styles.td} ${styles.tdTotal}`}>{optionBTotal.carbs}g</td>
                  <td className={`${styles.td} ${styles.tdTotal}`}>{optionBTotal.fat}g</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* High-protein budget food staples cheat sheet */}
      <div>
        <h2 className={styles.sectionTitle}>High-Protein Budget Indian Food Staples</h2>
        <Card>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th className={styles.th}>Food Staple</th><th className={styles.th}>Typical Serving</th><th className={styles.th}>Protein</th><th className={styles.th}>Calories</th><th className={styles.th}>Efficiency Tier &amp; Prep Cue</th></tr></thead>
              <tbody>
                {staples.map((row) => (
                  <tr key={row[0]}>
                    <td className={`${styles.td} ${styles.tdStrong}`}>{row[0]}</td>
                    <td className={styles.td}>{row[1]}</td>
                    <td className={`${styles.td} ${styles.tdProtein}`}>{row[2]}</td>
                    <td className={styles.td}>{row[3]}</td>
                    <td className={`${styles.td} ${styles.tdMuted}`}>{row[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* 2-3 week calorie & metabolic adjustment protocol */}
      <div>
        <h2 className={styles.protocolTitle}>
          The 2–3 Week Calorie &amp; Metabolic Adjustment Protocol — {pacing?.mode_label || 'Pacing Rules'}
        </h2>
        <Card>
          <div className={styles.protocolGrid}>
            {adjustmentRows.map((row) => (
              <div key={row[0]} className={styles.protocolRow}>
                <strong>{row[0]}</strong>
                <span className={styles.protocolRowMuted}>{row[1]}</span>
                <span className={styles.protocolRowMuted}>{row[2]}</span>
                <span>{row[3]}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Log Food Modal */}
      <Modal isOpen={addMealModal} onClose={() => setAddMealModal(false)} title="Log Meal Entry">
        <div className={styles.formGroup}>
          <div>
            <label className={styles.formLabel}>Meal Time</label>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value as any)}
              className={styles.formSelect}
            >
              <option value="BREAKFAST">Breakfast</option>
              <option value="LUNCH">Lunch</option>
              <option value="DINNER">Dinner</option>
              <option value="SNACK">Snack / Pre-Workout</option>
            </select>
          </div>

          <div>
            <label className={styles.formLabel}>Food / Meal Name</label>
            <input
              type="text"
              placeholder="e.g. Grilled Salmon & Sweet Potato"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGrid2}>
            <div>
              <label className={styles.formLabel}>Calories (kcal)</label>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(parseFloat(e.target.value) || 0)}
                className={styles.formInput}
              />
            </div>
            <div>
              <label className={styles.formLabel}>Protein (g)</label>
              <input
                type="number"
                value={protein}
                onChange={(e) => setProtein(parseFloat(e.target.value) || 0)}
                className={styles.formInput}
              />
            </div>
          </div>

          <div className={styles.formGrid2}>
            <div>
              <label className={styles.formLabel}>Carbs (g)</label>
              <input
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(parseFloat(e.target.value) || 0)}
                className={styles.formInput}
              />
            </div>
            <div>
              <label className={styles.formLabel}>Fat (g)</label>
              <input
                type="number"
                value={fat}
                onChange={(e) => setFat(parseFloat(e.target.value) || 0)}
                className={styles.formInput}
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <Button variant="secondary" onClick={() => setAddMealModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddMeal} disabled={saving}>
              {saving ? 'Adding...' : 'Log Food'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
