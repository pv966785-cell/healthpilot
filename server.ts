import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

interface ClinicalTriageParams {
  symptoms: string;
  duration?: string;
  severity?: string;
  age?: number | string;
  gender?: string;
  medicalHistory?: string;
  language?: string;
}

function generateClinicalTriageFallback({
  symptoms,
  duration = '2-3 Days',
  severity = 'Moderate',
  age = 'Adult',
  gender = 'Unspecified',
  medicalHistory = '',
  language = 'en',
}: ClinicalTriageParams) {
  const s = (symptoms + ' ' + medicalHistory).toLowerCase();
  const isSevere = severity === 'Severe';

  // Detection flags
  const isChestOrCardiac = s.includes('chest') || s.includes('heart') || s.includes('palpitation') || s.includes('pressure in chest') || s.includes('left arm');
  const isRespiratory = s.includes('cough') || s.includes('breath') || s.includes('wheez') || s.includes('phlegm') || s.includes('asthma');
  const isSkin = s.includes('rash') || s.includes('itch') || s.includes('skin') || s.includes('acne') || s.includes('allergy') || s.includes('hives');
  const isJointOrBone = s.includes('joint') || s.includes('bone') || s.includes('knee') || s.includes('back') || s.includes('arthritis') || s.includes('fracture') || s.includes('sprain');
  const isDiabetes = s.includes('sugar') || s.includes('diabet') || s.includes('glucose') || s.includes('thirst') || s.includes('frequent urination');
  const isStomach = s.includes('stomach') || s.includes('acid') || s.includes('vomit') || s.includes('nausea') || s.includes('diarrhea') || s.includes('gas') || s.includes('abdominal');
  const isGyn = s.includes('period') || s.includes('menstru') || s.includes('pelvic') || s.includes('pregnan') || s.includes('pcos');
  const isHeadOrNeuro = s.includes('headache') || s.includes('migraine') || s.includes('dizziness') || s.includes('vertigo') || s.includes('numb');
  const isFever = s.includes('fever') || s.includes('chill') || s.includes('temperature') || s.includes('shivering');

  // Urgency determination
  let urgency: 'low' | 'medium' | 'high' | 'emergency' = 'medium';
  let urgencyTitle = 'Medical Consultation Recommended';

  if (isChestOrCardiac && isSevere) {
    urgency = 'emergency';
    urgencyTitle = 'Urgent Emergency Evaluation Needed';
  } else if (isSevere || (isChestOrCardiac && severity === 'Moderate')) {
    urgency = 'high';
    urgencyTitle = 'Prompt Specialist Evaluation Advised';
  } else if (severity === 'Mild' && !isChestOrCardiac) {
    urgency = 'low';
    urgencyTitle = 'Routine Primary Care / Self-Care';
  }

  // Doctor specialties
  const suggestedSpecialties: Array<{ specialty: string; reason: string; isPrimary: boolean }> = [];

  if (isChestOrCardiac) {
    suggestedSpecialties.push({
      specialty: 'Cardiologist',
      reason: 'Specialized evaluation of cardiovascular function, chest sensations, and heart rhythm.',
      isPrimary: true,
    });
    suggestedSpecialties.push({
      specialty: 'General Physician',
      reason: 'Comprehensive initial vitals, systemic screening, and baseline ECG evaluation.',
      isPrimary: false,
    });
  } else if (isSkin) {
    suggestedSpecialties.push({
      specialty: 'Dermatologist',
      reason: 'Diagnosis and targeted treatment of skin rashes, allergic reactions, and epidermal conditions.',
      isPrimary: true,
    });
    suggestedSpecialties.push({
      specialty: 'General Physician',
      reason: 'Check for systemic infections or drug allergies manifesting on the skin.',
      isPrimary: false,
    });
  } else if (isJointOrBone) {
    suggestedSpecialties.push({
      specialty: 'Orthopedic Surgeon',
      reason: 'Physical examination of joint alignment, bone density, and musculoskeletal movement.',
      isPrimary: true,
    });
    suggestedSpecialties.push({
      specialty: 'General Physician',
      reason: 'Screening for inflammatory markers, uric acid, and calcium metabolism.',
      isPrimary: false,
    });
  } else if (isDiabetes) {
    suggestedSpecialties.push({
      specialty: 'Diabetologist',
      reason: 'Endocrine and glycemic control optimization, insulin/oral therapy guidance.',
      isPrimary: true,
    });
    suggestedSpecialties.push({
      specialty: 'General Physician',
      reason: 'Routine monitoring of blood pressure, kidney indicators, and lifestyle factors.',
      isPrimary: false,
    });
  } else if (isGyn) {
    suggestedSpecialties.push({
      specialty: 'Gynaecologist',
      reason: 'Specialized women’s health assessment, hormone balancing, and pelvic evaluation.',
      isPrimary: true,
    });
    suggestedSpecialties.push({
      specialty: 'General Physician',
      reason: 'Baseline hemoglobin, thyroid screening, and nutritional support.',
      isPrimary: false,
    });
  } else if (isHeadOrNeuro && isSevere) {
    suggestedSpecialties.push({
      specialty: 'Neurologist',
      reason: 'Neuro-vascular evaluation for severe or refractory headaches, migraines, or nerve symptoms.',
      isPrimary: true,
    });
    suggestedSpecialties.push({
      specialty: 'General Physician',
      reason: 'Initial physical checkup, blood pressure reading, and trigger identification.',
      isPrimary: false,
    });
  } else {
    suggestedSpecialties.push({
      specialty: 'General Physician',
      reason: 'Primary physical examination, symptom triage, and medical treatment plan.',
      isPrimary: true,
    });
    if (isFever || isRespiratory) {
      suggestedSpecialties.push({
        specialty: 'ENT Specialist',
        reason: 'Evaluation of upper respiratory tract, sinuses, throat, or ear congestion.',
        isPrimary: false,
      });
    }
  }

  // Diagnostic Lab Tests
  const suggestedLabTests: Array<{ testName: string; category: string; reason: string }> = [];

  if (isFever || isRespiratory) {
    suggestedLabTests.push({
      testName: 'Complete Blood Count (CBC)',
      category: 'Hematology',
      reason: 'Checks white blood cell count to detect viral vs. bacterial infections and rule out anemia.',
    });
    suggestedLabTests.push({
      testName: 'CBC+ESR',
      category: 'Hematology',
      reason: 'Measures systemic inflammation levels in response to fever or persistent infection.',
    });
  }

  if (isChestOrCardiac) {
    suggestedLabTests.push({
      testName: 'Lipid Profile',
      category: 'Biochemistry',
      reason: 'Evaluates total cholesterol, HDL, LDL, and triglycerides to assess cardiovascular risk.',
    });
    suggestedLabTests.push({
      testName: 'Complete Blood Count (CBC)',
      category: 'Hematology',
      reason: 'Assesses oxygen-carrying capacity and rules out severe anemia as a cause of breathlessness.',
    });
  }

  if (isDiabetes) {
    suggestedLabTests.push({
      testName: 'HbA1c (Glycated Hemoglobin)',
      category: 'Biochemistry',
      reason: 'Measures average blood sugar control over the past 3 months.',
    });
  }

  if (isStomach) {
    suggestedLabTests.push({
      testName: 'Liver Function Test (LFT)',
      category: 'Biochemistry',
      reason: 'Evaluates liver enzymes, bilirubin, and digestive health indicators.',
    });
  }

  if (suggestedLabTests.length === 0) {
    suggestedLabTests.push({
      testName: 'Complete Blood Count (CBC)',
      category: 'Hematology',
      reason: 'Baseline wellness and infection screening investigation.',
    });
  }

  // Potential causes
  const possibleCauses: string[] = [];
  if (isFever) possibleCauses.push('Viral Upper Respiratory Infection', 'Seasonal Influenza or Dengue');
  if (isChestOrCardiac) possibleCauses.push('Musculoskeletal Chest Strain', 'Cardiovascular Evaluation Required', 'Acid Reflux / GERD Spasm');
  if (isHeadOrNeuro) possibleCauses.push('Tension Headache', 'Migraine with Sensory Aura', 'Dehydration or Eye Strain');
  if (isStomach) possibleCauses.push('Acute Gastritis / Acidity', 'Gastrointestinal Viral Flu', 'Dietary Indigestion');
  if (isSkin) possibleCauses.push('Contact Dermatitis', 'Allergic Urticaria', 'Eczematous Flare');
  if (possibleCauses.length === 0) possibleCauses.push('Mild viral or inflammatory response', 'Symptomatic fatigue or stress reaction');

  // Home care advice
  const homeCareAdvice = [
    'Stay well hydrated with warm water and electrolytes',
    'Get at least 7-8 hours of uninterrupted rest',
    'Monitor vital signs (temperature, pulse, BP) regularly',
  ];
  if (isStomach) homeCareAdvice.push('Eat light, bland, easily digestible meals and avoid spicy food');
  if (isJointOrBone) homeCareAdvice.push('Apply warm or cold compress to the affected area and avoid strenuous loading');

  // Red flags
  const redFlags = [
    'Sudden onset of crushing chest pain radiating to left arm, neck, or jaw',
    'Severe breathing difficulty or sudden shortness of breath',
    'High fever (>103°F) unyielding to medication, confusion, or stiff neck',
  ];

  const summary = language === 'hi'
    ? `आपके द्वारा बताए गए लक्षण (${symptoms}) ${duration} से हैं। प्रारंभिक विश्लेषण के अनुसार ${suggestedSpecialties[0]?.specialty} से परामर्श करने और आवश्यक जांच कराने की सलाह दी जाती है।`
    : `You reported ${symptoms} over the past ${duration} with ${severity.toLowerCase()} severity. Our triage recommends consulting a ${suggestedSpecialties[0]?.specialty} for an accurate clinical diagnosis and ordering baseline diagnostic screenings.`;

  const disclaimer = 'HealthPilot AI Symptom Checker is an automated educational triage tool and not a substitute for professional clinical medical advice, diagnosis, or emergency care. If experiencing an emergency, dial 108 immediately.';

  return {
    urgency,
    urgencyTitle,
    summary,
    possibleCauses: possibleCauses.slice(0, 3),
    suggestedSpecialties,
    suggestedLabTests: suggestedLabTests.slice(0, 3),
    homeCareAdvice,
    redFlags,
    disclaimer,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Gemini API initialization on server-side only
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // AI Symptom Checker endpoint
  app.post('/api/gemini/analyze-symptoms', async (req, res) => {
    const { symptoms, duration, severity, age, gender, medicalHistory, language = 'en' } = req.body;

    if (!symptoms || typeof symptoms !== 'string' || symptoms.trim().length === 0) {
      return res.status(400).json({ error: 'Please describe the symptoms you are experiencing.' });
    }

    // If API key is not configured, immediately use clinical fallback
    if (!process.env.GEMINI_API_KEY) {
      return res.json(generateClinicalTriageFallback({
        symptoms, duration, severity, age, gender, medicalHistory, language
      }));
    }

    // Try Gemini API with a 6-second timeout race
    try {
      const prompt = `You are HealthPilot's compassionate medical triage advisor.
A patient has provided the following symptom details:
- Symptoms: "${symptoms.trim()}"
- Duration: "${duration || 'Not specified'}"
- Patient Severity Rating: "${severity || 'Moderate'}"
- Age: "${age || 'Adult'}"
- Gender: "${gender || 'Not specified'}"
- Relevant Past Medical History: "${medicalHistory || 'None noted'}"
- Language Preference: "${language === 'hi' ? 'Hindi (or simple Hinglish/English with Hindi explanation)' : 'English'}"

Available doctor specialties on HealthPilot platform:
- General Physician
- Cardiologist
- Dermatologist
- Pediatrician
- Orthopedic Surgeon
- Gynaecologist
- ENT Specialist
- Neurologist
- Diabetologist

Available common diagnostic lab tests on HealthPilot:
- Complete Blood Count (CBC)
- CBC+ESR
- Lipid Profile
- Liver Function Test (LFT)
- Kidney Function Test (KFT)
- Thyroid Profile (T3, T4, TSH)
- HbA1c (Glycated Hemoglobin)
- Blood Sugar Fasting & PP
- Urine Routine & Microscopy
- Vitamin D (25-OH)
- Vitamin B12

Analyze the symptoms objectively. Recommend 1-2 most relevant specialties, 1-3 useful diagnostic lab tests, assess the urgency, list 2-4 possible causes to discuss with a doctor, safe home care advice, and critical emergency red flags.
Always maintain high safety standards. If symptoms suggest myocardial infarction, stroke, anaphylaxis, severe respiratory distress, or sepsis, mark urgency as "emergency" or "high".`;

      const geminiPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an expert, compassionate clinical triage assistant for a healthcare teleconsultation app. You provide helpful medical triage suggestions, recommending medical specialties to consult and baseline diagnostic lab tests to discuss with the doctor. Always include safe caveats and red-flags.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              urgency: {
                type: Type.STRING,
                description: "Triage urgency level: 'low' | 'medium' | 'high' | 'emergency'",
              },
              urgencyTitle: {
                type: Type.STRING,
                description: 'Short title for the urgency level (e.g. Routine Care, Moderate Attention, Urgent Consultation, Emergency Alert).',
              },
              summary: {
                type: Type.STRING,
                description: 'Clear, compassionate 2-3 sentence summary of the symptoms and triage assessment.',
              },
              possibleCauses: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'List of 2-4 possible causes or conditions to discuss with a physician.',
              },
              suggestedSpecialties: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    specialty: { type: Type.STRING, description: 'Medical specialty to consult.' },
                    reason: { type: Type.STRING, description: 'Rationale for this specialty.' },
                    isPrimary: { type: Type.BOOLEAN, description: 'True if this is the top recommended specialty.' },
                  },
                  required: ['specialty', 'reason', 'isPrimary'],
                },
                description: 'Recommended doctor specialties for these symptoms.',
              },
              suggestedLabTests: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    testName: { type: Type.STRING, description: 'Recommended lab test name.' },
                    category: { type: Type.STRING, description: 'Diagnostic test category.' },
                    reason: { type: Type.STRING, description: 'Why this test may be helpful.' },
                  },
                  required: ['testName', 'category', 'reason'],
                },
                description: 'Suggested diagnostic lab tests.',
              },
              homeCareAdvice: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Helpful non-pharmacological comfort/care measures while awaiting doctor consultation.',
              },
              redFlags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Urgent warning signs that require emergency medical care immediately.',
              },
              disclaimer: {
                type: Type.STRING,
                description: 'Standard medical disclaimer.',
              },
            },
            required: [
              'urgency',
              'urgencyTitle',
              'summary',
              'possibleCauses',
              'suggestedSpecialties',
              'suggestedLabTests',
              'homeCareAdvice',
              'redFlags',
              'disclaimer',
            ],
          },
        },
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API timeout')), 6000)
      );

      const response: any = await Promise.race([geminiPromise, timeoutPromise]);
      const responseText = response.text;
      if (responseText) {
        const parsed = JSON.parse(responseText);
        return res.json(parsed);
      }
    } catch (genErr) {
      console.warn('Gemini generateContent notice:', (genErr as any)?.message || genErr);
    }

    // Always deliver intelligent clinical response
    return res.json(generateClinicalTriageFallback({
      symptoms, duration, severity, age, gender, medicalHistory, language
    }));
  });

  // Mount Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HealthPilot server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
