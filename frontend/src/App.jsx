import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import './App.css';

// 📢 KONFIGURASI SUPABASE
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TRACK_DETAILS = {
  AI: {
    name: 'Artificial Intelligence (AI)',
    icon: '🤖',
    borderColor: '#3b82f6',
    bgColor: '#eff6ff',
    textColor: '#1d4ed8',
    description:
      'Anda sangat cocok di peminatan AI. Fokus Anda adalah pada pemrosesan data skala besar, rekayasa algoritma cerdas, data science, dan machine learning.',
  },
  SE: {
    name: 'Software Engineering (SE)',
    icon: '💻',
    borderColor: '#10b981',
    bgColor: '#ecfdf5',
    textColor: '#047857',
    description:
      'Anda sangat cocok di peminatan SE. Fokus Anda adalah pada arsitektur kode perangkat lunak, pembuatan aplikasi web/mobile yang tangguh, fungsional, dan bebas dari bug.',
  },
  CN: {
    name: 'Computer Networking & Cloud (CN)',
    icon: '🌐',
    borderColor: '#f59e0b',
    bgColor: '#fffbeb',
    textColor: '#b45309',
    description:
      'Anda sangat cocok di peminatan CN. Fokus Anda adalah pada infrastruktur jaringan, arsitektur cloud computing, cyber security, dan menjaga stabilitas sistem di belakang layar.',
  },
};

function App() {
  // --- STATES ---
  const [page, setPage] = useState('welcome');
  const [quizStep, setQuizStep] = useState(1);
  const [rekomendasi, setRekomendasi] = useState(null);
  const [namaResponden, setNamaResponden] = useState('');
  const [kelasResponden, setKelasResponden] = useState('');
  const [stats, setStats] = useState({ total: 0, AI: 0, SE: 0, CN: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    nama: '',
    kelas: '',
    nilai_ml: 4.0,
    nilai_rpl: 4.0,
    nilai_jarkom: 4.0,
    minat_ai: 3,
    minat_se: 3,
    minat_cn: 3,
    gaya_kerja: 3,
    problem_solving: 3,
    motivasi_karir: 3,
    lingkungan_ideal: 3,
  });

  // --- AMBIL STATISTIK GLOBAL DARI SUPABASE ---
  const fetchStatistics = async () => {
    try {
      const { data, error } = await supabase
        .from('peminatan')
        .select('rekomendasi')
        .not('rekomendasi', 'is', null);

      if (error) throw error;

      if (data && data.length > 0) {
        const counts = { AI: 0, SE: 0, CN: 0 };
        data.forEach((row) => {
          if (counts[row.rekomendasi] !== undefined) {
            counts[row.rekomendasi]++;
          }
        });

        setStats({
          total: data.length,
          AI: counts.AI,
          SE: counts.SE,
          CN: counts.CN,
        });
      }
    } catch (err) {
      console.error('Gagal mengambil statistik:', err);
    }
  };

  // --- LOGIKA SYNC DATA DARI GOOGLE FORM VIA URL ---
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const pageParam = queryParams.get('page');
    const sourceParam = queryParams.get('source');

    console.log('🚀 APP LOADED - URL Params:', { pageParam, sourceParam });

    if (pageParam === 'result' && sourceParam === 'gform') {
      console.log('🔍 Google Form mode detected! Switching to result page...');

      setPage('result');
      setIsLoading(true);

      const fetchLatestGformData = async () => {
        try {
          const { data, error } = await supabase
            .from('peminatan')
            .select('*')
            .not('rekomendasi', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1);

          console.log('📊 Supabase Response:', { data, error });

          if (data && data.length > 0) {
            const latestData = data[0];
            console.log('✅ Data terbaru ditemukan:', latestData);

            setRekomendasi(latestData.rekomendasi);
            setNamaResponden(latestData.nama || 'Unknown');
            setKelasResponden(latestData.kelas || '');
          }
        } catch (err) {
          console.error('❌ Gagal mengambil data:', err);
        } finally {
          setIsLoading(false);
        }
      };

      fetchLatestGformData();
    }

    fetchStatistics();
  }, []);

  // --- HANDLER MULTI-STEP FORM ---
  const nextStep = (e) => {
    if (e) e.preventDefault(); // 🔥 PENTING: Cegah submit form!

    if (quizStep < 5) {
      setQuizStep(quizStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = (e) => {
    if (e) e.preventDefault(); // 🔥 PENTING: Cegah submit form!

    if (quizStep > 1) {
      setQuizStep(quizStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // --- LOGIKA SUBMIT WEB LOKAL ---
  const handleWebQuizSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('https://web-production-f68e4.up.railway.app/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const jsonResult = await response.json();
      const hasilPeminatan = jsonResult.rekomendasi;

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
          rekomendasi: hasilPeminatan,
        },
      ]);

      setRekomendasi(hasilPeminatan);
      setNamaResponden(formData.nama);
      setKelasResponden(formData.kelas);
      await fetchStatistics();
      setPage('result');
    } catch (err) {
      console.error('Error kuis lokal:', err);
      alert('Terjadi gangguan koneksi ke server Railway!');
    } finally {
      setIsLoading(false);
    }
  };

  // Perhitungan persentase donat chart
  const pctAI = stats.total > 0 ? Math.round((stats.AI / stats.total) * 100) : 0;
  const pctSE = stats.total > 0 ? Math.round((stats.SE / stats.total) * 100) : 0;
  const pctCN = stats.total > 0 ? 100 - pctAI - pctSE : 0;

  const circumference = 2 * Math.PI * 52;
  const aiDash = (pctAI / 100) * circumference;
  const seDash = (pctSE / 100) * circumference;
  const cnDash = (pctCN / 100) * circumference;

  // --- RENDER MULTI-STEP FORM ---
  const renderQuizStep = () => {
    switch (quizStep) {
      case 1:
        return (
          <>
            <span className="section-tag tag-identity">📝 Step 1/5 - Identitas</span>
            <h2 className="q-title">Data Diri Mahasiswa</h2>
            <p className="q-sub">Lengkapi identitas Anda terlebih dahulu.</p>

            <div className="field-group">
              <label className="field-label">Nama Lengkap / Inisial</label>
              <input
                type="text"
                className="field-input"
                required
                placeholder="Masukkan nama Anda"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              />
            </div>

            <div className="field-group">
              <label className="field-label">Kelas / Angkatan</label>
              <input
                type="text"
                className="field-input"
                required
                placeholder="Contoh: IF-4A"
                value={formData.kelas}
                onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
              />
            </div>
          </>
        );

      case 2:
        return (
          <>
            <span className="section-tag tag-grade">📊 Step 2/5 - Nilai Akademik</span>
            <h2 className="q-title">Rekam Jejak Akademik</h2>
            <p className="q-sub">Pilih nilai terakhir Anda untuk mata kuliah terkait.</p>

            <div className="field-group">
              <label className="field-label">Nilai Machine Learning / Statistika</label>
              <select
                className="field-select"
                value={formData.nilai_ml}
                onChange={(e) => setFormData({ ...formData, nilai_ml: parseFloat(e.target.value) })}
              >
                <option value="4.0">4.0 - A</option>
                <option value="3.5">3.5 - B+</option>
                <option value="3.0">3.0 - B</option>
                <option value="2.5">2.5 - C+</option>
                <option value="2.0">2.0 - C</option>
              </select>
            </div>

            <div className="field-group">
              <label className="field-label">Nilai Rekayasa Perangkat Lunak / PBO</label>
              <select
                className="field-select"
                value={formData.nilai_rpl}
                onChange={(e) =>
                  setFormData({ ...formData, nilai_rpl: parseFloat(e.target.value) })
                }
              >
                <option value="4.0">4.0 - A</option>
                <option value="3.5">3.5 - B+</option>
                <option value="3.0">3.0 - B</option>
                <option value="2.5">2.5 - C+</option>
                <option value="2.0">2.0 - C</option>
              </select>
            </div>

            <div className="field-group">
              <label className="field-label">Nilai Jaringan Komputer / OS</label>
              <select
                className="field-select"
                value={formData.nilai_jarkom}
                onChange={(e) =>
                  setFormData({ ...formData, nilai_jarkom: parseFloat(e.target.value) })
                }
              >
                <option value="4.0">4.0 - A</option>
                <option value="3.5">3.5 - B+</option>
                <option value="3.0">3.0 - B</option>
                <option value="2.5">2.5 - C+</option>
                <option value="2.0">2.0 - C</option>
              </select>
            </div>
          </>
        );

      case 3:
        return (
          <>
            <span className="section-tag tag-info">💡 Step 3/5 - Minat & Ketertarikan</span>
            <h2 className="q-title">Seberapa Tertarik Anda?</h2>
            <p className="q-sub">Nilai 1 (Sangat Tidak Tertarik) sampai 5 (Sangat Tertarik).</p>

            {[
              { label: 'Minat terhadap Artificial Intelligence (AI)', field: 'minat_ai' },
              { label: 'Minat terhadap Software Engineering (SE)', field: 'minat_se' },
              { label: 'Minat terhadap Computer Networking & Cloud (CN)', field: 'minat_cn' },
            ].map((item) => (
              <div key={item.field} className="field-group">
                <label className="field-label">{item.label}</label>
                <div className="likert-row">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      className={`likert-btn ${formData[item.field] === val ? 'selected' : ''}`}
                      onClick={() => setFormData({ ...formData, [item.field]: val })}
                    >
                      <span className="likert-emoji">
                        {val === 1
                          ? '😴'
                          : val === 2
                            ? '😐'
                            : val === 3
                              ? '🤔'
                              : val === 4
                                ? '😊'
                                : '🤩'}
                      </span>
                      <span className="likert-label">{val}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </>
        );

      case 4:
        return (
          <>
            <span className="section-tag tag-psycho-1">🧠 Step 4/5 - Gaya Kerja</span>
            <h2 className="q-title">Bagaimana Cara Anda Bekerja?</h2>
            <p className="q-sub">Nilai 1 (Sangat Tidak Setuju) sampai 5 (Sangat Setuju).</p>

            {[
              { label: 'Saya senang bekerja dengan data dan analisis pola', field: 'gaya_kerja' },
              {
                label: 'Saya suka memecahkan masalah kompleks secara sistematis',
                field: 'problem_solving',
              },
            ].map((item) => (
              <div key={item.field} className="field-group">
                <label className="field-label">{item.label}</label>
                <div className="likert-row">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      className={`likert-btn ${formData[item.field] === val ? 'selected' : ''}`}
                      onClick={() => setFormData({ ...formData, [item.field]: val })}
                    >
                      <span className="likert-emoji">
                        {val === 1
                          ? '👎'
                          : val === 2
                            ? '🤷'
                            : val === 3
                              ? '👍'
                              : val === 4
                                ? '💪'
                                : '🎯'}
                      </span>
                      <span className="likert-label">{val}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </>
        );

      case 5:
        return (
          <>
            <span className="section-tag tag-psycho-2">🎯 Step 5/5 - Motivasi Karier</span>
            <h2 className="q-title">Apa yang Mendorong Anda?</h2>
            <p className="q-sub">Pilih yang paling sesuai dengan visi karier Anda.</p>

            {[
              {
                label: 'Saya termotivasi oleh inovasi teknologi dan riset',
                field: 'motivasi_karir',
              },
              {
                label: 'Saya nyaman dengan infrastruktur dan stabilitas sistem',
                field: 'lingkungan_ideal',
              },
            ].map((item) => (
              <div key={item.field} className="field-group">
                <label className="field-label">{item.label}</label>
                <div className="likert-row">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      className={`likert-btn ${formData[item.field] === val ? 'selected' : ''}`}
                      onClick={() => setFormData({ ...formData, [item.field]: val })}
                    >
                      <span className="likert-emoji">
                        {val === 1
                          ? '❌'
                          : val === 2
                            ? '🤔'
                            : val === 3
                              ? '✅'
                              : val === 4
                                ? '🌟'
                                : '🔥'}
                      </span>
                      <span className="likert-label">{val}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="app-header">
        <div className="header-brand">
          <div className="header-logo">🧠</div>
          <div>
            <div className="header-title">Sistem Rekomendasi Peminatan</div>
            <div className="header-sub">Teknik Informatika • Smart Decision Engine</div>
          </div>
        </div>
        <div className="resp-badge">
          <span className="resp-dot"></span>
          {stats.total} Responden
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="main-container">
        {/* ================= WELCOME SCREEN ================= */}
        {page === 'welcome' && (
          <div className="welcome-card">
            <div className="welcome-icon">🎯</div>
            <h1 className="welcome-title">Temukan Peminatan IT Terbaikmu</h1>
            <p className="welcome-subtitle">
              Analisis profesional menggabungkan rekam jejak akademik, minat teknologi, dan tes
              kecenderungan psikologi karier.
            </p>

            <div className="welcome-tracks">
              <div
                className="track-preview"
                style={{
                  borderColor: TRACK_DETAILS.AI.borderColor,
                  backgroundColor: TRACK_DETAILS.AI.bgColor,
                }}
              >
                <div className="track-preview-icon">{TRACK_DETAILS.AI.icon}</div>
                <div className="track-preview-name">{TRACK_DETAILS.AI.name}</div>
              </div>
              <div
                className="track-preview"
                style={{
                  borderColor: TRACK_DETAILS.SE.borderColor,
                  backgroundColor: TRACK_DETAILS.SE.bgColor,
                }}
              >
                <div className="track-preview-icon">{TRACK_DETAILS.SE.icon}</div>
                <div className="track-preview-name">{TRACK_DETAILS.SE.name}</div>
              </div>
              <div
                className="track-preview"
                style={{
                  borderColor: TRACK_DETAILS.CN.borderColor,
                  backgroundColor: TRACK_DETAILS.CN.bgColor,
                }}
              >
                <div className="track-preview-icon">{TRACK_DETAILS.CN.icon}</div>
                <div className="track-preview-name">{TRACK_DETAILS.CN.name}</div>
              </div>
            </div>

            <button
              className="btn-start"
              onClick={() => {
                setPage('quiz');
                setQuizStep(1);
              }}
            >
              Mulai Profiling (Web) ✨
            </button>
            <button className="btn-view-stats" onClick={() => setPage('result')}>
              Lihat Statistik Live 📊
            </button>
          </div>
        )}

        {/* ================= MULTI-STEP FORM QUIZ ================= */}
        {page === 'quiz' && (
          <div className="question-card">
            <form onSubmit={handleWebQuizSubmit} className="identity-form">
              {renderQuizStep()}

              {/* Progress Bar */}
              <div className="progress-wrap">
                <div className="progress-label">
                  <span>Progress</span>
                  <span>{quizStep}/5</span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${(quizStep / 5) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Navigation Buttons - 🔥 PASTIKAN TYPE="BUTTON" */}
              <div className="nav-row">
                {quizStep > 1 ? (
                  <button type="button" className="btn-back" onClick={prevStep}>
                    ← Sebelumnya
                  </button>
                ) : (
                  <button type="button" className="btn-back" onClick={() => setPage('welcome')}>
                    ← Kembali
                  </button>
                )}

                {quizStep < 5 ? (
                  <button type="button" className="btn-next" onClick={nextStep}>
                    Selanjutnya →
                  </button>
                ) : (
                  <button type="submit" className="btn-next" disabled={isLoading}>
                    {isLoading ? 'Memproses...' : 'Lihat Hasil Rekomendasi 🎯'}
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* ================= HALAMAN HASIL & GRAFIK ================= */}
        {page === 'result' && (
          <>
            {/* Kartu Rekomendasi Personal */}
            {rekomendasi && TRACK_DETAILS[rekomendasi] && (
              <div className="result-hero">
                <div className="result-confetti">🎉</div>
                <div className="result-title">Hasil Rekomendasi Pribadi</div>
                <div className="user-badge">
                  <span>👤</span> {namaResponden || 'Unknown'}
                  {kelasResponden && <span> • {kelasResponden}</span>}
                </div>
                <span className="result-track-icon">{TRACK_DETAILS[rekomendasi].icon}</span>
                <h2
                  className="result-track-name"
                  style={{ color: TRACK_DETAILS[rekomendasi].textColor }}
                >
                  {TRACK_DETAILS[rekomendasi].name}
                </h2>
                <p className="result-track-desc">{TRACK_DETAILS[rekomendasi].description}</p>
                <button
                  className="btn-redo"
                  onClick={() => {
                    setRekomendasi(null);
                    setNamaResponden('');
                    setKelasResponden('');
                    setPage('welcome');
                  }}
                >
                  Isi Ulang 🔄
                </button>
              </div>
            )}

            {/* Kartu Statistik Global */}
            <div className="stats-section">
              <div className="stats-header">
                <h2 className="stats-title">📊 Statistik Seluruh Responden</h2>
                <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
                  Total: {stats.total} responden
                </p>
              </div>

              <div className="chart-layout">
                <div className="chart-container">
                  <svg className="chart-svg" viewBox="0 0 120 120">
                    <circle className="chart-bg-circle" cx="60" cy="60" r="52" />
                    <circle
                      className="chart-segment"
                      cx="60"
                      cy="60"
                      r="52"
                      stroke="#3b82f6"
                      strokeDasharray={`${aiDash} ${circumference}`}
                      strokeDashoffset="0"
                    />
                    <circle
                      className="chart-segment"
                      cx="60"
                      cy="60"
                      r="52"
                      stroke="#10b981"
                      strokeDasharray={`${seDash} ${circumference}`}
                      strokeDashoffset={-aiDash}
                    />
                    <circle
                      className="chart-segment"
                      cx="60"
                      cy="60"
                      r="52"
                      stroke="#f59e0b"
                      strokeDasharray={`${cnDash} ${circumference}`}
                      strokeDashoffset={-(aiDash + seDash)}
                    />
                  </svg>
                  <div className="chart-center-text">
                    <span className="center-num">{stats.total}</span>
                    <span className="center-label">Total</span>
                  </div>
                </div>

                <div className="legend-container">
                  <div className="legend-item">
                    <div className="legend-left">
                      <div
                        className="legend-color-dot"
                        style={{ backgroundColor: '#3b82f6' }}
                      ></div>
                      <span className="legend-name">AI</span>
                    </div>
                    <div className="legend-right">
                      <span>{stats.AI}</span>
                      <span style={{ color: '#94a3b8' }}>({pctAI}%)</span>
                    </div>
                  </div>
                  <div className="legend-item">
                    <div className="legend-left">
                      <div
                        className="legend-color-dot"
                        style={{ backgroundColor: '#10b981' }}
                      ></div>
                      <span className="legend-name">SE</span>
                    </div>
                    <div className="legend-right">
                      <span>{stats.SE}</span>
                      <span style={{ color: '#94a3b8' }}>({pctSE}%)</span>
                    </div>
                  </div>
                  <div className="legend-item">
                    <div className="legend-left">
                      <div
                        className="legend-color-dot"
                        style={{ backgroundColor: '#f59e0b' }}
                      ></div>
                      <span className="legend-name">CN</span>
                    </div>
                    <div className="legend-right">
                      <span>{stats.CN}</span>
                      <span style={{ color: '#94a3b8' }}>({pctCN}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
