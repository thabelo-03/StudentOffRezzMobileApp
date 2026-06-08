import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RNPickerSelect from 'react-native-picker-select';
import api from '../services/api';

const TOTAL_STEPS = 4;

// ============================================================
// Step Components
// ============================================================

const Step1Academics = ({ formData, updateField, errors, universities, campuses }) => (
  <View style={styles.stepContainer}>
    <View style={styles.stepHeader}>
      <View style={styles.stepIconCircle}>
        <Icon name="school" size={24} color="#2563eb" />
      </View>
      <View>
        <Text style={styles.stepTitle}>Academics</Text>
        <Text style={styles.stepDesc}>Where are you studying?</Text>
      </View>
    </View>

    <Text style={styles.label}>University</Text>
    <View style={[styles.pickerContainer, errors.universityId && styles.inputError]}>
      <RNPickerSelect
        placeholder={{ label: 'Select University...', value: '' }}
        items={universities.map(u => ({ label: u.name, value: u._id }))}
        onValueChange={(val) => updateField('universityId', val)}
        value={formData.universityId}
        style={pickerStyles}
      />
    </View>
    {errors.universityId && <Text style={styles.fieldError}>{errors.universityId}</Text>}

    <Text style={styles.label}>Campus</Text>
    <View style={[styles.pickerContainer, errors.campusId && styles.inputError]}>
      <RNPickerSelect
        placeholder={{ label: 'Select Campus...', value: '' }}
        items={campuses.map(c => ({ label: c.name, value: c._id }))}
        onValueChange={(val) => updateField('campusId', val)}
        value={formData.campusId}
        disabled={!formData.universityId}
        style={pickerStyles}
      />
    </View>
    {errors.campusId && <Text style={styles.fieldError}>{errors.campusId}</Text>}

    <Text style={styles.label}>Program of Study</Text>
    <TextInput
      style={[styles.input, errors.programOfStudy && styles.inputError]}
      placeholder="e.g. Computer Science"
      placeholderTextColor="#a0aec0"
      value={formData.programOfStudy}
      onChangeText={(val) => updateField('programOfStudy', val)}
    />
    {errors.programOfStudy && <Text style={styles.fieldError}>{errors.programOfStudy}</Text>}

    <Text style={styles.label}>Year of Study</Text>
    <View style={[styles.pickerContainer, errors.yearOfStudy && styles.inputError]}>
      <RNPickerSelect
        placeholder={{ label: 'Select Year...', value: '' }}
        items={[
          ...Array.from({ length: 10 }, (_, i) => ({ label: `${i + 1}`, value: `${i + 1}` })),
          { label: 'Postgrad', value: 'Postgrad' },
        ]}
        onValueChange={(val) => updateField('yearOfStudy', val)}
        value={formData.yearOfStudy}
        style={pickerStyles}
      />
    </View>
    {errors.yearOfStudy && <Text style={styles.fieldError}>{errors.yearOfStudy}</Text>}
  </View>
);

const Step2Identity = ({ formData, updateField, errors }) => (
  <View style={styles.stepContainer}>
    <View style={styles.stepHeader}>
      <View style={[styles.stepIconCircle, { backgroundColor: '#f3e8ff' }]}>
        <Icon name="account" size={24} color="#7c3aed" />
      </View>
      <View>
        <Text style={styles.stepTitle}>Identity</Text>
        <Text style={styles.stepDesc}>Tell us a bit about you.</Text>
      </View>
    </View>

    <Text style={styles.label}>Gender</Text>
    <View style={[styles.pickerContainer, errors.gender && styles.inputError]}>
      <RNPickerSelect
        placeholder={{ label: 'Select Gender...', value: '' }}
        items={[
          { label: 'Male', value: 'male' },
          { label: 'Female', value: 'female' },
          { label: 'Other', value: 'other' },
          { label: 'Prefer not to say', value: 'prefer not to say' },
        ]}
        onValueChange={(val) => updateField('gender', val)}
        value={formData.gender}
        style={pickerStyles}
      />
    </View>
    {errors.gender && <Text style={styles.fieldError}>{errors.gender}</Text>}

    <Text style={styles.label}>How do you pay rent?</Text>
    <View style={[styles.pickerContainer, errors.fundingSource && styles.inputError]}>
      <RNPickerSelect
        placeholder={{ label: 'Select funding source...', value: '' }}
        items={[
          { label: 'Parents / Guardian', value: 'Parents' },
          { label: 'Self-funded', value: 'Self-funded' },
          { label: 'Scholarship', value: 'Scholarship' },
        ]}
        onValueChange={(val) => updateField('fundingSource', val)}
        value={formData.fundingSource}
        style={pickerStyles}
      />
    </View>
    {errors.fundingSource && <Text style={styles.fieldError}>{errors.fundingSource}</Text>}
    <Text style={styles.hint}>This helps landlords trust your application.</Text>

    <Text style={styles.label}>Personal Bio</Text>
    <TextInput
      style={[styles.input, styles.textArea, errors.personalBio && styles.inputError]}
      placeholder="Briefly describe yourself..."
      placeholderTextColor="#a0aec0"
      value={formData.personalBio}
      onChangeText={(val) => updateField('personalBio', val)}
      multiline
      maxLength={500}
    />
    <Text style={styles.charCount}>{formData.personalBio.length}/500</Text>
    {errors.personalBio && <Text style={styles.fieldError}>{errors.personalBio}</Text>}
  </View>
);

const Step3Habits = ({ formData, updateField }) => (
  <View style={styles.stepContainer}>
    <View style={styles.stepHeader}>
      <View style={[styles.stepIconCircle, { backgroundColor: '#fff7ed' }]}>
        <Icon name="coffee" size={24} color="#ea580c" />
      </View>
      <View>
        <Text style={styles.stepTitle}>Lifestyle</Text>
        <Text style={styles.stepDesc}>Your daily habits.</Text>
      </View>
    </View>

    <View style={styles.rowPickers}>
      <View style={styles.halfPicker}>
        <Text style={styles.label}>Smoking</Text>
        <View style={styles.pickerContainer}>
          <RNPickerSelect
            items={[
              { label: 'Non-Smoker', value: 'Non-Smoker' },
              { label: 'Social', value: 'Social' },
              { label: 'Regular', value: 'Regular' },
            ]}
            onValueChange={(val) => updateField('smoking', val)}
            value={formData.smoking}
            style={pickerStyles}
            placeholder={{}}
          />
        </View>
      </View>
      <View style={styles.halfPicker}>
        <Text style={styles.label}>Drinking</Text>
        <View style={styles.pickerContainer}>
          <RNPickerSelect
            items={[
              { label: 'Non-Drinker', value: 'Non-Drinker' },
              { label: 'Social', value: 'Social' },
              { label: 'Regular', value: 'Regular' },
            ]}
            onValueChange={(val) => updateField('drinking', val)}
            value={formData.drinking}
            style={pickerStyles}
            placeholder={{}}
          />
        </View>
      </View>
    </View>

    <Text style={styles.label}>Visitors Policy</Text>
    <View style={styles.pickerContainer}>
      <RNPickerSelect
        items={[
          { label: 'No Visitors', value: 'No Visitors' },
          { label: 'Weekends Only', value: 'Weekends Only' },
          { label: 'Anytime', value: 'Anytime' },
        ]}
        onValueChange={(val) => updateField('visitorPolicy', val)}
        value={formData.visitorPolicy}
        style={pickerStyles}
        placeholder={{}}
      />
    </View>

    <Text style={styles.label}>Sleep Schedule</Text>
    <View style={styles.pickerContainer}>
      <RNPickerSelect
        items={[
          { label: 'Early Bird (5am-9pm)', value: 'Early Bird' },
          { label: 'Night Owl (11am-3am)', value: 'Night Owl' },
          { label: 'Flexible', value: 'Flexible' },
        ]}
        onValueChange={(val) => updateField('sleepSchedule', val)}
        value={formData.sleepSchedule}
        style={pickerStyles}
        placeholder={{}}
      />
    </View>
  </View>
);

const Step4Vibe = ({ formData, updateField }) => {
  const renderSlider = (label, field, lowLabel, highLabel, getLabelFn) => {
    const value = formData[field];
    return (
      <View style={styles.sliderSection}>
        <View style={styles.sliderHeader}>
          <Text style={styles.label}>{label}</Text>
          <View style={styles.sliderBadge}>
            <Text style={styles.sliderBadgeText}>{getLabelFn(value)}</Text>
          </View>
        </View>
        <View style={styles.sliderTrack}>
          {[1, 2, 3, 4, 5].map((v) => (
            <TouchableOpacity
              key={v}
              style={[styles.sliderDot, value >= v && styles.sliderDotActive]}
              onPress={() => updateField(field, v)}
            >
              <Text style={[styles.sliderDotText, value >= v && styles.sliderDotTextActive]}>{v}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabelText}>{lowLabel}</Text>
          <Text style={styles.sliderLabelText}>{highLabel}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <View style={[styles.stepIconCircle, { backgroundColor: '#fef9c3' }]}>
          <Icon name="star-four-points" size={24} color="#ca8a04" />
        </View>
        <View>
          <Text style={styles.stepTitle}>The Vibe</Text>
          <Text style={styles.stepDesc}>Find your perfect match.</Text>
        </View>
      </View>

      {renderSlider('Cleanliness', 'cleanliness', 'Messy ok', 'Spotless',
        (v) => v <= 2 ? 'Relaxed' : v >= 4 ? 'Clean Freak' : 'Balanced')}
      {renderSlider('Noise Tolerance', 'noiseTolerance', 'Library Silence', 'Loud Music OK',
        (v) => v <= 2 ? 'Library Silence' : v >= 4 ? 'Loud Music OK' : 'Moderate')}
      {renderSlider('Social Battery', 'socialVibe', 'Introvert', 'Party Animal',
        (v) => v <= 2 ? 'Introvert' : v >= 4 ? 'Party Animal' : 'Chill')}
    </View>
  );
};

// ============================================================
// Main Component
// ============================================================

export default function StudentOnboardingScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Form data — matches the web's StudentOnboarding.jsx
  const [formData, setFormData] = useState({
    universityId: '', campusId: '', programOfStudy: '', yearOfStudy: '',
    gender: '', personalBio: '', fundingSource: 'Parents',
    smoking: 'Non-Smoker', drinking: 'Non-Drinker',
    visitorPolicy: 'Weekends Only', sleepSchedule: 'Flexible',
    cleanliness: 3, noiseTolerance: 3, socialVibe: 3,
  });

  // API data
  const [universities, setUniversities] = useState([]);
  const [campuses, setCampuses] = useState([]);

  // Fetch universities
  useEffect(() => {
    api.get('/universities')
      .then(res => setUniversities(res.data || []))
      .catch(err => console.error('Failed to load universities:', err));
  }, []);

  // Fetch campuses when university changes
  useEffect(() => {
    if (formData.universityId) {
      setFormData(prev => ({ ...prev, campusId: '' }));
      api.get(`/universities/campuses/${formData.universityId}`)
        .then(res => setCampuses(res.data || []))
        .catch(err => console.error('Failed to load campuses:', err));
    } else {
      setCampuses([]);
    }
  }, [formData.universityId]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  // ---- Validation ----
  const validateStep = () => {
    const e = {};
    if (step === 1) {
      if (!formData.universityId) e.universityId = 'Please select a university.';
      if (!formData.campusId) e.campusId = 'Please select a campus.';
      if (!formData.programOfStudy.trim()) e.programOfStudy = 'Program of study is required.';
      if (!formData.yearOfStudy) e.yearOfStudy = 'Year of study is required.';
    }
    if (step === 2) {
      if (!formData.gender) e.gender = 'Please select your gender.';
      if (!formData.fundingSource) e.fundingSource = 'Please select a funding source.';
      if (formData.personalBio.length > 500) e.personalBio = 'Bio cannot exceed 500 characters.';
    }
    // Steps 3 & 4 have sensible defaults, no strict validation needed
    return e;
  };

  const handleNext = () => {
    const validationErrors = validateStep();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrors({});
    try {
      // Payload shape matches the web's StudentOnboarding → PUT /api/profiles/student/me
      const payload = {
        universityId: formData.universityId,
        campusId: formData.campusId,
        programOfStudy: formData.programOfStudy,
        yearOfStudy: formData.yearOfStudy,
        gender: formData.gender,
        personalBio: formData.personalBio,
        lifestyle: {
          smoking: formData.smoking,
          drinking: formData.drinking,
          visitorPolicy: formData.visitorPolicy,
          sleepSchedule: formData.sleepSchedule,
          cleanliness: formData.cleanliness,
          noiseTolerance: formData.noiseTolerance,
          socialVibe: formData.socialVibe,
        },
        logistics: {
          fundingSource: formData.fundingSource,
        },
      };
      await api.put('/profiles/student/me', payload);
      // Navigate to Student home after onboarding
      navigation.reset({ index: 0, routes: [{ name: 'Student' }] });
    } catch (err) {
      console.error('Onboarding submit error:', err);
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        Alert.alert('Error', err.response?.data?.error || 'Failed to save profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Allow skipping onboarding — go straight to the student home
    navigation.reset({ index: 0, routes: [{ name: 'Student' }] });
  };

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>Step {step} of {TOTAL_STEPS}</Text>
          <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Error banner */}
        {errors.general && (
          <View style={styles.errorBanner}>
            <Icon name="alert-circle-outline" size={20} color="#e53e3e" />
            <Text style={styles.errorBannerText}>{errors.general}</Text>
          </View>
        )}

        {step === 1 && <Step1Academics formData={formData} updateField={updateField} errors={errors} universities={universities} campuses={campuses} />}
        {step === 2 && <Step2Identity formData={formData} updateField={updateField} errors={errors} />}
        {step === 3 && <Step3Habits formData={formData} updateField={updateField} />}
        {step === 4 && <Step4Vibe formData={formData} updateField={updateField} />}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.backBtn} onPress={step === 1 ? handleSkip : handleBack}>
          <Icon name={step === 1 ? 'skip-forward' : 'arrow-left'} size={18} color="#666" />
          <Text style={styles.backBtnText}>{step === 1 ? 'Skip' : 'Back'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.nextBtnText}>{step === TOTAL_STEPS ? 'Complete Profile' : 'Next Step'}</Text>
              <Icon name={step === TOTAL_STEPS ? 'check' : 'arrow-right'} size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },

  // Progress
  progressSection: { paddingTop: 55, paddingHorizontal: 20, paddingBottom: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  progressPercent: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  progressBarBg: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#2563eb', borderRadius: 3 },

  // Scroll
  scrollContent: { padding: 20, paddingBottom: 120 },

  // Step container
  stepContainer: { backgroundColor: '#fff', borderRadius: 20, padding: 24, elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 14 },
  stepIconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  stepTitle: { fontSize: 20, fontWeight: '800', color: '#1a365d' },
  stepDesc: { fontSize: 13, color: '#718096', marginTop: 2 },

  // Labels & inputs
  label: { fontSize: 13, fontWeight: '700', color: '#4a5568', marginBottom: 6, marginTop: 14 },
  hint: { fontSize: 11, color: '#a0aec0', marginTop: 4 },
  charCount: { fontSize: 11, color: '#a0aec0', textAlign: 'right', marginTop: 4 },
  input: { backgroundColor: '#f7fafc', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#2d3748' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  inputError: { borderColor: '#e53e3e', backgroundColor: '#fff5f5' },
  fieldError: { color: '#e53e3e', fontSize: 12, marginTop: 4, marginLeft: 4 },

  // Picker
  pickerContainer: { backgroundColor: '#f7fafc', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14, overflow: 'hidden' },

  // Row pickers
  rowPickers: { flexDirection: 'row', gap: 12 },
  halfPicker: { flex: 1 },

  // Slider (dot-style for mobile)
  sliderSection: { marginTop: 20 },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sliderBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  sliderBadgeText: { fontSize: 11, fontWeight: '700', color: '#2563eb' },
  sliderTrack: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  sliderDot: { flex: 1, height: 44, borderRadius: 12, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#e2e8f0' },
  sliderDotActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  sliderDotText: { fontSize: 15, fontWeight: '700', color: '#94a3b8' },
  sliderDotTextActive: { color: '#fff' },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  sliderLabelText: { fontSize: 10, color: '#a0aec0' },

  // Error banner
  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff5f5', borderRadius: 12, padding: 14, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#e53e3e', gap: 10 },
  errorBannerText: { flex: 1, fontSize: 13, color: '#c53030', lineHeight: 18 },

  // Footer
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 34, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 16 },
  backBtnText: { fontSize: 14, fontWeight: '600', color: '#666' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2563eb', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, elevation: 3, shadowColor: '#2563eb', shadowOpacity: 0.3, shadowRadius: 8 },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

const pickerStyles = StyleSheet.create({
  inputIOS: { fontSize: 15, paddingVertical: 12, paddingHorizontal: 14, color: '#2d3748' },
  inputAndroid: { fontSize: 15, paddingVertical: 8, paddingHorizontal: 14, color: '#2d3748' },
});
