'use client';

import React, { useState, useEffect } from 'react';
import { Utensils, Plus, Droplets, Trash2, Calendar, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { NutritionDay, MacroTarget, MealEntry } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { MacroRing } from '@/components/MacroRing';

const optionA = [
  ['Meal 1: Pre-Workout', 'Black Coffee + Soaked Almonds + Banana', '1 mug coffee + 6 almonds + 1 banana', 150, 3, 28, 4],
  ['Meal 2: Breakfast', 'Rolled Oats with Toned Milk & Cinnamon', '65g oats + 200ml toned milk', 340, 14, 54, 6],
  ['Meal 2: Breakfast', 'Whole Boiled Eggs + Steamed Egg Whites', '2 whole eggs + 3 egg whites', 230, 23, 2, 11],
  ['Meal 3: Mid-Morning', 'Green Tea & Roasted Chana (Phutana)', '1 cup tea + 35g roasted chana', 125, 8, 19, 2],
  ['Meal 4: Lunch', 'Soya Chunks Bhurji / Chicken Curry + Dal + Rotis', '50g soya (or 120g chicken) + dal + 2 rotis + salad', 630, 50, 82, 8],
  ['Meal 5: Evening Snack', 'Homemade Low-Fat Curd (Dahi) + Roasted Chana', '200g dahi + 35g roasted chana', 240, 17, 27, 6],
  ['Meal 6: Dinner', 'Pan-Seared Chicken Breast / Paneer + Rice + Sabzi', '150g chicken (or 130g paneer) + 160g rice + sabzi', 445, 50, 52, 6],
] as const;
const optionB = [
  ['Meal 1: Pre-Workout', 'Black Coffee + 5 Soaked Almonds', '1 mug coffee + 5 almonds', 40, 1, 1, 3],
  ['Meal 2: Breakfast', 'Rolled Oats with Toned Milk & Boiled Eggs', '55g oats + 180ml milk + 2 whole eggs', 450, 26, 49, 16],
  ['Meal 3: Mid-Morning', 'Fresh Ripe Banana + Green Tea', '1 medium banana + 1 cup green tea', 100, 1, 25, 0],
  ['Meal 4: Lunch', 'Spiced Chicken Breast Curry / Soya + Dal + Rotis', '65g chicken (or 45g soya) + dal + 2 rotis + salad', 515, 40, 77, 6],
  ['Meal 5: Evening Snack', 'Dry Roasted Chana + Low-Fat Dahi', '45g roasted chana + 180g homemade curd', 280, 19, 33, 6],
  ['Meal 6: Dinner', 'Chicken & Egg / Soya Bhurji + Rice + Sabzi', '65g chicken + egg white (or soya + paneer) + 200g rice + sabzi', 535, 44, 70, 10],
] as const;
const staples = [
  ['Soya Chunks (Dry)', '40g dry weighed', '21g', 138, 'Tier 1: 52% protein (soak & squeeze)'],
  ['Whole Farm Eggs', '3 large eggs', '19g', 210, 'Tier 1: bioavailable complete protein'],
  ['Skinless Chicken Breast', '100g raw weighed', '31g', 120, 'Tier 1: high leucine lean muscle anchor'],
  ['Yellow Moong / Masoor Dal', '60g raw (1 cup cooked)', '14g', 205, 'Tier 2: essential daily amino pulse'],
  ['Homemade Low-Fat Dahi', '200g set curd', '9g', 120, 'Tier 2: slow-release casein & gut probiotic'],
  ['Roasted Chana (Bengal Gram)', '50g dry weighed', '11g', 180, 'Tier 2: low-GI high-fiber portable snack'],
  ['Rolled Oats (Plain)', '60g dry weighed', '8g', 230, 'Tier 3: beta-glucan heart & sustained energy'],
] as const;
const adjustmentProtocol = [
  ['Week 1–2 Baseline Check', 'Drop of 1.2–2.0 kg in first 10 days', 'Expected initial glycogen, sodium, and water depletion — not all fat loss.', 'Hold calories steady. Do NOT increase food yet; allow water balance to normalize.'],
  ['Week 3 Assessment: Too Slow', 'Weight loss < 0.30 kg/week for 2 weeks', 'Metabolic adaptation, hidden cooking oils, or decreased daily steps.', 'Drop 150 kcal/day (cut 1 roti or 40g rice), or add 20 min cardio/week.'],
  ['Week 3 Assessment: On Target', 'Weight loss 0.40–0.60 kg/week', 'Optimal sweet spot: maximal fat oxidation with zero muscle wasting.', 'Change nothing — maintain identical nutrition, lifting intensity and cardio.'],
  ['Week 3 Assessment: Too Fast', 'Weight loss > 0.80 kg/week for 2 weeks', 'Excessive deficit risking muscle loss, strength decline, metabolic crash.', 'Increase daily intake by +150 kcal (add 35g oats or 1 banana + 100g curd).'],
] as const;
const th2: React.CSSProperties = { fontSize: '.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', textAlign: 'left', padding: '.5rem .5rem' };
const td2: React.CSSProperties = { padding: '.55rem .5rem', fontSize: '.82rem', borderTop: '1px solid var(--border-subtle)', verticalAlign: 'top' };

export default function NutritionPage() {
  const [data, setData] = useState<{ day: NutritionDay; targets: MacroTarget } | null>(null);
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
      const res = await api.getNutrition('today');
      setData(res);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem' }}>Nutrition & Macro Tracking</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '4px' }}>
            Maintain optimal caloric and macronutrient fuel for muscle recovery and performance.
          </p>
        </div>

        <Button variant="primary" onClick={() => setAddMealModal(true)}>
          <Plus size={16} />
          <span>Log Food</span>
        </Button>
      </div>

      {/* Macro Rings Summary Card */}
      <Card elevated style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
          <MacroRing
            label="Calories"
            current={data?.day.total_calories || 0}
            target={data?.targets.daily_calories || 2600}
            unit=" kcal"
            color="#10B981"
            size={135}
            strokeWidth={11}
          />
          <MacroRing
            label="Protein"
            current={data?.day.total_protein || 0}
            target={data?.targets.protein_g || 180}
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
      <Card style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Droplets size={26} color="var(--color-blue)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem' }}>Daily Hydration</h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Target: {(data?.targets.water_ml || 3200) / 1000}L per day
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38BDF8', fontFamily: 'Outfit, sans-serif' }}>
              {((data?.day.water_consumed_ml || 0) / 1000).toFixed(2)} L
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Logged Today</div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {mealCategories.map((cat) => {
          const categoryMeals = data?.day.meals.filter((m) => m.meal_type === cat) || [];
          const catCalories = categoryMeals.reduce((acc, m) => acc + m.calories, 0);

          return (
            <Card key={cat}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ fontSize: '1.15rem' }}>{categoryTitles[cat]}</h3>
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
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  No food items logged for this meal yet.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {categoryMeals.map((meal) => (
                    <div
                      key={meal.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        background: 'var(--bg-surface-elevated)',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{meal.name}</div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          <span>P: <strong style={{ color: 'var(--color-cyan)' }}>{meal.protein_g}g</strong></span>
                          <span>C: <strong style={{ color: 'var(--color-amber)' }}>{meal.carbs_g}g</strong></span>
                          <span>F: <strong style={{ color: 'var(--color-violet)' }}>{meal.fat_g}g</strong></span>
                        </div>
                      </div>

                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'Outfit, sans-serif' }}>
                        {meal.calories} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>kcal</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* 60-Day Diet Blueprint (reference plan) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <Sparkles size={20} color="var(--color-primary)" />
          <h2 style={{ fontSize: '1.35rem' }}>60-Day Diet Blueprint</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '.88rem', marginTop: '-.5rem', marginBottom: '1rem' }}>
          Two prescribed Indian meal plans — pick Option A on training-heavy days, Option B on tighter-budget or lower-activity days.
        </p>

        <Card style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
            <h3 style={{ fontSize: '1.05rem' }}>Option A: Recomposition &amp; High-Volume Training</h3>
            <Badge variant="emerald">2,160 kcal &middot; 165g protein</Badge>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={th2}>Meal Window</th><th style={th2}>Food &amp; Recipe</th><th style={th2}>Portion</th><th style={th2}>Kcal</th><th style={th2}>P</th><th style={th2}>C</th><th style={th2}>F</th></tr></thead>
              <tbody>
                {optionA.map((row, i) => (
                  <tr key={i}><td style={{ ...td2, fontWeight: 700 }}>{row[0]}</td><td style={td2}>{row[1]}</td><td style={{ ...td2, color: 'var(--text-secondary)' }}>{row[2]}</td><td style={td2}>{row[3]}</td><td style={td2}>{row[4]}g</td><td style={td2}>{row[5]}g</td><td style={td2}>{row[6]}g</td></tr>
                ))}
                <tr><td style={{ ...td2, fontWeight: 800 }}>Total</td><td style={td2} colSpan={2} /><td style={{ ...td2, fontWeight: 800, color: 'var(--color-primary)' }}>2,160</td><td style={{ ...td2, fontWeight: 800 }}>165g</td><td style={{ ...td2, fontWeight: 800 }}>264g</td><td style={{ ...td2, fontWeight: 800 }}>43g</td></tr>
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
            <h3 style={{ fontSize: '1.05rem' }}>Option B: Moderate Deficit &amp; Tight Budget</h3>
            <Badge variant="cyan">1,920 kcal &middot; 130g protein</Badge>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={th2}>Meal Window</th><th style={th2}>Food &amp; Recipe</th><th style={th2}>Portion</th><th style={th2}>Kcal</th><th style={th2}>P</th><th style={th2}>C</th><th style={th2}>F</th></tr></thead>
              <tbody>
                {optionB.map((row, i) => (
                  <tr key={i}><td style={{ ...td2, fontWeight: 700 }}>{row[0]}</td><td style={td2}>{row[1]}</td><td style={{ ...td2, color: 'var(--text-secondary)' }}>{row[2]}</td><td style={td2}>{row[3]}</td><td style={td2}>{row[4]}g</td><td style={td2}>{row[5]}g</td><td style={td2}>{row[6]}g</td></tr>
                ))}
                <tr><td style={{ ...td2, fontWeight: 800 }}>Total</td><td style={td2} colSpan={2} /><td style={{ ...td2, fontWeight: 800, color: 'var(--color-cyan)' }}>1,920</td><td style={{ ...td2, fontWeight: 800 }}>131g</td><td style={{ ...td2, fontWeight: 800 }}>255g</td><td style={{ ...td2, fontWeight: 800 }}>41g</td></tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* High-protein budget food staples cheat sheet */}
      <div>
        <h2 style={{ fontSize: '1.15rem', marginBottom: '.75rem' }}>High-Protein Budget Indian Food Staples</h2>
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={th2}>Food Staple</th><th style={th2}>Typical Serving</th><th style={th2}>Protein</th><th style={th2}>Calories</th><th style={th2}>Efficiency Tier &amp; Prep Cue</th></tr></thead>
              <tbody>
                {staples.map((row) => (
                  <tr key={row[0]}><td style={{ ...td2, fontWeight: 700 }}>{row[0]}</td><td style={td2}>{row[1]}</td><td style={{ ...td2, color: 'var(--color-primary)', fontWeight: 700 }}>{row[2]}</td><td style={td2}>{row[3]}</td><td style={{ ...td2, color: 'var(--text-secondary)' }}>{row[4]}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* 2-3 week calorie & metabolic adjustment protocol */}
      <div>
        <h2 style={{ fontSize: '1.15rem', marginBottom: '.75rem' }}>The 2–3 Week Calorie &amp; Metabolic Adjustment Protocol</h2>
        <Card>
          <div style={{ display: 'grid', gap: '.6rem' }}>
            {adjustmentProtocol.map((row) => (
              <div key={row[0]} style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 0.9fr) minmax(150px, 0.9fr) 1.3fr 1.3fr', gap: '.85rem', padding: '.7rem 0', borderTop: '1px solid var(--border-subtle)', fontSize: '.84rem' }}>
                <strong>{row[0]}</strong>
                <span style={{ color: 'var(--text-secondary)' }}>{row[1]}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{row[2]}</span>
                <span>{row[3]}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Log Food Modal */}
      <Modal isOpen={addMealModal} onClose={() => setAddMealModal(false)} title="Log Meal Entry">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Meal Time
            </label>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value as any)}
              style={{
                width: '100%',
                marginTop: '4px',
                padding: '8px 12px',
                background: '#FFFFFF',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            >
              <option value="BREAKFAST">Breakfast</option>
              <option value="LUNCH">Lunch</option>
              <option value="DINNER">Dinner</option>
              <option value="SNACK">Snack / Pre-Workout</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Food / Meal Name
            </label>
            <input
              type="text"
              placeholder="e.g. Grilled Salmon & Sweet Potato"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              style={{
                width: '100%',
                marginTop: '4px',
                padding: '8px 12px',
                background: '#FFFFFF',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Calories (kcal)
              </label>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(parseFloat(e.target.value) || 0)}
                style={{
                  width: '100%',
                  marginTop: '4px',
                  padding: '8px 12px',
                  background: '#FFFFFF',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Protein (g)
              </label>
              <input
                type="number"
                value={protein}
                onChange={(e) => setProtein(parseFloat(e.target.value) || 0)}
                style={{
                  width: '100%',
                  marginTop: '4px',
                  padding: '8px 12px',
                  background: '#FFFFFF',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Carbs (g)
              </label>
              <input
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(parseFloat(e.target.value) || 0)}
                style={{
                  width: '100%',
                  marginTop: '4px',
                  padding: '8px 12px',
                  background: '#FFFFFF',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Fat (g)
              </label>
              <input
                type="number"
                value={fat}
                onChange={(e) => setFat(parseFloat(e.target.value) || 0)}
                style={{
                  width: '100%',
                  marginTop: '4px',
                  padding: '8px 12px',
                  background: '#FFFFFF',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
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
