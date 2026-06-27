import React, { useState, useEffect } from 'react';
// UBAH BARIS INI:
import { createClient } from '@supabase/supabase-js';
import './App.css';

// 📢 1. PENGATURAN SUPABASE (Sudah otomatis membaca dari file .env kamu)
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
  const [page, setPage] = useState('welcome'); // welcome, quiz, result
  const [rekomendasi, setRekomendasi] = useState(null);
  const [namaResponden, setNamaResponden] = useState('');
  const [stats, setStats] = useState({ total: 0, AI: 0, SE: 0, CN: 0 });

  // Data Formulir Kuis Lokal (Untuk pengisian via Web)
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

  // --- 2. LOGIKA SYNC DATA SAAT WEB DIBUKA ---
  useEffect(() => {
    fetchStatistics();

    // Deteksi parameter URL (?page=result&source=gform)
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get('page') === 'result') {
      setPage('result');

      // Jika user datang setelah klik redirect dari Google Form
      if (queryParams.get('source') === 'gform') {
        const fetchLatestGformData = async () => {
          try {
            // Tarik 1 baris data paling terakhir (terbaru) dimasukkan ke Supabase oleh GForm
            const { data, error } = await supabase
              .from('peminatan')
              .select('nama, rekomendasi')
              .order('id', { ascending: false })
              .limit(1)
              .single();

            if (data) {
              setRekomendasi(data.rekomendasi);
              setNamaResponden(data.nama);
            }
          } catch (err) {
            console.error('Gagal sinkronisasi data Google Form:', err);
          }
        };
        fetchLatestGformData();
      }
    }
  }, []);

  // --- 3. AMBIL STATISTIK GLOBAL DARI SUPABASE ---
  const fetchStatistics = async () => {
    try {
      const { data, error } = await supabase.from('peminatan').select('rekomendasi');
      if (error) throw error;

      if (data && data.length > 0) {
        const counts = { AI: 0, SE: 0, CN: 0 };

        // Hitung murni data yang valid saja
        data.forEach((row) => {
          if (counts[row.rekomendasi] !== undefined) {
            counts[row.rekomendasi]++;
          }
        });

        const totalValid = counts.AI + counts.SE + counts.CN;

        setStats({
          total: totalValid,
          AI: counts.AI,
          SE: counts.SE,
          CN: counts.CN,
        });
      } else {
        setStats({ total: 0, AI: 0, SE: 0, CN: 0 });
      }
    } catch (err) {
      console.error('Gagal mengambil statistik database:', err);
    }
  };

  // --- 4. LOGIKA TOMBOL SUBMIT KUIS LOKAL (VIA WEB) ---
  const handleWebQuizSubmit = async (e) => {
    e.preventDefault();
    try {
      // Tembak backend Railway untuk hitung rumus matematika AI/SE/CN
      const response = await fetch('https://web-production-f68e4.up.railway.app/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const jsonResult = await response.json();
      const hasilPeminatan = jsonResult.rekomendasi;

      // Simpan langsung hasil hitungan ke Supabase
      await supabase
        .from('peminatan')
        .insert([{ nama: formData.nama, kelas: formData.kelas, rekomendasi: hasilPeminatan }]);

      // Set states untuk memicu tampilan halaman hasil kustom
      setRekomendasi(hasilPeminatan);
      setNamaResponden(formData.nama);
      await fetchStatistics(); // Refresh statistik terbaru
      setPage('result');
    } catch (err) {
      console.error('Gagal memproses kuis lokal:', err);
      alert('Terjadi gangguan koneksi ke server AI Railway!');
    }
  };

  // Kalkulasi Persentase Grafik Donat Terlindungi (Anti Pembulatan Rusak)
  const pctAI = stats.total > 0 ? Math.round((stats.AI / stats.total) * 100) : 0;
  const pctSE = stats.total > 0 ? Math.round((stats.SE / stats.total) * 100) : 0;
  const pctCN = stats.total > 0 ? 100 - pctAI - pctSE : 0; // Sisa dikunci agar total selalu tepat 100%

  return (
    <div className="app-app">
      {/* --- NAVBAR ATAS --- */}
      <header className="navbar-container">
        <div className="navbar-brand">🎯 Smart Decision Engine</div>
        <div className="navbar-badge">{stats.total} Responden Teranalisis</div>
      </header>

      {/* ================= HALAMAN WELCOME ================= */}
      {page === 'welcome' && (
        <div className="main-container">
          <div className="welcome-card">
            <div className="welcome-icon">🚀</div>
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
              Mulai Profiling Karier (Web)
            </button>
            <button className="btn-view-stats" onClick={() => setPage('result')}>
              Lihat Statistik & Hasil Responden Live 📊
            </button>
          </div>
        </div>
      )}

      {/* ================= HALAMAN KUIS WEB LOCAL ================= */}
      {page === 'quiz' && (
        <div className="main-container">
          <form onSubmit={handleWebQuizSubmit} className="quiz-card">
            <h3>Formulir Profiling Peminatan IT</h3>

            <label>Nama Lengkap / Inisial</label>
            <input
              type="text"
              required
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
            />

            <label>Kelas / Angkatan</label>
            <input
              type="text"
              required
              placeholder="Contoh: IF-4A"
              onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
            />

            <label>Nilai Machine Learning / Statistika</label>
            <select
              onChange={(e) => setFormData({ ...formData, nilai_ml: parseFloat(e.target.value) })}
            >
              <option value="4.0">4.0 - A</option>
              <option value="3.5">3.5 - B+</option>
              <option value="3.0">3.0 - B</option>
              <option value="2.5">2.5 - C+</option>
              <option value="2.0">2.0 - C</option>
            </select>

            <label>Nilai Rekayasa Perangkat Lunak / PBO</label>
            <select
              onChange={(e) => setFormData({ ...formData, nilai_rpl: parseFloat(e.target.value) })}
            >
              <option value="4.0">4.0 - A</option>
              <option value="3.5">3.5 - B+</option>
              <option value="3.0">3.0 - B</option>
              <option value="2.5">2.5 - C+</option>
              <option value="2.0">2.0 - C</option>
            </select>

            <label>Nilai Jaringan Komputer / OS</label>
            <select
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

            <button type="submit" className="btn-submit">
              Hitung Hasil AI Rekomendasi 🎯
            </button>
          </form>
        </div>
      )}

      {/* ================= HALAMAN OUTPUT HASIL & GRAFIK (AMAN DARI BLANK) ================= */}
      {page === 'result' && (
        <div className="main-container flex-row-responsive">
          {/* 🎯 BAGIAN KARTU REKOMENDASI INDIVIDU (Hanya muncul jika rekomendasi ada nilainya) */}
          {rekomendasi && TRACK_DETAILS[rekomendasi] && (
            <div
              className="result-card animate-fade-in"
              style={{ borderColor: TRACK_DETAILS[rekomendasi].borderColor }}
            >
              <div className="result-badge-icon">{TRACK_DETAILS[rekomendasi].icon}</div>
              <h2 className="result-title">
                Hasil Rekomendasi {namaResponden ? `untuk ${namaResponden}` : 'Anda'}:
              </h2>
              <div
                className="result-highlight-name"
                style={{ color: TRACK_DETAILS[rekomendasi].textColor }}
              >
                {TRACK_DETAILS[rekomendasi].name}
              </div>
              <p className="result-desc-text">{TRACK_DETAILS[rekomendasi].description}</p>
              <button
                className="btn-retry"
                onClick={() => {
                  setRekomendasi(null);
                  setNamaResponden('');
                  setPage('welcome');
                }}
              >
                Kembali Ke Awal 🔄
              </button>
            </div>
          )}

          {/* 📊 BAGIAN GRAFIK LINGKARAN DONAT (Aman & Selalu Muncul Walau dari Gform) */}
          <div className="stats-card">
            <h3 className="stats-title">📊 Sebaran Data Responden Live</h3>

            <div className="donut-chart-wrapper">
              <div
                className="donut-chart"
                style={{
                  background: `conic-gradient(
                  #3b82f6 0% ${pctAI}%, 
                  #10b981 ${pctAI}% ${pctAI + pctSE}%, 
                  #f59e0b ${pctAI + pctSE}% 100%
                )`,
                }}
              >
                <div className="donut-chart-center">
                  <span className="donut-center-num">{stats.total}</span>
                  <span className="donut-center-lbl">TOTAL</span>
                </div>
              </div>
            </div>

            <div className="chart-legend-list">
              <div className="legend-item">
                <span className="dot dot-ai"></span> AI: <strong>{stats.AI} Mahasiswa</strong> (
                {pctAI}%)
              </div>
              <div className="legend-item">
                <span className="dot dot-se"></span> SE: <strong>{stats.SE} Mahasiswa</strong> (
                {pctSE}%)
              </div>
              <div className="legend-item">
                <span className="dot dot-cn"></span> CN: <strong>{stats.CN} Mahasiswa</strong> (
                {pctCN}%)
              </div>
            </div>

            {/* Jika user masuk lewat Gform / melihat statistik saja, tampilkan tombol balik home ini */}
            {!rekomendasi && (
              <button className="btn-primary-home" onClick={() => setPage('welcome')}>
                Ke Halaman Utama Web 🏠
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
