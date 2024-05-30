import React, { useState, useEffect } from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet } from 'react-native';
import axios from 'axios';
import { Icon } from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Animatable from 'react-native-animatable';

export default function SearchScreen({ navigation }) {
  // State variables
  const [query, setQuery] = useState(''); // Stores the search query
  const [results, setResults] = useState([]); // Stores the search results
  const [favorites, setFavorites] = useState([]); // Stores the favorite items

  // Load favorites from AsyncStorage when the component mounts
  useEffect(() => {
    const loadFavorites = async () => {
      const storedFavorites = await AsyncStorage.getItem('favorites');
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    };
    loadFavorites();
  }, []);

  // Fetch search results when the query changes
  useEffect(() => {
    const fetchResults = async () => {
      if (query.trim() !== '') {
        try {
          const response = await axios.get(`https://itunes.apple.com/search?term=${query}`);
          setResults(response.data.results);
        } catch (error) {
          console.error(error);
        }
      } else {
        setResults([]);
      }
    };

    const debounceFetch = setTimeout(fetchResults, 300); // Debounce the fetch to avoid making too many requests

    return () => clearTimeout(debounceFetch); // Cleanup function to clear the timeout
  }, [query]);

  // Toggle an item as favorite
  const toggleFavorite = async (item) => {
    let updatedFavorites;
    if (favorites.some(favorite => favorite.trackId === item.trackId)) {
      updatedFavorites = favorites.filter(favorite => favorite.trackId !== item.trackId);
    } else {
      updatedFavorites = [...favorites, item];
    }
    setFavorites(updatedFavorites);
    await AsyncStorage.setItem('favorites', JSON.stringify(updatedFavorites));
  };

  // Navigate to the Favorites screen
  const navigateToFavorites = () => {
    navigation.navigate('Favorites');
  };

  // Navigate to the Ladder screen
  const navigateToLadder = () => {
    navigation.navigate('Ladder');
  };

  return (
    <View style={styles.container}>
      {/* Search input */}
      <TextInput
        style={styles.input}
        placeholder="Search for an artist or track"
        value={query}
        onChangeText={setQuery}
      />

      {/* View Favorites button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={navigateToFavorites}>
          <Text style={styles.buttonText}>View Favorites</Text>
        </TouchableOpacity>
      </View>

      {/* Ladder Song button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={navigateToLadder}>
          <Text style={styles.buttonText}>Ladder Song</Text>
        </TouchableOpacity>
      </View>

      {/* Search results */}
      <FlatList
        data={results}
        keyExtractor={(item) => (item.trackId ? item.trackId.toString() : item.collectionId.toString())}
        renderItem={({ item }) => {
          const isFavorite = favorites.some(favorite => favorite.trackId === item.trackId);
          return (
            <Animatable.View animation="fadeIn" duration={800} style={styles.itemContainer}>
              {/* Item text */}
              <TouchableOpacity onPress={() => navigation.navigate('Detail', { item })} style={styles.itemTextContainer}>
                <Text style={styles.itemText}>{item.trackName ? `${item.trackName} by ${item.artistName}` : item.collectionName}</Text>
              </TouchableOpacity>

              {/* Favorite icon */}
              <Icon
                name={isFavorite ? 'heart' : 'heart-o'}
                type="font-awesome"
                color={isFavorite ? '#f50' : '#ccc'}
                onPress={() => toggleFavorite(item)}
                style={styles.icon}
              />
            </Animatable.View>
          );
        }}
      />
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingLeft: 10,
    borderRadius: 5,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    elevation: 2,
  },
  itemTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  itemText: {
    fontSize: 18,
  },
  icon: {
    padding: 10,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#6200EE',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});
