import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
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

  // Date filter state
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1); // Default: 1 month ago
    return d;
  });
  const [toDate, setToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const filterByDate = (data, dateField = 'timestamp') => {
    const from = new Date(fromDate); from.setHours(0, 0, 0, 0);
    const to = new Date(toDate); to.setHours(23, 59, 59, 999);
    return data.filter(item => {
      const itemDate = item[dateField] || item.timestamp || item.paymentDate || item.createdAt;
      if (!itemDate) return true; // Include items without dates
      const d = new Date(itemDate);
      return d >= from && d <= to;
    });
  };

  const dateLabel = (date) => date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  const handleGenerate = async (reportId) => {
    setGenerating(reportId);
    try {
      const dateRange = `${dateLabel(fromDate)} — ${dateLabel(toDate)}`;

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
        const filtered = filterByDate(res.data || []);
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

      {/* Date Range Filter */}
      <View style={styles.dateSection}>
        <Text style={styles.dateLabel}>Date Range</Text>
        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowFromPicker(true)}>
            <Icon name="calendar-start" size={18} color="#007BFF" />
            <Text style={styles.dateBtnText}>{dateLabel(fromDate)}</Text>
          </TouchableOpacity>

          <Text style={styles.dateSeparator}>to</Text>

          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowToPicker(true)}>
            <Icon name="calendar-end" size={18} color="#007BFF" />
            <Text style={styles.dateBtnText}>{dateLabel(toDate)}</Text>
          </TouchableOpacity>
        </View>

        {/* Quick date presets */}
        <View style={styles.presetRow}>
          {[
            { label: 'This Week', days: 7 },
            { label: 'This Month', days: 30 },
            { label: '3 Months', days: 90 },
            { label: 'All Time', days: 365 * 5 },
          ].map((preset) => (
            <TouchableOpacity
              key={preset.label}
              style={styles.presetBtn}
              onPress={() => {
                const d = new Date();
                d.setDate(d.getDate() - preset.days);
                setFromDate(d);
                setToDate(new Date());
              }}
            >
              <Text style={styles.presetText}>{preset.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {showFromPicker && (
        <DateTimePicker
          value={fromDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowFromPicker(false);
            if (date) setFromDate(date);
          }}
        />
      )}
      {showToPicker && (
        <DateTimePicker
          value={toDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowToPicker(false);
            if (date) setToDate(date);
          }}
        />
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },

  // Date Filter
  dateSection: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 20, elevation: 2 },
  dateLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10 },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F0F4FF', borderRadius: 10, padding: 12, gap: 8,
    borderWidth: 1, borderColor: '#D0DCFF',
  },
  dateBtnText: { fontSize: 14, fontWeight: '500', color: '#007BFF' },
  dateSeparator: { marginHorizontal: 10, color: '#999', fontSize: 14 },
  presetRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, gap: 8 },
  presetBtn: { flex: 1, backgroundColor: '#F5F5F5', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  presetText: { fontSize: 11, fontWeight: '600', color: '#555' },

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
