import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const BarsClubsScreen = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const fetchVenues = async () => {
    try {
      const response = await axios.get('http://localhost:3000/venues');
      setVenues(response.data);
    } catch (error) {
      console.error('Error fetching venues:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchVenues();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchVenues();
  }, []);

  const navigateToVenueScreen = (venueId) => {
    navigation.navigate('Venue', { id: venueId });
  };

  const renderVenueItem = ({ item }) => (
    <TouchableOpacity
      style={styles.venueItem}
      onPress={() => navigateToVenueScreen(item.id)}
    >
      <View style={styles.venueInfo}>
        <Text style={styles.venueName}>{item.name}</Text>
        <Text style={styles.venueType}>{item.type}</Text>
        {item.cover && <Text style={styles.coverCharge}>Cover: ${item.cover}</Text>}
        <Text style={styles.popInfo}>Pop: {item.pop}</Text>
      </View>
      <View style={styles.ratingContainer}>
        <Text style={styles.ratingText}>{item.upvotes - item.downvotes}</Text>
        <Ionicons name="star" size={20} color="#FFD700" />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.headerTitle}>Bars & Clubs</Text>
      <FlatList
        data={venues}
        renderItem={renderVenueItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyListText}>No venues found</Text>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  popInfo: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  venueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  venueInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  venueType: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  coverCharge: {
    fontSize: 14,
    color: '#007AFF',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 4,
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
    color: '#666666',
  },
});

export default BarsClubsScreen;