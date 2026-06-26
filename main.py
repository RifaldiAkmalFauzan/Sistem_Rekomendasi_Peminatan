from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.post("/predict")
def predict(data: MahasiswaData):
    # --- ALGORITMA PENILAIAN INTEGRASI (AKADEMIK + MINAT + PSIKOLOGI) ---
    
    # AI condong ke teori/pola data (gaya_kerja tinggi)
    skor_ai = data.nilai_ml + data.minat_ai + (data.gaya_kerja * 0.5)
    
    # SE condong ke penelusuran arsitektur kode & produk nyata
    skor_se = data.nilai_rpl + data.minat_se + (data.problem_solving * 0.25) + (data.motivasi_karir * 0.25)
    
    # CN condong ke stabilitas sistem & infrastruktur belakang layar
    skor_cn = data.nilai_jarkom + data.minat_cn + (data.lingkungan_ideal * 0.5)

    # Menentukan klaster peminatan tertinggi
    if skor_ai >= skor_se and skor_ai >= skor_cn:
        rekomendasi = "AI"
    elif skor_se >= skor_ai and skor_se >= skor_cn:
        rekomendasi = "SE"
    else:
        rekomendasi = "CN"

    return {"rekomendasi": rekomendasi}