// ─────────────────────────────────────────────────────────
// Metztli 2.0 — Directory Screen (Emergency Contacts)
// ─────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Phone, Building2, Stethoscope, Ambulance } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import { getDirectoryContacts, getMunicipalities } from '@/db/database';
import type { DirectoryContact } from '@/types';
import GlassCard from '@/components/GlassCard';

export default function DirectoryScreen() {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState<DirectoryContact[]>([]);
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [selectedMuni, setSelectedMuni] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const munis = await getMunicipalities();
      setMunicipalities(munis);
      
      const loadedContacts = await getDirectoryContacts(selectedMuni || undefined);
      setContacts(loadedContacts);
    };
    loadData();
  }, [selectedMuni]);

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`).catch(err => 
      console.error('Error opening dialer', err)
    );
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'casa_materna':
        return <Building2 size={24} color="#8B2635" />;
      case 'hospital_minsa':
        return <Stethoscope size={24} color="#2C3D30" />;
      case 'ambulancia':
        return <Ambulance size={24} color="#1A1A1A" />;
      default:
        return <Phone size={24} color="#1A1A1A" />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('directory.title')}</Text>
        <Text style={styles.headerSubtitle}>{t('directory.subtitle')}</Text>
      </View>

      {/* Filter Chips */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
          <TouchableOpacity 
            style={[styles.chip, selectedMuni === null && styles.chipActive]}
            onPress={() => setSelectedMuni(null)}
          >
            <Text style={[styles.chipText, selectedMuni === null && styles.chipTextActive]}>
              {t('directory.all_municipalities')}
            </Text>
          </TouchableOpacity>
          
          {municipalities.map(muni => (
            <TouchableOpacity 
              key={muni}
              style={[styles.chip, selectedMuni === muni && styles.chipActive]}
              onPress={() => setSelectedMuni(muni)}
            >
              <Text style={[styles.chipText, selectedMuni === muni && styles.chipTextActive]}>
                {muni}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {contacts.length === 0 ? (
          <Text style={styles.emptyText}>{t('directory.no_contacts')}</Text>
        ) : (
          contacts.map(contact => (
            <GlassCard key={contact.id} variant="default" className="mb-3">
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                   {getIconForType(contact.type)}
                </View>
                <View style={styles.infoContainer}>
                  <Text style={styles.institutionName}>{contact.institution_name}</Text>
                  <Text style={styles.municipalityText}>{contact.municipality}</Text>
                  <Text style={styles.typeText}>{t(`directory.${contact.type}`)}</Text>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.actionRow}>
                 <Text style={styles.phoneNumber}>{contact.phone_number}</Text>
                 <TouchableOpacity 
                   style={styles.callBtn}
                   onPress={() => handleCall(contact.phone_number)}
                 >
                    <Phone size={18} color="#FFF" />
                    <Text style={styles.callBtnText}>{t('directory.call')}</Text>
                 </TouchableOpacity>
              </View>
            </GlassCard>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  filtersContainer: {
    marginBottom: 12,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(44, 61, 48, 0.1)',
  },
  chipActive: {
    backgroundColor: '#2C3D30',
    borderColor: '#2C3D30',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  chipTextActive: {
    color: '#FFF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 40,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(44, 61, 48, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  institutionName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  municipalityText: {
    fontSize: 13,
    color: '#666',
  },
  typeText: {
    fontSize: 12,
    color: '#8B2635',
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(44, 61, 48, 0.1)',
    marginVertical: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2C3D30',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  callBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  }
});
