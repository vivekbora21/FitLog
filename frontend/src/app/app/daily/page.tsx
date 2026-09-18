'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function DailyLogPage() {
  const router = useRouter();
  const [nutrition, setNutrition] = useState<any>(null); const [stats, setStats] = useState<any>(null);
  const [water, setWater] = useState(''); const [cardio, setCardio] = useState(''); const [saving, setSaving] = useState(false);
  useEffect(()=>{Promise.all([api.getNutrition(),api.getDashboardStats()]).then(([n,s])=>{setNutrition(n);setStats(s);setWater(String(n.day.water_consumed_ml || 0));}).catch(console.error)},[]);
  async function save(){setSaving(true);try { await api.updateWater('today', Number(water)); if(Number(cardio)>0) await api.logCardio({date:new Date().toISOString().slice(0,10), modality:'TREADMILL', duration_minutes:Number(cardio), intensity:'Zone 2'}); const n=await api.getNutrition();setNutrition(n);setCardio('');} finally{setSaving(false)}}
  return <div style={{display:'grid',gap:'1.25rem'}}><header><div style={{fontSize:'.72rem',fontWeight:800,letterSpacing:'.1em',color:'var(--color-primary)'}}>DAILY LOG · 1–2 MINUTES</div><h1 style={{margin:'.3rem 0'}}>Record the essentials</h1><p style={{color:'var(--text-secondary)'}}>Weight and measurements live in Progress; meals in Nutrition. This view keeps the day connected.</p></header>
    <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'.75rem'}}>{[['Morning weight',stats?.journey?.current_weight ? `${stats.journey.current_weight} kg`:'Not logged','/app/progress'],['Calories',`${nutrition?.day?.total_calories || 0} / ${nutrition?.targets?.daily_calories || 0}`,'/app/nutrition'],['Protein',`${nutrition?.day?.total_protein || 0} / ${nutrition?.targets?.protein_g || 0} g`,'/app/nutrition'],['Workout',stats?.workouts_this_week ? `${stats.workouts_this_week} this week`:'Not completed','/app/workouts/active']].map(([a,b,c])=><div key={a} onClick={()=>router.push(c)} style={{cursor:'pointer',padding:'1rem',border:'1px solid var(--border-subtle)',background:'var(--bg-surface)'}}><small style={{color:'var(--text-secondary)'}}>{a}</small><strong style={{display:'block',fontSize:'1.2rem',marginTop:'.3rem'}}>{b}</strong></div>)}</section>
    <section style={{padding:'1.25rem',background:'var(--bg-surface)',border:'1px solid var(--border-subtle)'}}><h2 style={{fontSize:'1.05rem'}}>Quick cardio & hydration</h2><p style={{color:'var(--text-secondary)',fontSize:'.82rem',margin:'.35rem 0 0'}}>Return-to-training target (Weeks 1&ndash;2): 90&ndash;120 min/wk. Build gradually; do not force it if recovery is poor.</p><div style={{display:'flex',gap:'.75rem',flexWrap:'wrap',marginTop:'1rem'}}><label>Water (ml)<input value={water} onChange={e=>setWater(e.target.value)} type="number" style={{display:'block',marginTop:'.3rem'}}/></label><label>Cardio minutes<input value={cardio} onChange={e=>setCardio(e.target.value)} type="number" placeholder="Optional" style={{display:'block',marginTop:'.3rem'}}/></label><button onClick={save} disabled={saving} style={{alignSelf:'end'}}> {saving?'Saving…':'Save daily log'} </button></div></section>
  </div>;
}
