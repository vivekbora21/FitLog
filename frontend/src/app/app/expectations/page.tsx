const benchmarks=[
  ['Body Weight','77.76 kg','73.5–74.5 kg (Target Range)','-3.3 to -4.3 kg','Moderate caloric deficit (0.4–0.6 kg/wk) preserving skeletal muscle','High'],
  ['Estimated Body Fat %','~22.0%–24.0% (Baseline Estimate)','~17.5%–19.5% (reassess via weight trend, waist and photos)','-3.5% to -5.0% (Estimated)','Targeted adipose mobilization fueled by Zone 2 cardio & caloric deficit','Estimated Range'],
  ['Skeletal Muscle Mass','Baseline (~33.0 kg)','33.0–33.5 kg','Maintained / +0.5 kg','High-protein stimulus (165g) + progressive overload (RPE 8–9)','High'],
  ['Waist Circumference (Navel)','93.0 cm','~87.5–88.5 cm','-4.5 to -5.5 cm','Visceral and deep subcutaneous abdominal fat layer shrinkage','Very High'],
  ['Chest Circumference','101.0 cm','~100.5–101.5 cm','0 to -0.5 cm','Lat and upper clavicular pec growth offset fat loss','High'],
  ['Arm Circumference (Relaxed)','31.0 cm','~31.0–31.5 cm','Maintained / +0.5 cm','Direct bicep and triceps hypertrophy fills out the skin sleeve tightly','High'],
  ['Resting Metabolic Rate (BMR)','1,718 kcal / day','1,680–1,700 kcal / day','Minimal drop (-25 kcal)','Muscle retention prevents adaptive metabolic thermogenesis crash','High'],
  ['Daily Energy & Vitality','Moderate / Afternoon Slumps','High, Stable & Alert','Major Positive Shift','Balanced glycemic control, eliminated sugar spikes, restorative sleep','Very High'],
] as const;
const timeline=[
  ['Face & Jawline','Reduced water retention & facial puffiness','Cheekbones begin to define; neck feels leaner','Noticeably sharp jawline contour in photos','Chiselled facial structure; lean appearance'],
  ['Upper Torso & Shoulders','Normal gym pump after sessions','Clavicles become prominent; upper chest tighter','Lateral delt ‘cap’ appears; lats flare visibly','Distinct athletic V-taper from broad shoulders to narrow waist'],
  ['Abdomen & Midsection','Belly bloat disappears; digestion feels light','Upper abdominal lines emerge under good lighting','Lower belly pouch shrinks; transverse abs engage','Firm, flat midsection with clear upper 4-pack definition'],
  ['Clothing & Belt Fit','Waistbands feel slightly roomier','Drop 1 notch on leather belt comfortably','T-shirts drape broader across shoulders and chest','Drop 1 to 1.5 full pant sizes; athletic silhouette'],
  ['Lifting Strength & Power','Establishing neuromuscular coordination','Target weights increase by 2.5–5 kg on anchors','Deadlift and squat numbers surpass baseline','All 12 strength anchors at 60-day all-time personal records'],
] as const;
const laws=[
  ['1. The Scale Lie Law','Muscle tissue is 18% denser than adipose fat. You can look radically leaner while the scale drops slowly.','Freaking out when the scale stalls for 3 days due to water/sodium, then crash dieting.','Trust the 7-day rolling average and weekly tape measurements over single-day spikes.'],
  ['2. Mechanical Tension Law','Heavy resistance training signals the brain that muscle tissue is essential for survival.','Switching to ‘light weights and high reps’ to ‘tone’ or burn fat — this causes muscle loss.','Keep pushing heavy compound anchors at RPE 8–9; fight for every single rep.'],
  ['3. Leucine Trigger Law','Muscle protein synthesis requires ~2.7–3.0g leucine per feeding to trigger the mTOR pathway.','Eating small, incomplete protein snacks that fail to trigger muscle repair.','Anchor every meal with 25–40g complete protein (eggs, chicken, soya, paneer, dal).'],
  ['4. Sleep Anabolism Law','Over 70% of nightly growth hormone (HGH) and testosterone release occurs in slow-wave sleep.','Staying up late browsing phones; sacrificing 2 hours of sleep to squeeze in morning cardio.','Protect 7.5–8.5 hours in a cool, dark room. Sleep is when fat burns and muscle repairs.'],
] as const;
const coreGoals=[
  ['1. Waist Circumference','93.0 cm (Navel)','Reduce waist from 93 cm (~87.5–88.5 cm)','Sustainable ~500 kcal deficit + 8–10k daily steps','Weekly Sunday tape check (relaxed navel)'],
  ['2. Body Weight Trend','77.76 kg (Day 1)','73.5–74.5 kg (Target Range)','Gradual 0.4–0.6 kg/wk loss rate; preserve muscle','7-day rolling average morning weigh-in'],
  ['3. Strength on Key Lifts','Bench 50k • DL 55k • Squat 140k • Lat 55k','Bench ~57.5kg • DL ~70kg • Squat ~160kg • Lat ~62.5kg','Double progression: add 1.25–2.5kg when top reps are clean','Gym performance in the Daily Workout Log'],
  ['4. Muscle Circumferences','Chest: 101 cm • Relaxed Biceps: 31 cm','Maintain or increase muscle measurements','165g daily protein anchor + progressive tension','15-day tape measurements & photo reviews'],
  ['5. Athletic Conditioning','Return-to-training baseline','High stamina, stable energy, improved V-taper','90–120m cardio early progressing to 150m+','Daily Log consistency & recovery ratings'],
] as const;
const th={fontSize:'.7rem',color:'var(--text-muted)',textTransform:'uppercase' as const,letterSpacing:'.06em',textAlign:'left' as const,padding:'.5rem .6rem'};
const td={padding:'.65rem .6rem',verticalAlign:'top' as const,fontSize:'.85rem',borderTop:'1px solid var(--border-subtle)'};
export default function ExpectationsPage(){return <div style={{display:'grid',gap:'1.75rem'}}>
  <header><div style={{fontSize:'.72rem',fontWeight:800,letterSpacing:'.1em',color:'var(--color-primary)'}}>60-DAY TRANSFORMATION PHYSICAL EXPECTATIONS & RECOMPOSITION BLUEPRINT</div><h1 style={{margin:'.3rem 0'}}>Realistic milestones, not a promise.</h1><p style={{color:'var(--text-secondary)'}}>What 77.76 kg &rarr; ~73.5&ndash;74.5 kg looks and feels like, read alongside weekly trends, tape measurements and photos.</p></header>

  <section><h2 style={{fontSize:'1.05rem'}}>1. Metric &amp; body composition benchmarks (Day 1 vs. Day 60)</h2>
    <div style={{overflowX:'auto',border:'1px solid var(--border-subtle)',marginTop:'.6rem'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={th}>Metric</th><th style={th}>Day 1 Baseline</th><th style={th}>Day 60 Target</th><th style={th}>Expected Change</th><th style={th}>Primary Mechanism</th><th style={th}>Confidence</th></tr></thead>
    <tbody>{benchmarks.map(([metric,baseline,target,change,mechanism,confidence])=><tr key={metric}><td style={{...td,fontWeight:700}}>{metric}</td><td style={td}>{baseline}</td><td style={{...td,color:'var(--color-primary)',fontWeight:700}}>{target}</td><td style={td}>{change}</td><td style={{...td,color:'var(--text-secondary)'}}>{mechanism}</td><td style={td}>{confidence}</td></tr>)}</tbody></table></div>
  </section>

  <section><h2 style={{fontSize:'1.05rem'}}>2. Visual &amp; physiological transformation timeline (weeks 1 to 8)</h2>
    <div style={{overflowX:'auto',border:'1px solid var(--border-subtle)',marginTop:'.6rem'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={th}>Body Area</th><th style={th}>Weeks 1&ndash;2</th><th style={th}>Weeks 3&ndash;4</th><th style={th}>Weeks 5&ndash;6</th><th style={th}>Day 60 (Final)</th></tr></thead>
    <tbody>{timeline.map(([area,w12,w34,w56,day60])=><tr key={area}><td style={{...td,fontWeight:700}}>{area}</td><td style={td}>{w12}</td><td style={td}>{w34}</td><td style={td}>{w56}</td><td style={{...td,color:'var(--color-primary)',fontWeight:600}}>{day60}</td></tr>)}</tbody></table></div>
  </section>

  <section><h2 style={{fontSize:'1.05rem'}}>3. The four scientific laws of body recomposition</h2>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'.75rem',marginTop:'.6rem'}}>{laws.map(([title,foundation,pitfall,habit])=><div key={title} style={{border:'1px solid var(--border-subtle)',background:'var(--bg-surface)',padding:'1rem'}}><strong style={{color:'var(--color-primary)'}}>{title}</strong><p style={{color:'var(--text-secondary)',fontSize:'.85rem',lineHeight:1.6,marginTop:'.5rem'}}>{foundation}</p><p style={{fontSize:'.8rem',color:'#D97706',marginTop:'.5rem'}}><strong>Pitfall: </strong>{pitfall}</p><p style={{fontSize:'.8rem',marginTop:'.4rem'}}><strong>Winning habit: </strong>{habit}</p></div>)}</div>
  </section>

  <section><h2 style={{fontSize:'1.05rem'}}>4. Core transformation goals &amp; practical strength benchmarks</h2>
    <div style={{overflowX:'auto',border:'1px solid var(--border-subtle)',marginTop:'.6rem'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={th}>Core Goal</th><th style={th}>Starting Baseline</th><th style={th}>Day 60 Target</th><th style={th}>Progress Strategy</th><th style={th}>Assessment Method</th></tr></thead>
    <tbody>{coreGoals.map(([goal,baseline,target,strategy,assessment])=><tr key={goal}><td style={{...td,fontWeight:700}}>{goal}</td><td style={td}>{baseline}</td><td style={{...td,color:'var(--color-primary)',fontWeight:600}}>{target}</td><td style={td}>{strategy}</td><td style={{...td,color:'var(--text-secondary)'}}>{assessment}</td></tr>)}</tbody></table></div>
  </section>
</div>}
