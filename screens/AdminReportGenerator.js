import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';
import {
  generatePlatformOverviewPDF,
  generateAllPaymentsPDF,
  generateUsersPDF,
  generateIssuesPDF,
  generatePaymentsCSV,
  generateUsersCSV
} from '../services/reportService';

const REPORT_TYPES = [
  { id: 'overview', title: 'Platform Overview', subtitle: 'Users, listings & location breakdown', icon: 'chart-bar', color: '#007BFF', format: 'PDF' },
  { id: 'payments_pdf', title: 'All Payments (PDF)', subtitle: 'Payment transactions with totals', icon: 'cash-multiple', color: '#4CAF50', format: 'PDF' },
  { id: 'payments_csv', title: 'All Payments (Excel)', subtitle: 'Export payments as spreadsheet', icon: 'file-excel', color: '#217346', format: 'CSV' },
  { id: 'users_pdf', title: 'User Report (PDF)', subtitle: 'All registered users & roles', icon: 'account-group', color: '#FF9800', format: 'PDF' },
  { id: 'users_csv', title: 'User Report (Excel)', subtitle: 'Export users as spreadsheet', icon: 'file-excel', color: '#217346', format: 'CSV' },
  { id: 'issues', title: 'Issue Reports (PDF)', subtitle: 'All submitted issue reports', icon: 'alert-circle', color: '#D32F2F', format: 'PDF' },
];

const AdminReportGenerator = () => {
  const [generating, setGenerating] = useState(null);

  // Date filter state - preset based (no native DateTimePicker)
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d;
  });
  const [toDate, setToDate] = useState(new Date());
  const [activePeriod, setActivePeriod] = useState('This Month');

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
        const [usersRes, housesRes] = await Promise.all([
          api.get('/admin/users'),
          api.get('/houses')
        ]);
        const filteredHouses = filterByDate(housesRes.data || [], 'createdAt');
        await generatePlatformOverviewPDF(usersRes.data || [], filteredHouses, dateRange);
      } else if (reportId === 'payments_pdf') {
        const res = await api.get('/bookings/payments');
        const filtered = filterByDate(res.data || [], 'paymentDate');
        await generateAllPaymentsPDF(filtered, dateRange);
      } else if (reportId === 'payments_csv') {
        const res = await api.get('/bookings/payments');
        const filtered = filterByDate(res.data || [], 'paymentDate');
        await generatePaymentsCSV(filtered);
      } else if (reportId === 'users_pdf') {
        const res = await api.get('/admin/users');
        await generateUsersPDF(res.data || [], dateRange);
      } else if (reportId === 'users_csv') {
        const res = await api.get('/admin/users');
        await generateUsersCSV(res.data || []);
      } else if (reportId === 'issues') {
        const res = await api.get('/reports');
        const filtered = filterByDate(res.data || [], 'timestamp');
        await generateIssuesPDF(filtered, dateRange);
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

      {/* Date Range Filter - Preset Buttons Only */}
      <View style={styles.dateSection}>
        <View style={styles.dateDisplayRow}>
          <Icon name="calendar-range" size={18} color="#007BFF" />
          <Text style={styles.dateDisplayText}>Period: {dateLabel(fromDate)} - {dateLabel(toDate)}</Text>
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
                const d = new Date();
                d.setDate(d.getDate() - preset.days);
                setFromDate(d);
                setToDate(new Date());
                setActivePeriod(preset.label);
              }}
            >
              <Text style={[styles.presetText, activePeriod === preset.label && styles.presetTextActive]}>{preset.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },

  // Date Filter
  dateSection: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 20, elevation: 2 },
  dateDisplayRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  dateDisplayText: { fontSize: 14, color: '#555', fontWeight: '500' },
  presetRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  presetBtn: { flex: 1, backgroundColor: '#F5F5F5', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  presetBtnActive: { backgroundColor: '#007BFF' },
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
});

export default AdminReportGenerator;
