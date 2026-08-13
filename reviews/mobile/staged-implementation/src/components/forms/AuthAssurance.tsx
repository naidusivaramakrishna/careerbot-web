// AuthAssurance — trust badges + legal text shown on signin/signup.
// TS port of POC src/components/AuthAssurance.js.

import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export default function AuthAssurance() {
  return (
    <View style={styles.container}>
      <View style={styles.trustRow}>
        <Ionicons color="#637083" name="lock-closed-outline" size={13} />
        <Text style={styles.trustText}>Secure Login</Text>
      </View>
      <View style={styles.trustRow}>
        <Ionicons color="#637083" name="checkmark" size={14} />
        <Text style={styles.trustText}>Trusted by professionals</Text>
      </View>

      <View style={styles.legalBlock}>
        <Text style={styles.legalText}>
          By continuing, you agree to our <Text style={styles.legalLink}>Terms</Text> and{' '}
          <Text style={styles.legalLink}>Privacy policy</Text>.
        </Text>
        <Text style={styles.legalText}>your data is Secure &amp; encrypted.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 6, marginTop: 18 },
  trustRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  trustText: { color: '#637083', fontSize: 13, fontWeight: '600' },
  legalBlock: { alignItems: 'center', gap: 2, marginTop: 8 },
  legalText: { color: '#8d98a7', fontSize: 12, lineHeight: 17, textAlign: 'center' },
  legalLink: { color: '#1d4ed8', fontWeight: '700' },
});
