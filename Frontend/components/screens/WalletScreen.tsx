
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Transaction {
  id: string;
  type: 'earned' | 'spent';
  amount: number;
  description: string;
  date: string;
}

const WalletScreen = () => {
  const router = useRouter();
  const [balance] = React.useState(150);
  const [transactions] = React.useState<Transaction[]>([
    {
      id: '1',
      type: 'earned',
      amount: 25,
      description: 'Eco-friendly shopping bonus',
      date: '2024-01-15',
    },
    {
      id: '2',
      type: 'spent',
      amount: 10,
      description: 'Discount applied',
      date: '2024-01-14',
    },
    {
      id: '3',
      type: 'earned',
      amount: 50,
      description: 'Sustainable product purchase',
      date: '2024-01-13',
    },
  ]);

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <View style={[
          styles.transactionIcon,
          { backgroundColor: item.type === 'earned' ? '#4ade80' : '#f87171' }
        ]}>
          <Ionicons 
            name={item.type === 'earned' ? 'add' : 'remove'} 
            size={16} 
            color="white" 
          />
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <Text style={styles.transactionDate}>{item.date}</Text>
        </View>
      </View>
      <Text style={[
        styles.transactionAmount,
        { color: item.type === 'earned' ? '#4ade80' : '#f87171' }
      ]}>
        {item.type === 'earned' ? '+' : '-'}{item.amount} coins
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#5dade2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Green Coins Wallet</Text>
      </View>

      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Ionicons name="leaf" size={40} color="#4ade80" />
          <Text style={styles.balanceTitle}>Sustainable Green Coins</Text>
        </View>
        <Text style={styles.balanceAmount}>{balance}</Text>
        <Text style={styles.balanceSubtext}>Available Balance</Text>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="add-circle" size={24} color="white" />
            <Text style={styles.actionButtonText}>Earn More</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="gift" size={24} color="white" />
            <Text style={styles.actionButtonText}>Redeem</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.transactionsSection}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={24} color="#5dade2" />
        <Text style={styles.infoText}>
          Earn Green Coins by making sustainable choices and shopping eco-friendly products!
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 5,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  balanceCard: {
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  balanceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4ade80',
    marginBottom: 5,
  },
  balanceSubtext: {
    fontSize: 16,
    color: '#666',
    marginBottom: 25,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  actionButton: {
    backgroundColor: '#4ade80',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  transactionsSection: {
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 14,
    color: '#666',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#e3f2fd',
    margin: 15,
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
});

export default WalletScreen;
