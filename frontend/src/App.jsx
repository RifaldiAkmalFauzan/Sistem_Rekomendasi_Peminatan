import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import './App.css';

// 📢 KONFIGURASI SUPABASE (Menggunakan nama key Netlify kamu)
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

  // --- LOGIKA SYNC DATA DARI GOOGLE FORM VIA URL ---
  useEffect(() => {
    fetchStatistics();

    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get('page') === 'result') {
      setPage('result');

      if (queryParams.get('source') === 'gform') {
        const fetchLatestGformData = async () => {
          try {
            // Ambil data paling baru masuk dari database Supabase
            const { data, error } = await supabase
              .from('peminatan')
              .select('nama, rekomendasi')
              .order('created_at', { ascending: false }) // Mencoba created_at, jika error ubah ke 'id'
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

  // --- AMBIL STATISTIK GLOBAL DARI SUPABASE ---
  const fetchStatistics = async () => {
    try {
      const { data, error } = await supabase.from('peminatan').select('rekomendasi');
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

  // --- LOGIKA SUBMIT WEB LOKAL ---
  const handleWebQuizSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('https://web-production-f68e4.up.railway.app/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const jsonResult = await response.json();
      const hasilPeminatan = jsonResult.rekomendasi;

      await supabase
        .from('peminatan')
        .insert([{ nama: formData.nama, kelas: formData.kelas, rekomendasi: hasilPeminatan }]);

      setRekomendasi(hasilPeminatan);
      setNamaResponden(formData.nama);
      await fetchStatistics();
      setPage('result');
    } catch (err) {
      console.error('Error kuis lokal:', err);
      alert('Terjadi gangguan koneksi ke server Railway!');
    }
  };

  // Perhitungan persentase donat chart
  const pctAI = stats.total > 0 ? Math.round((stats.AI / stats.total) * 100) : 0;
  const pctSE = stats.total > 0 ? Math.round((stats.SE / stats.total) * 100) : 0;
  const pctCN = stats.total > 0 ? 100 - pctAI - pctSE : 0;

  return (
    <div className="app-container">
      {/* NAVBAR ASLI KAMU */}
      <nav className="navbar">
        <div className="navbar-left">
          <div className="app-logo">🧠</div>
          <div>
            <h1>Sistem Rekomendasi Peminatan</h1>
            <p>Teknik Informatika • Smart Decision Engine</p>
          </div>
        </div>
        <div className="respondent-badge">
          <span className="badge-dot"></span>
          {stats.total} Responden
        </div>
      </nav>

      <main className="content">
        {/* ================= WELCOME SCREEN ================= */}
        {page === 'welcome' && (
          <div className="welcome-card card">
            <h2>Temukan Peminatan IT Terbaikmu</h2>
            <p>
              Analisis profesional menggabungkan rekam jejak akademik, minat teknologi, dan tes
              kecenderungan psikologi karier.
            </p>
            <div
              style={{ display: 'flex', gap: '15px', justifyContent: 'center', margin: '20px 0' }}
            >
              <button className="btn btn-primary" onClick={() => setPage('quiz')}>
                Mulai Profiling (Web)
              </button>
              <button className="btn btn-secondary" onClick={() => setPage('result')}>
                Lihat Statistik Live 📊
              </button>
            </div>
          </div>
        )}

        {/* ================= FORM KUIS LOKAL WEB ================= */}
        {page === 'quiz' && (
          <div className="quiz-card card">
            <h2>Formulir Profiling Peminatan IT</h2>
            <form onSubmit={handleWebQuizSubmit} className="form-grid">
              <div className="form-group">
                <label>Nama Lengkap / Inisial</label>
                <input
                  type="text"
                  required
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Kelas / Angkatan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: IF-4A"
                  onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Nilai Machine Learning / Statistika</label>
                <select
                  onChange={(e) =>
                    setFormData({ ...formData, nilai_ml: parseFloat(e.target.value) })
                  }
                >
                  <option value="4.0">4.0 - A</option>
                  <option value="3.5">3.5 - B+</option>
                  <option value="3.0">3.0 - B</option>
                </select>
              </div>
              <div className="form-group">
                <label>Nilai Rekayasa Perangkat Lunak / PBO</label>
                <select
                  onChange={(e) =>
                    setFormData({ ...formData, nilai_rpl: parseFloat(e.target.value) })
                  }
                >
                  <option value="4.0">4.0 - A</option>
                  <option value="3.5">3.5 - B+</option>
                  <option value="3.0">3.0 - B</option>
                </select>
              </div>
              <div className="form-group">
                <label>Nilai Jaringan Komputer / OS</label>
                <select
                  onChange={(e) =>
                    setFormData({ ...formData, nilai_jarkom: parseFloat(e.target.value) })
                  }
                >
                  <option value="4.0">4.0 - A</option>
                  <option value="3.5">3.5 - B+</option>
                  <option value="3.0">3.0 - B</option>
                </select>
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-block"
                style={{ gridColumn: '1/-1', marginTop: '15px' }}
              >
                Hitung Hasil AI Rekomendasi 🎯
              </button>
            </form>
          </div>
        )}

        {/* ================= HALAMAN HASIL & GRAFIK (AMAN DARI BLANK) ================= */}
        {page === 'result' && (
          <div className="result-layout">
            {/* 🎯 KARTU REKOMENDASI PERSONAL (Hanya muncul jika ada datanya) */}
            {rekomendasi && TRACK_DETAILS[rekomendasi] && (
              <div
                className="result-card card animate-fade-in"
                style={{ borderTop: `5px solid ${TRACK_DETAILS[rekomendasi].borderColor}` }}
              >
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>
                  {TRACK_DETAILS[rekomendasi].icon}
                </div>
                <h2 style={{ color: TRACK_DETAILS[rekomendasi].textColor }}>
                  Hasil Rekomendasi {namaResponden ? `untuk ${namaResponden}` : 'Anda'}:{' '}
                  {rekomendasi}
                </h2>
                <p style={{ margin: '15px 0', lineHeight: '1.6', color: '#4b5563' }}>
                  {TRACK_DETAILS[rekomendasi].description}
                </p>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setRekomendasi(null);
                    setNamaResponden('');
                    setPage('welcome');
                  }}
                >
                  Isi Ulang 🔄
                </button>
              </div>
            )}

            {/* 📊 KARTU GRAFIK STATISTIK (Aman, Selalu muncul dalam kondisi apa pun!) */}
            <div className="stats-card card">
              <h2>📊 Analisis Database Responden</h2>
              <div className="stats-content">
                <div className="chart-container">
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
                    <div className="chart-center">
                      <span className="total-count">{stats.total}</span>
                      <span className="total-label">TOTAL</span>
                    </div>
                  </div>
                </div>

                <div className="legend-container">
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#3b82f6' }}></span>
                    <span>
                      AI: <strong>{stats.AI}</strong> ({pctAI}%)
                    </span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#10b981' }}></span>
                    <span>
                      SE: <strong>{stats.SE}</strong> ({pctSE}%)
                    </span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#f59e0b' }}></span>
                    <span>
                      CN: <strong>{stats.CN}</strong> ({pctCN}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Tombol kembali tambahan jika diakses via pintu belakang Gform */}
              {!rekomendasi && (
                <button
                  className="btn btn-primary"
                  onClick={() => setPage('welcome')}
                  style={{ marginTop: '20px', width: '100%' }}
                >
                  Ke Halaman Utama 🏠
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
