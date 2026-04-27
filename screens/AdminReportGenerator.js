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

  const handleGenerate = async (reportId) => {
    setGenerating(reportId);
    try {
      if (reportId === 'overview') {
        const [usersRes, housesRes] = await Promise.all([
          api.get('/admin/users'),
          api.get('/houses')
        ]);
        await generatePlatformOverviewPDF(usersRes.data || [], housesRes.data || []);
      } else if (reportId === 'payments_pdf') {
        const res = await api.get('/bookings/payments');
        await generateAllPaymentsPDF(res.data || []);
      } else if (reportId === 'payments_csv') {
        const res = await api.get('/bookings/payments');
        await generatePaymentsCSV(res.data || []);
      } else if (reportId === 'users_pdf') {
        const res = await api.get('/admin/users');
        await generateUsersPDF(res.data || []);
      } else if (reportId === 'users_csv') {
        const res = await api.get('/admin/users');
        await generateUsersCSV(res.data || []);
      } else if (reportId === 'issues') {
        const res = await api.get('/reports');
        await generateIssuesPDF(res.data || []);
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
      <Text style={styles.subtitle}>Select a report type to generate and export</Text>

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
  subtitle: { fontSize: 14, color: '#666', marginBottom: 25 },
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
