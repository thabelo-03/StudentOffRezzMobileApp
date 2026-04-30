import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Platform, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { WebView } from 'react-native-webview';
import api from '../services/api';
import {
  buildPlatformOverviewHTML, buildAllPaymentsHTML, buildUsersHTML, buildIssuesHTML,
  generatePaymentsCSV, generateUsersCSV, exportPDF, sharePDF
} from '../services/reportService';

const REPORT_TYPES = [
  { id: 'overview', title: 'Platform Overview', subtitle: 'Users, listings & location breakdown', icon: 'chart-bar', color: '#3182ce', format: 'PDF' },
  { id: 'payments_pdf', title: 'All Payments (PDF)', subtitle: 'Payment transactions with totals', icon: 'cash-multiple', color: '#38a169', format: 'PDF' },
  { id: 'payments_csv', title: 'All Payments (Excel)', subtitle: 'Export payments as spreadsheet', icon: 'file-excel', color: '#217346', format: 'CSV' },
  { id: 'users_pdf', title: 'User Report (PDF)', subtitle: 'All registered users & roles', icon: 'account-group', color: '#dd6b20', format: 'PDF' },
  { id: 'users_csv', title: 'User Report (Excel)', subtitle: 'Export users as spreadsheet', icon: 'file-excel', color: '#217346', format: 'CSV' },
  { id: 'issues', title: 'Issue Reports (PDF)', subtitle: 'All submitted issue reports', icon: 'alert-circle', color: '#e53e3e', format: 'PDF' },
];

const AdminReportGenerator = () => {
  const [generating, setGenerating] = useState(null);
  const [fromDate, setFromDate] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d; });
  const [toDate, setToDate] = useState(new Date());
  const [activePeriod, setActivePeriod] = useState('This Month');
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  // Preview state
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewHTML, setPreviewHTML] = useState('');
  const [previewFilename, setPreviewFilename] = useState('');

  const filterByDate = (data, dateField) => {
    const from = new Date(fromDate); from.setHours(0, 0, 0, 0);
    const to = new Date(toDate); to.setHours(23, 59, 59, 999);
    return data.filter(function(item) {
      var itemDate = item[dateField] || item.timestamp || item.paymentDate || item.createdAt;
      if (!itemDate) return true;
      var d = new Date(itemDate);
      return d >= from && d <= to;
    });
  };

  const dateLabel = (date) => date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  const handleGenerate = async (reportId) => {
    setGenerating(reportId);
    try {
      const dateRange = dateLabel(fromDate) + ' - ' + dateLabel(toDate);

      if (reportId === 'overview') {
        const [usersRes, housesRes] = await Promise.all([api.get('/admin/users'), api.get('/houses')]);
        const html = buildPlatformOverviewHTML(usersRes.data || [], filterByDate(housesRes.data || [], 'createdAt'), dateRange);
        setPreviewHTML(html); setPreviewFilename('Platform_Overview'); setPreviewVisible(true);
      } else if (reportId === 'payments_pdf') {
        const res = await api.get('/bookings/payments');
        const html = buildAllPaymentsHTML(filterByDate(res.data || [], 'paymentDate'), dateRange);
        setPreviewHTML(html); setPreviewFilename('All_Payments'); setPreviewVisible(true);
      } else if (reportId === 'payments_csv') {
        const res = await api.get('/bookings/payments');
        await generatePaymentsCSV(filterByDate(res.data || [], 'paymentDate'));
      } else if (reportId === 'users_pdf') {
        const res = await api.get('/admin/users');
        const html = buildUsersHTML(res.data || [], dateRange);
        setPreviewHTML(html); setPreviewFilename('User_Report'); setPreviewVisible(true);
      } else if (reportId === 'users_csv') {
        const res = await api.get('/admin/users');
        await generateUsersCSV(res.data || []);
      } else if (reportId === 'issues') {
        const res = await api.get('/reports');
        const html = buildIssuesHTML(filterByDate(res.data || [], 'timestamp'), dateRange);
        setPreviewHTML(html); setPreviewFilename('Issue_Reports'); setPreviewVisible(true);
      }
    } catch (error) {
      console.error('Report Error:', error);
      Alert.alert('Error', 'Failed to generate report. Please try again.');
    } finally {
      setGenerating(null);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Generate Reports</Text>
      <Text style={styles.subtitle}>Select a date range and report type to export</Text>

      {/* Date Range Filter */}
      <View style={styles.dateSection}>
        <Text style={styles.dateSectionTitle}>Date Range</Text>
        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowFromPicker(true)}>
            <Icon name="calendar-start" size={16} color="#3182ce" />
            <Text style={styles.dateBtnText}>{dateLabel(fromDate)}</Text>
          </TouchableOpacity>
          <Text style={styles.dateSeparator}>to</Text>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowToPicker(true)}>
            <Icon name="calendar-end" size={16} color="#3182ce" />
            <Text style={styles.dateBtnText}>{dateLabel(toDate)}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.presetRow}>
          {[
            { label: 'This Week', days: 7 },
            { label: 'This Month', days: 30 },
            { label: '3 Months', days: 90 },
            { label: 'All Time', days: 365 * 5 },
          ].map((preset) => (
            <TouchableOpacity
              key={preset.label}
              style={[styles.presetBtn, activePeriod === preset.label && styles.presetBtnActive]}
              onPress={() => {
                const d = new Date(); d.setDate(d.getDate() - preset.days);
                setFromDate(d); setToDate(new Date()); setActivePeriod(preset.label);
              }}
            >
              <Text style={[styles.presetText, activePeriod === preset.label && styles.presetTextActive]}>{preset.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {showFromPicker && (
        <DateTimePicker value={fromDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(e, d) => { setShowFromPicker(false); if (d) { setFromDate(d); setActivePeriod(''); } }} />
      )}
      {showToPicker && (
        <DateTimePicker value={toDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(e, d) => { setShowToPicker(false); if (d) { setToDate(d); setActivePeriod(''); } }} />
      )}

      {/* Report Type Cards */}
      {REPORT_TYPES.map((report) => (
        <TouchableOpacity
          key={report.id}
          style={styles.card}
          onPress={() => handleGenerate(report.id)}
          disabled={generating !== null}
          activeOpacity={0.7}
        >
          <View style={[styles.iconBox, { backgroundColor: report.color + '15' }]}>
            <Icon name={report.icon} size={28} color={report.color} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{report.title}</Text>
            <Text style={styles.cardSubtitle}>{report.subtitle}</Text>
          </View>
          <View style={styles.formatBadge}>
            {generating === report.id ? (
              <ActivityIndicator size="small" color={report.color} />
            ) : (
              <Text style={[styles.formatText, { color: report.color }]}>{report.format}</Text>
            )}
          </View>
        </TouchableOpacity>
      ))}

      {/* Preview Modal */}
      <Modal visible={previewVisible} animationType="slide" onRequestClose={() => setPreviewVisible(false)}>
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <TouchableOpacity onPress={() => setPreviewVisible(false)}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.previewTitle}>Report Preview</Text>
            <View style={{ width: 24 }} />
          </View>
          <WebView
            originWhitelist={['*']}
            source={{ html: previewHTML }}
            style={{ flex: 1 }}
            scalesPageToFit={true}
          />
          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.previewBtnPrint} onPress={async () => { setPreviewVisible(false); await exportPDF(previewHTML, previewFilename); }}>
              <Icon name="printer" size={18} color="#FFF" />
              <Text style={styles.previewBtnText}>Print / Save PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.previewBtnShare} onPress={async () => { setPreviewVisible(false); await sharePDF(previewHTML, previewFilename); }}>
              <Icon name="share-variant" size={18} color="#FFF" />
              <Text style={styles.previewBtnText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a365d', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },

  // Date Filter
  dateSection: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 20, elevation: 2 },
  dateSectionTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10 },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#ebf4ff', borderRadius: 10, padding: 12, gap: 8,
    borderWidth: 1, borderColor: '#bee3f8',
  },
  dateBtnText: { fontSize: 14, fontWeight: '500', color: '#3182ce' },
  dateSeparator: { marginHorizontal: 10, color: '#999', fontSize: 14 },
  presetRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, gap: 8 },
  presetBtn: { flex: 1, backgroundColor: '#F5F5F5', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  presetBtnActive: { backgroundColor: '#3182ce' },
  presetText: { fontSize: 12, fontWeight: '600', color: '#555' },
  presetTextActive: { color: '#FFF' },

  // Report Cards
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    borderRadius: 12, padding: 16, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5,
  },
  iconBox: {
    width: 50, height: 50, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 15,
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  cardSubtitle: { fontSize: 13, color: '#888', marginTop: 3 },
  formatBadge: {
    backgroundColor: '#F5F5F5', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, minWidth: 45, alignItems: 'center',
  },
  formatText: { fontWeight: 'bold', fontSize: 12 },

  // Preview Modal
  previewContainer: { flex: 1, backgroundColor: '#F4F6F8' },
  previewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50, backgroundColor: '#FFF', elevation: 2 },
  previewTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  previewActions: { flexDirection: 'row', padding: 12, gap: 10, backgroundColor: '#FFF', elevation: 4 },
  previewBtnPrint: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3182ce', padding: 14, borderRadius: 10, gap: 8 },
  previewBtnShare: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#38a169', padding: 14, borderRadius: 10, gap: 8 },
  previewBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});

export default AdminReportGenerator;
