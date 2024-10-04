import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, Image, FlatList, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRoute, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const VenueScreen = () => {
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userVote, setUserVote] = useState(null);
  const [coverCharge, setCoverCharge] = useState('');
  const [hasVisited, setHasVisited] = useState(false);
  const [photos, setPhotos] = useState([]);
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params;

  useEffect(() => {
    fetchVenueDetails();
    checkUserVote();
    checkUserVisit();
    fetchPhotos();
  }, []);

  const fetchVenueDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/venues/${id}`);
      setVenue(response.data);
      setCoverCharge(response.data.cover ? response.data.cover.toString() : '');
    } catch (error) {
      console.error('Error fetching venue details:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUserVote = async () => {
    try {
      const vote = await AsyncStorage.getItem(`vote_${id}`);
      if (vote) setUserVote(vote);
    } catch (error) {
      console.error('Error checking user vote:', error);
    }
  };

  const checkUserVisit = async () => {
    try {
      const visited = await AsyncStorage.getItem(`visited_${id}`);
      setHasVisited(!!visited);
    } catch (error) {
      console.error('Error checking user visit:', error);
    }
  };

  const fetchPhotos = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/venues/${id}/photos`);
      setPhotos(response.data);
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
  };

  const handleVote = async (voteType) => {
    if (userVote) return; // User has already voted

    try {
      const response = await axios.post('http://localhost:3000/vote', {
        venueId: id,
        voteType
      });
      setVenue(response.data);
      setUserVote(voteType);
      await AsyncStorage.setItem(`vote_${id}`, voteType);
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleCoverChange = async (value) => {
    setCoverCharge(value);
    try {
      const response = await axios.post(`http://localhost:3000/venues/${id}/cover`, {
        cover: value
      });
      setVenue(response.data);
    } catch (error) {
      console.error('Error updating cover charge:', error);
    }
  };

  const handleImHere = async () => {
    if (hasVisited) return; // User has already visited

    try {
      const response = await axios.post(`http://localhost:3000/venues/${id}/pop`);
      setVenue(response.data);
      setHasVisited(true);
      await AsyncStorage.setItem(`visited_${id}`, 'true');
    } catch (error) {
      console.error('Error updating pop:', error);
    }
  };

  const handleTakePhoto = async () => {
    if (!userVote) {
      Alert.alert("Vote Required", "Please vote for the venue before uploading a photo.");
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Sorry, we need camera permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.cancelled) {
      uploadPhoto(result.uri);
    }
  };

  const uploadPhoto = async (uri) => {
    const formData = new FormData();
    formData.append('photo', {
      uri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    });

    try {
      const response = await axios.post(`http://localhost:3000/venues/${id}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      fetchPhotos(); // Refresh the photo gallery
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
    }
  };

  const renderPhotoItem = ({ item }) => (
    <Image source={{ uri: item.url }} style={styles.photoItem} />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  if (!venue) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Venue not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.venueName}>{venue.name}</Text>
      <Text style={styles.venueType}>{venue.type}</Text>
      <View style={styles.ratingContainer}>
        <Text style={styles.ratingText}>Rating: {venue.upvotes - venue.downvotes}</Text>
      </View>
      <View style={styles.coverContainer}>
        <Text style={styles.coverLabel}>Cover Charge:</Text>
        <Picker
          selectedValue={coverCharge}
          style={styles.coverPicker}
          onValueChange={handleCoverChange}
        >
          <Picker.Item label="Select cover charge" value="" />
          <Picker.Item label="$5" value="5" />
          <Picker.Item label="$10" value="10" />
          <Picker.Item label="$15" value="15" />
          <Picker.Item label="$20" value="20" />
        </Picker>
      </View>
      <View style={styles.voteContainer}>
        <TouchableOpacity 
          style={[styles.voteButton, userVote === 'upvote' && styles.votedButton]}
          onPress={() => handleVote('upvote')}
          disabled={userVote !== null}
        >
          <Text style={styles.voteButtonText}>👍 Upvote</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.voteButton, userVote === 'downvote' && styles.votedButton]}
          onPress={() => handleVote('downvote')}
          disabled={userVote !== null}
        >
          <Text style={styles.voteButtonText}>👎 Downvote</Text>
        </TouchableOpacity>
      </View>
      {userVote && (
        <Text style={styles.votedText}>You've already voted for this venue.</Text>
      )}
      <TouchableOpacity 
        style={[styles.imHereButton, hasVisited && styles.visitedButton]}
        onPress={handleImHere}
        disabled={hasVisited}
      >
        <Text style={styles.imHereButtonText}>
          {hasVisited ? "You're here!" : "I'm Here!"}
        </Text>
      </TouchableOpacity>
      <Text style={styles.popText}>Current Pop: {venue.pop}</Text>
      <TouchableOpacity 
        style={[styles.photoButton, !userVote && styles.disabledButton]}
        onPress={handleTakePhoto}
        disabled={!userVote}
      >
        <Text style={styles.photoButtonText}>Take a Photo</Text>
      </TouchableOpacity>
      <FlatList
        data={photos}
        renderItem={renderPhotoItem}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        style={styles.photoGallery}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  imHereButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  visitedButton: {
    backgroundColor: '#B0B0B0',
  },
  imHereButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  popText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
    textAlign: 'center',
  },
  popText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
    textAlign: 'center',
  },

  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  venueName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  venueType: {
    fontSize: 20,
    color: '#666666',
    marginBottom: 16,
    textAlign: 'center',
  },
  ratingContainer: {
    marginBottom: 24,
  },
  ratingText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  coverContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  coverLabel: {
    fontSize: 18,
    marginRight: 10,
  },
  coverPicker: {
    width: 150,
    height: 50,
  },
  voteContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 16,
  },
  voteButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    width: '45%',
    alignItems: 'center',
  },
  votedButton: {
    backgroundColor: '#B0B0B0',
  },
  voteButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  votedText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',}, // ... (previous styles remain the same)
  photoButton: {
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#B0B0B0',
  },
  photoButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  photoGallery: {
    marginTop: 20,
  },
  photoItem: {
    width: 100,
    height: 100,
    marginRight: 10,
    borderRadius: 8,
  },
});

export default VenueScreen;