import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import './App.css';

// Membaca Environment Variables dengan aman
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL; 
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY; 
const ML_API_URL = import.meta.env.VITE_ML_API_URL;          

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TRACK_DETAILS = {
  AI: {
    name: 'Artificial Intelligence (AI)',
    icon: '🤖',
    color: '#6366f1',
    bgColor: '#ede9fe',
    borderColor: '#c4b5fd',
    textColor: '#5b21b6',
    desc: 'Fokus pada pengembangan sistem cerdas dan analitis. Kepribadian Anda yang investigatif dan analitis sangat cocok untuk mengolah data besar dan melatih algoritma kompleks.',
  },
  SE: {
    name: 'Software Engineering',
    icon: '💻',
    color: '#10b981',
    bgColor: '#d1fae5',
    borderColor: '#6ee7b7',
    textColor: '#065f46',
    desc: 'Fokus pada rekayasa perangkat lunak skala besar. Jiwa struktural, kreatif, dan berorientasi pada produk akhir Anda sangat pas untuk membangun arsitektur aplikasi yang andal.',
  },
  CN: {
    name: 'Computer Networking',
    icon: '🌐',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    borderColor: '#fcd34d',
    textColor: '#92400e',
    desc: 'Fokus pada infrastruktur cloud dan keamanan. Karakter Anda yang taktis, protektif, dan menyukai stabilitas sistem sangat krusial untuk menjaga keamanan data dan jaringan.',
  },
};

const GRADE_OPTIONS = [
  { value: 4.0, label: 'A (Sangat Memuaskan)' },
  { value: 3.5, label: 'B+ (Sangat Baik)' },
  { value: 3.0, label: 'B (Baik)' },
  { value: 2.5, label: 'C+ (Cukup Baik)' },
  { value: 2.0, label: 'C (Cukup)' },
  { value: 1.0, label: 'D / E (Kurang)' },
];

export default function App() {
  const [page, setPage] = useState('welcome');
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [rekomendasi, setRekomendasi] = useState('');
  const [stats, setStats] = useState({ total: 0, AI: 0, SE: 0, CN: 0 });

  const [formData, setFormData] = useState({
    nama: '',
    kelas: '',
    nilai_ml: 3.0,
    nilai_rpl: 3.0,
    nilai_jarkom: 3.0,
    minat_ai: 3,
    minat_se: 3,
    minat_cn: 3,
    gaya_kerja: 3,
    problem_solving: 3,
    motivasi_karir: 3,
    lingkungan_ideal: 3,
  });

 const fetchStatistics = async () => {
    try {
      const { data, error } = await supabase.from('peminatan').select('rekomendasi');
      if (error) throw error;
      
      if (data && data.length > 0) {
        const counts = { AI: 0, SE: 0, CN: 0 };
        
        // Hanya hitung data yang valid AI, SE, atau CN
        data.forEach(row => { 
          if (counts[row.rekomendasi] !== undefined) {
            counts[row.rekomendasi]++; 
          }
        });
        
        // KUNCI PERBAIKAN: Total adalah jumlah murni dari ketiga klaster
        const totalValid = counts.AI + counts.SE + counts.CN;
        
        setStats({ 
          total: totalValid, 
          AI: counts.AI, 
          SE: counts.SE, 
          CN: counts.CN 
        });
      } else {
        setStats({ total: 0, AI: 0, SE: 0, CN: 0 });
      }
    } catch (err) {
      console.error("Gagal mengambil statistik:", err);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch(ML_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const resultData = await response.json();
      setRekomendasi(resultData.rekomendasi);

      await supabase.from('peminatan').insert([
        {
          nama: formData.nama,
          kelas: formData.kelas,
          nilai_ml: formData.nilai_ml,
          nilai_rpl: formData.nilai_rpl,
          nilai_jarkom: formData.nilai_jarkom,
          minat_ai: formData.minat_ai,
          minat_se: formData.minat_se,
          minat_cn: formData.minat_cn,
          gaya_kerja: formData.gaya_kerja,
          problem_solving: formData.problem_solving,
          motivasi_karir: formData.motivasi_karir,
          lingkungan_ideal: formData.lingkungan_ideal,
          rekomendasi: resultData.rekomendasi,
        },
      ]);

      await fetchStatistics();
      setPage('result');
    } catch (error) {
      alert('Gagal terhubung dengan Server Backend. Pastikan FastAPI berjalan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      nama: '',
      kelas: '',
      nilai_ml: 3.0,
      nilai_rpl: 3.0,
      nilai_jarkom: 3.0,
      minat_ai: 3,
      minat_se: 3,
      minat_cn: 3,
      gaya_kerja: 3,
      problem_solving: 3,
      motivasi_karir: 3,
      lingkungan_ideal: 3,
    });
    setStep(1);
    setPage('welcome');
  };

  const getPct = (count) => (stats.total > 0 ? Math.round((count / stats.total) * 100) : 0);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const pctAI = getPct(stats.AI);
  const pctSE = getPct(stats.SE);
  const pctCN = getPct(stats.CN);

  const strokeDashAI = `${(pctAI / 100) * circumference} ${circumference}`;
  const strokeDashSE = `${(pctSE / 100) * circumference} ${circumference}`;
  const strokeDashCN = `${(pctCN / 100) * circumference} ${circumference}`;

  const offsetAI = 0;
  const offsetSE = -((pctAI / 100) * circumference);
  const offsetCN = -(((pctAI + pctSE) / 100) * circumference);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-brand">
          <div className="header-logo">🧠</div>
          <div>
            <h1 className="header-title">Sistem Rekomendasi Peminatan</h1>
            <p className="header-sub">Teknik Informatika • Smart Decision Engine</p>
          </div>
        </div>
        <div className="resp-badge">
          <span className="resp-dot"></span> {stats.total} Responden
        </div>
      </header>

      {page === 'welcome' && (
        <div className="main-container">
          <div className="welcome-card">
            <div className="welcome-icon">🎯</div>
            <h2 className="welcome-title">Temukan Peminatan IT Terbaikmu</h2>
            <p className="welcome-subtitle">
              Analisis profesional menggabungkan rekam jejak akademik, minat teknologi, dan tes
              kecenderungan psikologi karier (Psikometri).
            </p>
            <div className="welcome-tracks">
              {Object.entries(TRACK_DETAILS).map(([key, val]) => (
                <div
                  key={key}
                  className="track-preview"
                  style={{ borderColor: val.borderColor, backgroundColor: val.bgColor }}
                >
                  <div className="track-preview-icon">{val.icon}</div>
                  <div className="track-preview-name" style={{ color: val.textColor }}>
                    {val.name}
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-start" onClick={() => setPage('quiz')}>
              Mulai Profiling Karier
            </button>
          </div>
        </div>
      )}

      {page === 'quiz' && (
        <div className="main-container" style={{ paddingTop: '20px' }}>
          <div className="progress-wrap">
            <div className="progress-label">
              <span>
                {step === 1
                  ? 'Identitas Diri'
                  : step === 2
                    ? 'Akademik Prasyarat'
                    : step === 3
                      ? 'Minat Rumpun IT'
                      : step === 4
                        ? 'Gaya Kognitif'
                        : 'Motivasi Kerja'}
              </span>
              <span>Langkah {step} dari 5</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${(step / 5) * 100}%` }}></div>
            </div>
          </div>

          <div className="question-card">
            {step === 1 && (
              <div>
                <span className="section-tag tag-identity">📝 Data Diri</span>
                <h3 className="q-title">Masukan Profil Pengenal</h3>
                <div className="identity-form">
                  <div className="field-group">
                    <label className="field-label">Nama Lengkap / Inisial</label>
                    <input
                      type="text"
                      className="field-input"
                      value={formData.nama}
                      onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                      placeholder="Masukkan nama"
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Kelas / Angkatan (Contoh: IF-4A)</label>
                    <input
                      type="text"
                      className="field-input"
                      value={formData.kelas}
                      onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                      placeholder="Masukkan kelas"
                    />
                  </div>
                </div>
                <div className="nav-row">
                  <button className="btn-back" onClick={() => setPage('welcome')}>
                    Batal
                  </button>
                  <button
                    className="btn-next"
                    disabled={!formData.nama || !formData.kelas}
                    onClick={() => setStep(2)}
                  >
                    Lanjutkan
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <span className="section-tag tag-grade">📊 Nilai Fondasi Kuliah</span>
                <h3 className="q-title">Berapa raihan nilai mata kuliah ini?</h3>
                <div className="identity-form">
                  <div className="field-group">
                    <label className="field-label">Machine Learning / Statistika</label>
                    <select
                      className="field-select"
                      value={formData.nilai_ml}
                      onChange={(e) =>
                        setFormData({ ...formData, nilai_ml: parseFloat(e.target.value) })
                      }
                    >
                      {GRADE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Rekayasa Perangkat Lunak / PBO</label>
                    <select
                      className="field-select"
                      value={formData.nilai_rpl}
                      onChange={(e) =>
                        setFormData({ ...formData, nilai_rpl: parseFloat(e.target.value) })
                      }
                    >
                      {GRADE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Jaringan Komputer / OS</label>
                    <select
                      className="field-select"
                      value={formData.nilai_jarkom}
                      onChange={(e) =>
                        setFormData({ ...formData, nilai_jarkom: parseFloat(e.target.value) })
                      }
                    >
                      {GRADE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="nav-row">
                  <button className="btn-back" onClick={() => setStep(1)}>
                    Kembali
                  </button>
                  <button className="btn-next" onClick={() => setStep(3)}>
                    Lanjutkan
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <span className="section-tag tag-info">❤️ Minat Mata Kuliah Pilihan</span>
                <h3 className="q-title">Ketertarikan mendalami topik berikut?</h3>

                <div className="likert-group">
                  <div className="field-label">
                    Sistem Cerdas: AI, Computer Vision, Data Science
                  </div>
                  <div className="likert-row">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        className={`likert-btn ${formData.minat_ai === v ? 'selected' : ''}`}
                        onClick={() => setFormData({ ...formData, minat_ai: v })}
                      >
                        <span className="likert-emoji">
                          {['😴', '😑', '😐', '😊', '🔥'][v - 1]}
                        </span>
                        <span className="likert-label">
                          {['Tidak', 'Kurang', 'Biasa', 'Suka', 'Sangat'][v - 1]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="likert-group">
                  <div className="field-label">
                    Arsitektur Kode: Web, Mobile App, Software Design
                  </div>
                  <div className="likert-row">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        className={`likert-btn ${formData.minat_se === v ? 'selected' : ''}`}
                        onClick={() => setFormData({ ...formData, minat_se: v })}
                      >
                        <span className="likert-emoji">
                          {['😴', '😑', '😐', '😊', '🔥'][v - 1]}
                        </span>
                        <span className="likert-label">
                          {['Tidak', 'Kurang', 'Biasa', 'Suka', 'Sangat'][v - 1]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="likert-group">
                  <div className="field-label">Infrastruktur: Cyber Security, Cloud, Jaringan</div>
                  <div className="likert-row">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        className={`likert-btn ${formData.minat_cn === v ? 'selected' : ''}`}
                        onClick={() => setFormData({ ...formData, minat_cn: v })}
                      >
                        <span className="likert-emoji">
                          {['😴', '😑', '😐', '😊', '🔥'][v - 1]}
                        </span>
                        <span className="likert-label">
                          {['Tidak', 'Kurang', 'Biasa', 'Suka', 'Sangat'][v - 1]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="nav-row">
                  <button className="btn-back" onClick={() => setStep(2)}>
                    Kembali
                  </button>
                  <button className="btn-next" onClick={() => setStep(4)}>
                    Lanjutkan
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <span className="section-tag tag-psycho-1">🧠 Gaya Berpikir & Kognitif</span>
                <h3 className="q-title">Kecenderungan Penyelesaian Masalah</h3>
                <p className="q-sub">Pilih yang paling mencerminkan diri Anda.</p>

                <div className="likert-group">
                  <div className="field-label">
                    "Saya lebih tertantang untuk bereksperimen dengan algoritma dan mengolah data
                    dalam jumlah besar untuk memprediksi sesuatu, dibandingkan membangun fitur
                    sebuah aplikasi".
                  </div>
                  <div className="likert-row">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        className={`likert-btn ${formData.gaya_kerja === v ? 'selected' : ''}`}
                        onClick={() => setFormData({ ...formData, gaya_kerja: v })}
                      >
                        <span className="likert-label big-label">
                          {
                            ['Sangat Tidak', 'Tidak Setuju', 'Netral', 'Setuju', 'Sangat Setuju'][
                              v - 1
                            ]
                          }
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="likert-group">
                  <div className="field-label">
                    "Kepuasan terbesar saya adalah menyusun ribuan baris kode menjadi sebuah
                    arsitektur perangkat lunak yang utuh, fungsional, dan bebas dari bug (error)."
                  </div>
                  <div className="likert-row">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        className={`likert-btn ${formData.problem_solving === v ? 'selected' : ''}`}
                        onClick={() => setFormData({ ...formData, problem_solving: v })}
                      >
                        <span className="likert-label big-label">
                          {
                            ['Sangat Tidak', 'Tidak Setuju', 'Netral', 'Setuju', 'Sangat Setuju'][
                              v - 1
                            ]
                          }
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="nav-row">
                  <button className="btn-back" onClick={() => setStep(3)}>
                    Kembali
                  </button>
                  <button className="btn-next" onClick={() => setStep(5)}>
                    Lanjutkan
                  </button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div>
                <span className="section-tag tag-psycho-2">🌟 Motivasi Karakter</span>
                <h3 className="q-title">Lingkungan & Tujuan Profesional</h3>

                <div className="likert-group">
                  <div className="field-label">
                    "Saya termotivasi oleh karya yang hasil akhirnya terlihat nyata & dipakai
                    pengguna umum."
                  </div>
                  <div className="likert-row">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        className={`likert-btn ${formData.motivasi_karir === v ? 'selected' : ''}`}
                        onClick={() => setFormData({ ...formData, motivasi_karir: v })}
                      >
                        <span className="likert-label big-label">
                          {
                            ['Sangat Tidak', 'Tidak Setuju', 'Netral', 'Setuju', 'Sangat Setuju'][
                              v - 1
                            ]
                          }
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="likert-group">
                  <div className="field-label">
                    "Saya nyaman bekerja menjaga keamanan dan stabilitas di belakang layar agar
                    sistem tidak tumbang."
                  </div>
                  <div className="likert-row">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        className={`likert-btn ${formData.lingkungan_ideal === v ? 'selected' : ''}`}
                        onClick={() => setFormData({ ...formData, lingkungan_ideal: v })}
                      >
                        <span className="likert-label big-label">
                          {
                            ['Sangat Tidak', 'Tidak Setuju', 'Netral', 'Setuju', 'Sangat Setuju'][
                              v - 1
                            ]
                          }
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="nav-row">
                  <button className="btn-back" onClick={() => setStep(4)}>
                    Kembali
                  </button>
                  <button className="btn-submit" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? <div className="spinner"></div> : 'Kalkulasi Hasil 🚀'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {page === 'result' && TRACK_DETAILS[rekomendasi] && (
        <div className="main-container">
          <div className="result-hero">
            <div className="result-confetti">🎉</div>
            <span className="result-title">Hasil Rekomendasi</span>
            <div className="user-badge">
              👤 {formData.nama} • 🏫 {formData.kelas}
            </div>
            <span className="result-track-icon">{TRACK_DETAILS[rekomendasi].icon}</span>
            <h2 className="result-track-name" style={{ color: TRACK_DETAILS[rekomendasi].color }}>
              {TRACK_DETAILS[rekomendasi].name}
            </h2>
            <p className="result-track-desc">{TRACK_DETAILS[rekomendasi].desc}</p>
            <button className="btn-redo" onClick={handleReset}>
              Isi Ulang 🔄
            </button>
          </div>

          <div className="stats-section">
            <div className="stats-header">
              <div className="stats-title">📊 Analisis Database Responden</div>
            </div>
            <div className="chart-layout">
              <div className="chart-container">
                <svg className="chart-svg" viewBox="0 0 160 160">
                  <circle className="chart-bg-circle" cx="80" cy="80" r={radius} />
                  {stats.total > 0 && (
                    <>
                      <circle
                        className="chart-segment"
                        cx="80"
                        cy="80"
                        r={radius}
                        stroke="#6366f1"
                        strokeDasharray={strokeDashAI}
                        strokeDashoffset={offsetAI}
                      />
                      <circle
                        className="chart-segment"
                        cx="80"
                        cy="80"
                        r={radius}
                        stroke="#10b981"
                        strokeDasharray={strokeDashSE}
                        strokeDashoffset={offsetSE}
                      />
                      <circle
                        className="chart-segment"
                        cx="80"
                        cy="80"
                        r={radius}
                        stroke="#f59e0b"
                        strokeDasharray={strokeDashCN}
                        strokeDashoffset={offsetCN}
                      />
                    </>
                  )}
                </svg>
                <div className="chart-center-text">
                  <span className="center-num">{stats.total}</span>
                  <span className="center-label">Total</span>
                </div>
              </div>

              <div className="legend-container">
                <div className="legend-item">
                  <div className="legend-left">
                    <div className="legend-color-dot" style={{ backgroundColor: '#6366f1' }}></div>
                    <span className="legend-name">AI</span>
                  </div>
                  <div className="legend-right">
                    <span className="legend-count">({stats.AI})</span>
                    <span className="legend-pct">{pctAI}%</span>
                  </div>
                </div>
                <div className="legend-item">
                  <div className="legend-left">
                    <div className="legend-color-dot" style={{ backgroundColor: '#10b981' }}></div>
                    <span className="legend-name">SE</span>
                  </div>
                  <div className="legend-right">
                    <span className="legend-count">({stats.SE})</span>
                    <span className="legend-pct">{pctSE}%</span>
                  </div>
                </div>
                <div className="legend-item">
                  <div className="legend-left">
                    <div className="legend-color-dot" style={{ backgroundColor: '#f59e0b' }}></div>
                    <span className="legend-name">CN</span>
                  </div>
                  <div className="legend-right">
                    <span className="legend-count">({stats.CN})</span>
                    <span className="legend-pct">{pctCN}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
