# from fastapi import FastAPI
# from pydantic import BaseModel
# from fastapi.middleware.cors import CORSMiddleware

# app = FastAPI()

# # Mengizinkan CORS agar frontend Netlify bisa berkomunikasi dengan Railway
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# class MahasiswaData(BaseModel):
#     nama: str
#     kelas: str
#     nilai_ml: float         
#     nilai_rpl: float        
#     nilai_jarkom: float     
#     minat_ai: int
#     minat_se: int
#     minat_cn: int
#     gaya_kerja: int
#     problem_solving: int
#     motivasi_karir: int
#     lingkungan_ideal: int

# # --- TAMBAHKAN RUTE INI AGAR TIDAK 404 ---
# @app.get("/")
# def home():
#     return {"status": "Server FastAPI berjalan lancar!", "endpoint_prediksi": "/predict"}

# @app.post("/predict")
# def predict(data: MahasiswaData):
#     # AI condong ke teori/pola data
#     skor_ai = data.nilai_ml + data.minat_ai + (data.gaya_kerja * 0.5)
    
#     # SE condong ke penelusuran arsitektur kode & produk nyata
#     skor_se = data.nilai_rpl + data.minat_se + (data.problem_solving * 0.25) + (data.motivasi_karir * 0.25)
    
#     # CN condong ke stabilitas sistem & infrastruktur belakang layar
#     skor_cn = data.nilai_jarkom + data.minat_cn + (data.lingkungan_ideal * 0.5)

#     # Menentukan klaster peminatan tertinggi
#     if skor_ai >= skor_se and skor_ai >= skor_cn:
#         rekomendasi = "AI"
#     elif skor_se >= skor_ai and skor_se >= skor_cn:
#         rekomendasi = "SE"
#     else:
#         rekomendasi = "CN"

#     return {"rekomendasi": rekomendasi}


# ML VERSION 
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from supabase import create_client
import os
import pandas as pd

app = FastAPI()

# Mengizinkan CORS agar frontend Netlify bisa berkomunikasi dengan Railway
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Koneksi ke Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://byepziuzjqzeutimlkba.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

class MahasiswaData(BaseModel):
    nama: str
    kelas: str
    nilai_ml: float         
    nilai_rpl: float        
    nilai_jarkom: float     
    minat_ai: int
    minat_se: int
    minat_cn: int
    gaya_kerja: int
    problem_solving: int
    motivasi_karir: int
    lingkungan_ideal: int

# Variabel global untuk model ML
ml_model = None
label_encoder = None
is_model_ready = False

def load_and_train_model():
    """
    Ambil data dari Supabase, latih model Decision Tree/Random Forest
    Ini adalah inti MACHINE LEARNING-nya!
    """
    global ml_model, label_encoder, is_model_ready
    
    try:
        # 1. AMBIL DATA TRAINING DARI SUPABASE
        response = supabase.table('peminatan').select('*').not_('rekomendasi', 'is', 'null').execute()
        data = response.data
        
        if not data or len(data) < 3:
            print("⚠️ Data di Supabase kurang dari 3, ML belum bisa dilatih")
            return False
        
        # 2. KONVERSI KE DATAFRAME (Struktur data untuk ML)
        df = pd.DataFrame(data)
        
        # 3. TENTUKAN FITUR (X) DAN LABEL/TARGET (y)
        # Ini adalah FEATURE ENGINEERING dalam Machine Learning
        feature_columns = [
            'nilai_ml', 'nilai_rpl', 'nilai_jarkom',
            'minat_ai', 'minat_se', 'minat_cn',
            'gaya_kerja', 'problem_solving', 'motivasi_karir', 'lingkungan_ideal'
        ]
        
        X = df[feature_columns].values  # Data input (10 fitur)
        y = df['rekomendasi'].values     # Target output (AI/SE/CN)
        
        # 4. ENCODE LABEL (Ubah AI/SE/CN jadi angka)
        label_encoder = LabelEncoder()
        y_encoded = label_encoder.fit_transform(y)
        
        # 5. TRAIN MODEL MACHINE LEARNING
        # Bisa pilih salah satu algoritma:
        
        # OPSI A: Decision Tree (Mudah dipahami)
        ml_model = DecisionTreeClassifier(
            criterion='gini',      # Cara mengukur split terbaik
            max_depth=5,           # Batasi kedalaman pohon
            random_state=42,       # Untuk konsistensi hasil
            min_samples_split=2,   # Minimal sampel untuk split
            min_samples_leaf=1     # Minimal sampel di leaf node
        )
        
        # OPSI B: Random Forest (Lebih akurat, ensemble learning)
        # ml_model = RandomForestClassifier(
        #     n_estimators=100,      # Jumlah pohon keputusan
        #     max_depth=5,
        #     random_state=42,
        #     n_jobs=-1              # Gunakan semua core CPU
        # )
        
        # TRAINING PROSES INI YANG DISEBUT "MACHINE LEARNING"!
        ml_model.fit(X, y_encoded)
        
        is_model_ready = True
        print(f"✅ Model ML berhasil dilatih dengan {len(X)} sampel data!")
        print(f"🎯 Fitur yang digunakan: {feature_columns}")
        print(f"📊 Algoritma: {type(ml_model).__name__}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error training model: {e}")
        return False

# --- ENDPOINT (Tetap sama seperti semula) ---
@app.get("/")
def home():
    return {
        "status": "Server FastAPI dengan Machine Learning!",
        "algoritma": "Decision Tree Classifier",
        "model_ready": is_model_ready,
        "endpoint_prediksi": "/predict"
    }

@app.post("/predict")
def predict(data: MahasiswaData):
    """
    FUNGSI PREDIKSI DENGAN MACHINE LEARNING
    Input: Data mahasiswa (10 fitur)
    Output: Rekomendasi peminatan (AI/SE/CN)
    """
    
    # Jika model ML sudah siap, gunakan ML
    if is_model_ready and ml_model and label_encoder:
        # 1. SIAPKAN DATA INPUT (Harus sama persis dengan training)
        input_features = np.array([[
            data.nilai_ml,
            data.nilai_rpl,
            data.nilai_jarkom,
            data.minat_ai,
            data.minat_se,
            data.minat_cn,
            data.gaya_kerja,
            data.problem_solving,
            data.motivasi_karir,
            data.lingkungan_ideal
        ]])
        
        # 2. PREDIKSI MENGGUNAKAN MODEL ML YANG SUDAH DILATIH
        prediction_encoded = ml_model.predict(input_features)[0]
        
        # 3. DECODE HASIL PREDIKSI (Dari angka ke AI/SE/CN)
        rekomendasi = label_encoder.inverse_transform([prediction_encoded])[0]
        
        return {"rekomendasi": rekomendasi}
    
    # FALLBACK: Jika model belum siap, gunakan rule-based
    else:
        print("⚠️ Model ML belum siap, menggunakan rule-based...")
        
        # Rule-based logic (sama seperti aslinya)
        skor_ai = data.nilai_ml + data.minat_ai + (data.gaya_kerja * 0.5)
        skor_se = data.nilai_rpl + data.minat_se + (data.problem_solving * 0.25) + (data.motivasi_karir * 0.25)
        skor_cn = data.nilai_jarkom + data.minat_cn + (data.lingkungan_ideal * 0.5)
        
        if skor_ai >= skor_se and skor_ai >= skor_cn:
            rekomendasi = "AI"
        elif skor_se >= skor_ai and skor_se >= skor_cn:
            rekomendasi = "SE"
        else:
            rekomendasi = "CN"
        
        return {"rekomendasi": rekomendasi}

# --- TRAIN MODEL SAAT SERVER PERTAMA KALI JALAN ---
@app.on_event("startup")
async def startup_event():
    print("=" * 50)
    print("🚀 MACHINE LEARNING SERVER STARTING...")
    print("📡 Mencoba koneksi ke Supabase dan melatih model...")
    print("=" * 50)
    load_and_train_model()