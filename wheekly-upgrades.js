import React, { useState, useEffect } from 'react';
import { calculateMiteSchedule, showWheeklyToast } from './wheekly-upgrades';

export function MangeMiteTracker({ piggyName = 'Stilton', currentWeight = 897 }) {
  const todayISO = new Date().toISOString().split('T')[0];
  const [mode, setMode] = useState('active_7');
  const [dose1Date, setDose1Date] = useState(todayISO);
  const [applyToHerd, setApplyToHerd] = useState(true);
  const [schedule, setSchedule] = useState(() => calculateMiteSchedule(todayISO, 'active_7'));

  useEffect(() => {
    setSchedule(calculateMiteSchedule(dose1Date, mode));
  }, [dose1Date, mode]);

  const handleSaveSchedule = () => {
    localStorage.setItem(`wheekly_mite_${piggyName.toLowerCase()}`, JSON.stringify(schedule));
    if (applyToHerd) {
      localStorage.setItem('wheekly_mite_stilton', JSON.stringify(schedule));
      localStorage.setItem('wheekly_mite_gorgonzola', JSON.stringify(schedule));
    }
    showWheeklyToast(
      applyToHerd
        ? `🔬 Mite schedule saved for entire herd! Next dose: ${schedule.nextDueDateUK}`
        : `🔬 Mite schedule saved for ${piggyName}! Next dose: ${schedule.nextDueDateUK}`
    );
  };

  return (
    <div style={{
      background: '#faf6f0',
      border: '1px solid #e6dfd5',
      borderRadius: '14px',
      padding: '16px',
      marginTop: '14px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <h4 style={{ margin: 0, fontSize: '15px', color: '#1f2937' }}>
          🔬 Mange Mite & Parasite Treatment
        </h4>
        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          padding: '3px 8px',
          borderRadius: '999px',
          background: schedule.isActiveCourse ? '#fee2e2' : '#dcfce7',
          color: schedule.isActiveCourse ? '#991b1b' : '#166534'
        }}>
          {schedule.isActiveCourse ? '3-DOSE COURSE' : 'PREVENTION'}
        </span>
      </div>

      <p style={{ margin: '0 0 12px', fontSize: '12.5px', color: '#6b7280' }}>
        Auto-predicts follow-up doses to break the 7–10 day mite egg hatching cycle.
      </p>

      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
        Treatment Mode
      </label>
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value)}
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: '8px',
          border: '1px solid #d1d5db',
          marginBottom: '10px',
          background: '#ffffff'
        }}
      >
        <option value="active_7">🚨 Active Infestation (Every 7 Days × 3 Doses)</option>
        <option value="active_10">🚨 Active Infestation (Every 10 Days × 3 Doses)</option>
        <option value="prev_28">🛡️ Monthly Prevention (Every 28 Days)</option>
        <option value="prev_90">🛡️ Quarterly Prevention (Every 90 Days)</option>
      </select>

      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
        Dose 1 Date
      </label>
      <input
        type="date"
        value={dose1Date}
        onChange={(e) => setDose1Date(e.target.value)}
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: '8px',
          border: '1px solid #d1d5db',
          marginBottom: '12px',
          boxSizing: 'border-box',
          background: '#ffffff'
        }}
      />

      <div style={{
        background: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: '10px',
        padding: '12px',
        marginBottom: '10px'
      }}>
        <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#166534', marginBottom: '6px' }}>
          📅 PREDICTED DOSING TIMELINE
        </div>
        {schedule.doses.map((d, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
            <span>{idx === 0 ? '✅' : '⏳'} <strong>{d.step}:</strong></span>
            <span><strong>{d.ukDate}</strong> <em>({d.status})</em></span>
          </div>
        ))}
      </div>

      <div style={{
        background: '#fffbeb',
        border: '1px solid #fde68a',
        borderRadius: '8px',
        padding: '9px 10px',
        fontSize: '11.5px',
        color: '#92400e',
        marginBottom: '10px'
      }}>
        ⚖️ <strong>Weight Check ({currentWeight} g):</strong> {currentWeight >= 800
          ? 'Over 800g threshold (eligible for standard adult pipette strength, e.g., Xeno 450 — confirm with Exotic Vet).'
          : 'Under 800g threshold (requires mini pipette strength, e.g., Xeno 50 Mini — confirm with Exotic Vet).'}
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', marginBottom: '12px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={applyToHerd}
          onChange={(e) => setApplyToHerd(e.target.checked)}
        />
        Apply schedule to all bonded cage-mates (Stilton & Gorgonzola)
      </label>

      <button
        onClick={handleSaveSchedule}
        style={{
          width: '100%',
          background: '#2e7d5b',
          color: '#ffffff',
          border: 'none',
          padding: '11px',
          borderRadius: '8px',
          fontWeight: 700,
          cursor: 'pointer'
        }}
      >
        Save Mite Treatment Schedule
      </button>
    </div>
  );
          }
